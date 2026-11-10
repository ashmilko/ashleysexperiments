# Color Camera MVP: handoff notes

I'm a student with a demo due **tomorrow**. I'm not very experienced with Node or terminals, so explain steps simply, run commands for me when you can, and tell me plainly what you changed.

## The concept (final product vision)
A portable camera: press a button, the photo uploads to a server, stays **blurred and locked for 24 hours**, then unlocks. After that you explore photos by **color** using hand gestures.

The final device would be an ESP32-CAM that uploads over Wi-Fi. **This MVP simulates it:**
- An **Arduino button** (USB serial to the laptop) triggers a photo on a **phone** (or the laptop webcam as a stand-in).
- The phone uploads the photo to a **Node server on the laptop**.
- A **p5.js gallery page** shows photos blurred and locked, with a countdown, then unlocked after **20 seconds** (demo shortcut for 24 hours).
- Each photo's **brightest color** is extracted. The user picks a color by hovering a rainbow bar with their **hand** (ml5 handPose). Matching photos grow and drift toward the hand. Pinch opens a photo.

## Data flow
```
Arduino button -> USB serial -> gallery.html (Web Serial)
  -> WebSocket "snap" -> server.js -> broadcast -> phone.html takes photo
  -> POST /upload (JPEG) -> server.js saves to uploads/ -> broadcast "photo"
  -> gallery.html loads image, extracts color, shows blurred + locked
```

## Files
```
color-camera/
  server.js          Express + ws. POST /upload (raw image/jpeg), GET /photos, static files,
                     WebSocket relay of {type:"snap"} and {type:"photo"}. REVEAL_SECONDS = 20.
  package.json       express, ws
  public/
    phone.html       Plain JS (no p5). getUserMedia camera, listens for "snap" over WebSocket,
                     uploads JPEG. Has a "Native camera" file-input fallback and a SNAP button.
    gallery.html     p5.js + @gohai/p5.webserial + ml5 handPose. Does everything on screen.
  uploads/           created at runtime
```

## How to run
```
npm install
node server.js
```
- Fake phone (laptop webcam): http://localhost:3000/phone.html
- Gallery (Chrome or Edge): http://localhost:3000/gallery.html
- Press **SPACE** in the gallery tab to trigger a photo without the Arduino.
- A real phone's camera needs **https**, so use a tunnel: `ngrok http 3000` or `cloudflared tunnel --url http://localhost:3000`, then open `<https-url>/phone.html` on the phone.

## Arduino (already uploaded to my Uno/Nano, should not need changes)
Pin 2 = button to GND (INPUT_PULLUP). A0 = optional potentiometer. Baud 9600.
It prints `SNAP\n` on button press and `P,<0-1023>\n` for the pot (the gallery maps the pot to a hue).

```cpp
const int buttonPin = 2;
const int potPin = A0;
int lastState = HIGH;
int lastPot = -100;
unsigned long lastSend = 0;

void setup() {
  Serial.begin(9600);
  pinMode(buttonPin, INPUT_PULLUP);
}

void loop() {
  int currentState = digitalRead(buttonPin);
  if (lastState == HIGH && currentState == LOW) {
    Serial.println("SNAP");
    delay(200);
  }
  lastState = currentState;

  if (millis() - lastSend > 30) {
    int pot = analogRead(potPin);
    if (abs(pot - lastPot) > 2) {
      Serial.print("P,");
      Serial.println(pot);
      lastPot = pot;
    }
    lastSend = millis();
  }
}
```

## Known gotchas
- The `@gohai/p5.webserial` library uses `createSerial()`, `port.open(9600)`, `port.available()`, `port.readUntil("\n")`. It does NOT have `new p5.WebSerial()`. Don't mix the two APIs.
- Web Serial only works in **Chrome or Edge**, on https or localhost. The Arduino IDE Serial Monitor must be closed or the port is busy.
- ml5 handPose and the p5/ml5 scripts load from CDNs, so the gallery needs internet.
- The "blur" is only a visual effect in this MVP (the image URL is still fetchable). The real product would serve only a blurred copy server-side until the reveal time. That's fine for the demo, just mention it in the pitch.
- The photo list is in memory, so restarting the server empties the gallery (files stay in uploads/).
- Phone must keep the page open with the screen on.

## What I need from you (in priority order)
1. **Run it and find out what's broken.** Run `npm install` and `node server.js`, check the terminal for errors, and test the laptop-only flow (phone.html + gallery.html + SPACE key). I told someone it "isn't working well" but haven't pinned down exactly what fails, so investigate and tell me what you find.
2. Make the laptop-only flow solid first: SPACE -> photo uploads -> blurred locked tile appears -> unlocks after 20s -> color border and dot on the rainbow bar.
3. Then the Arduino button via the Connect Arduino button in the gallery.
4. Then the real phone over an https tunnel.
5. Then hand tracking and the color picker. If hand tracking is flaky, the mouse fallback must work (it's built in: mouse position = hand, click = pinch).

## Demo-day safety net (keep these working)
- **R** key reveals all photos instantly, **C** clears the color filter, **SPACE** snaps.
- If the phone or tunnel fails, the laptop webcam via phone.html works as the camera.
- Add a very visible on-screen message if something is disconnected (server offline, camera blocked, Arduino not connected) so problems are obvious during the demo.

## Style
Keep it simple and in plain files (no build tools, no frameworks). Don't over-engineer. Prefer small fixes that I can understand and explain in my presentation.

## Current status (updated after the first working session)
The code in this folder was rebuilt from these notes and the laptop-only flow works on the student's Mac.
Some notes above are now out of date. What is true now:
- **Done and tested:** SPACE -> photo -> blurred locked tile with countdown -> unlocks at 20s -> color border + dot on the rainbow bar. Rainbow hover filter, click to open, R / C / ESC keys, red/yellow on-screen warnings, auto-reconnect when the server restarts.
- **Libraries are local**, in `public/libs/` (p5 1.11.11, ml5 1.3.1, @gohai/p5.webserial 1.1.3). The gallery no longer needs CDNs. Only the ml5 hand model downloads from the internet.
- **Photos survive a server restart** (server.js rebuilds the list from uploads/ using file times).
- **Upload limit raised to 25 MB**; the phone also scales photos to max 1600 px before uploading.
- **Arduino:** tested with a simulated serial port (SNAP split across chunks, P,<value> lines). `port.open(9600)` is called with no preset so clone boards (CH340) show up. Knob changes under 20 are ignored (stops a floating A0 from jittering the color). Not yet tested on the real board.
- **Hand tracking:** if the model fails to download, ml5 still calls the ready callback with `handPose.model === null`; the gallery checks for that and falls back to the mouse. Not yet tested with a real hand.

## Next steps
3. Test the real Arduino button (Connect Arduino button, Serial Monitor closed).
4. Real phone over an https tunnel (`cloudflared tunnel --url http://localhost:3000`, open `<https-url>/phone.html`).
5. Real hand tracking with internet; tune pinch threshold (`gap < 0.3`) and pointer mapping if needed.
