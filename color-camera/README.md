# Color Camera MVP

## Run it
```
npm install
node server.js
```
1. Open **http://localhost:3000/phone.html** (laptop webcam stand-in). Put it in its **own window**, not a tab, so the browser keeps the camera running.
2. Open **http://localhost:3000/gallery.html** in **Chrome or Edge**.
3. Click the gallery and press **SPACE**. A blurred, locked photo appears and unlocks after 20 seconds.

## Keys (demo safety net)
- **SPACE**: take a photo
- **R**: reveal (unlock) all photos now
- **C**: clear the color filter
- **ESC**: close an opened photo
- Mouse = hand, click = pinch. The mouse takes over whenever you move it.

## Arduino
Close the Arduino IDE Serial Monitor, then click **Connect Arduino** in the gallery and pick the port.
After the first time, reloading the page reconnects automatically.

## Real phone
The phone camera needs https, so run a tunnel in a second terminal:
```
cloudflared tunnel --url http://localhost:3000
```
(or `ngrok http 3000`), then open `<the https link>/phone.html` on the phone.
If live camera fails, the **Native camera** button on the phone uses the normal camera app.

## On-screen warnings
- Red = demo is broken (server offline, no camera page open, camera error, snap got no photo).
- Yellow = optional part missing (Arduino, hand tracking). SPACE and the mouse still work.

The p5, ml5 and serial libraries are inside `public/libs/`, so the page works without internet.
Only hand tracking needs internet (it downloads its model the first time).
