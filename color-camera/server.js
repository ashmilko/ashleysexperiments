// Color Camera MVP server
// - Serves the web pages in public/
// - POST /upload   : receives a JPEG from the phone, saves it in uploads/
// - GET  /photos   : list of all photos (with their unlock time)
// - WebSocket      : relays {type:"snap"} to the phone and {type:"photo"} to the gallery

const express = require("express");
const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { WebSocketServer } = require("ws");

const PORT = process.env.PORT || 3000;
const REVEAL_SECONDS = 20; // demo shortcut for 24 hours
const UPLOAD_DIR = path.join(__dirname, "uploads");

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// The photo list lives in memory, but we rebuild it from uploads/ on startup,
// so restarting the server does not empty the gallery.
const photos = fs
  .readdirSync(UPLOAD_DIR)
  .filter((f) => f.toLowerCase().endsWith(".jpg"))
  .map((f) => {
    const takenAt = fs.statSync(path.join(UPLOAD_DIR, f)).mtimeMs;
    return { url: "/uploads/" + f, takenAt, revealAt: takenAt + REVEAL_SECONDS * 1000 };
  })
  .sort((a, b) => a.takenAt - b.takenAt);

const app = express();
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(UPLOAD_DIR));
app.get("/", (req, res) => res.redirect("/gallery.html"));

app.get("/photos", (req, res) => {
  res.json({ photos, now: Date.now(), revealSeconds: REVEAL_SECONDS });
});

// Phone photos can be several MB, so raise the size limit (the default is only 100 KB).
app.post("/upload", express.raw({ type: "image/*", limit: "25mb" }), (req, res) => {
  if (!req.body || !req.body.length) {
    console.log("Upload rejected: empty body or wrong Content-Type");
    return res.status(400).json({ error: "No image received" });
  }
  const takenAt = Date.now();
  const name = takenAt + ".jpg";
  fs.writeFileSync(path.join(UPLOAD_DIR, name), req.body);
  const photo = { url: "/uploads/" + name, takenAt, revealAt: takenAt + REVEAL_SECONDS * 1000 };
  photos.push(photo);
  console.log(`Photo saved: ${name} (${Math.round(req.body.length / 1024)} KB)`);
  broadcast({ type: "photo", photo, now: Date.now() });
  res.json({ ok: true, photo });
});

// Friendly error if an upload is too large or broken (instead of an HTML stack trace)
app.use((err, req, res, next) => {
  console.log("Upload error:", err.message);
  res.status(err.status || 500).json({ error: err.message });
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcast(msg) {
  const text = JSON.stringify(msg);
  for (const client of wss.clients) {
    if (client.readyState === 1) client.send(text);
  }
}

// Tell every page how many camera pages are connected,
// so the gallery can warn when no camera is listening.
function sendStatus() {
  let cameras = 0;
  for (const c of wss.clients) if (c.role === "phone" && c.readyState === 1) cameras++;
  broadcast({ type: "status", cameras });
}

wss.on("connection", (socket) => {
  socket.role = "unknown";
  socket.on("message", (data) => {
    let msg;
    try {
      msg = JSON.parse(data);
    } catch {
      return;
    }
    if (msg.type === "hello") {
      socket.role = msg.role;
      console.log(`${msg.role} page connected`);
      sendStatus();
    } else if (msg.type === "snap") {
      console.log("SNAP -> asking camera page to take a photo");
      broadcast({ type: "snap" });
    } else if (msg.type === "cameraError") {
      console.log("Camera page error:", msg.message);
      broadcast(msg); // forward to the gallery so it shows on screen
    }
  });
  socket.on("close", () => {
    if (socket.role !== "unknown") console.log(`${socket.role} page disconnected`);
    sendStatus();
  });
  sendStatus();
});

server.listen(PORT, () => {
  console.log(`\nColor Camera server running (photos unlock after ${REVEAL_SECONDS}s)`);
  console.log(`  Gallery:     http://localhost:${PORT}/gallery.html`);
  console.log(`  Fake phone:  http://localhost:${PORT}/phone.html`);
  for (const nets of Object.values(os.networkInterfaces())) {
    for (const n of nets || []) {
      if (n.family === "IPv4" && !n.internal) console.log(`  On Wi-Fi:    http://${n.address}:${PORT}/phone.html  (real phone camera needs an https tunnel)`);
    }
  }
  console.log(`  ${photos.length} photo(s) loaded from uploads/\n`);
});
