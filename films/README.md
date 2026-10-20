# Film Print Pro films

Two short films made for [Film Print Pro](https://github.com/reubenson/film-print-pro). Each folder has the scene (`scene.js`) and a `preview.mp4` you can watch before printing.

| Film | Length | Pages (8x6 layout) |
|---|---|---|
| `ashley-xiang/`: magical-girl transformation that ends on the name "ASHLEY XIANG" | 16 s, 192 frames | 4 |
| `moon-cat/`: a gray tabby chases a star across the moon and catches it | 14 s, 168 frames | 4 |

## Printing one

You need Node.js 22 or newer, Google Chrome, a US Letter printer and a phone camera.

```sh
git clone https://github.com/reubenson/film-print-pro
cd film-print-pro
npm install
npm run new-film                                          # creates film/
cp ../ashleysexperiments/films/moon-cat/scene.js film/scene.js   # pick a film
npm run bake
npm run dev                                               # open the URL in Chrome
```

Then, in the app:

1. **2 · Print:** print the test page first, then the sheets. In Chrome's print dialog use Letter paper, scale 100, no margins, headers and footers off, and background graphics on.
2. **3 · Compose:** photograph each page flat and evenly lit with all corner markers visible, drop the photos in, and press **Export MP4**.

To switch films, copy the other `scene.js` over `film/scene.js` and run `npm run bake` again.
