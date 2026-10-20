// Moon Name: a magical-girl transformation that ends on "ASHLEY XIANG".
// Pinks and golds are translated into black, white and light gray.

import { shots, svg, gray, ease, lerp, clamp } from '../src/direct/scene-kit.js';

export const meta = { title: 'Ashley Xiang', fps: 12, duration: 16 };

const NIGHT = gray(0.12);
const WHITE = gray(1);
const INK = gray(0);
const RAY = gray(0.75);
const FONT = 'system-ui, Helvetica, Arial, sans-serif';

const outBack = (p) => {
  const c = 1.9;
  return 1 + (c + 1) * (p - 1) ** 3 + c * (p - 1) ** 2;
};

// A crescent moon, cut with a mask so it works over any background.
function crescent(id, cx, cy, r, fill, rot = -20) {
  return `<defs><mask id="${id}"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#fff"/>
    <circle cx="${cx + r * 0.45}" cy="${cy - r * 0.2}" r="${r * 0.85}" fill="#000"/></mask></defs>
    <g transform="rotate(${rot} ${cx} ${cy})"><circle cx="${cx}" cy="${cy}" r="${r}" fill="${fill}" mask="url(#${id})"/></g>`;
}

// Four-point sparkle; `s` is its half-size.
function sparkle(x, y, s, fill) {
  if (s <= 1) return '';
  const k = s * 0.18;
  return `<path transform="translate(${x} ${y})" fill="${fill}" d="M0 ${-s} Q${k} ${-k} ${s} 0 Q${k} ${k} 0 ${s} Q${-k} ${k} ${-s} 0 Q${-k} ${-k} 0 ${-s} Z"/>`;
}

function heart(x, y, s, fill) {
  return `<path transform="translate(${x} ${y}) scale(${s})" fill="${fill}" stroke="${WHITE}" stroke-width="8" d="M0 30 C-60 -10 -50 -70 0 -40 C50 -70 60 -10 0 30 Z"/>`;
}

// Fixed sparkle spots; each twinkles on its own phase.
const SPOTS = [
  [170, 260, 0], [880, 200, 1.3], [960, 620, 2.1], [120, 760, 0.7],
  [220, 1560, 1.8], [860, 330, 0.4], [540, 140, 2.6], [960, 1560, 1.1],
  [90, 1180, 2.9], [700, 1800, 0.2], [360, 1820, 1.6],
];
function sparkles(t, fill, size = 60) {
  return SPOTS.map(([x, y, ph]) => sparkle(x, y, size * Math.max(0, Math.sin(t * 5 + ph * 2)), fill)).join('');
}

function rays(cx, cy, n, angle, len, fill, width = 0.5) {
  let out = '';
  for (let i = 0; i < n; i++) {
    const a = ((i / n) * 360 + angle) * (Math.PI / 180);
    const w = (Math.PI / n) * width;
    const x1 = cx + Math.cos(a - w) * len, y1 = cy + Math.sin(a - w) * len;
    const x2 = cx + Math.cos(a + w) * len, y2 = cy + Math.sin(a + w) * len;
    out += `<path d="M${cx} ${cy} L${x1.toFixed(1)} ${y1.toFixed(1)} L${x2.toFixed(1)} ${y2.toFixed(1)} Z" fill="${fill}"/>`;
  }
  return out;
}

// Spiral ribbons around the centre; `scale` tightens them.
function ribbons(angle, scale) {
  let out = '';
  for (let k = 0; k < 3; k++) {
    const pts = [];
    for (let i = 0; i <= 60; i++) {
      const th = (i / 60) * Math.PI * 2.6;
      const r = (170 + th * 95) * scale;
      const a = th + ((angle + k * 120) * Math.PI) / 180;
      pts.push(`${(540 + Math.cos(a) * r).toFixed(1)},${(960 + Math.sin(a) * r * 1.25).toFixed(1)}`);
    }
    out += `<polyline points="${pts.join(' ')}" fill="none" stroke="${WHITE}" stroke-width="${46 - k * 8}" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  return out;
}

function brooch(r) {
  return `<circle cx="540" cy="960" r="${r}" fill="${WHITE}"/>` + sparkle(540, 960, r * 0.75, INK);
}

// Approximate bold glyph widths (in em), so letters pop in at natural spacing.
const GLYPH = { A: 0.72, S: 0.67, H: 0.72, L: 0.61, E: 0.67, Y: 0.67, X: 0.67, I: 0.3, N: 0.72, G: 0.78 };

// A word whose letters pop in one at a time from `start` seconds.
function word(text, y, size, t, start, step = 0.22) {
  const widths = [...text].map((ch) => (GLYPH[ch] ?? 0.7) * size + 12);
  let x = 540 - widths.reduce((a, b) => a + b, 0) / 2;
  return [...text]
    .map((ch, i) => {
      const cx = x + widths[i] / 2;
      x += widths[i];
      const p = clamp((t - start - i * step) / 0.35, 0, 1);
      if (p === 0) return '';
      const s = outBack(p);
      return `<text transform="translate(${cx.toFixed(1)} ${y}) scale(${s.toFixed(3)})" text-anchor="middle" dominant-baseline="central"
        font-family="${FONT}" font-weight="900" font-size="${size}" fill="${INK}" stroke="${WHITE}" stroke-width="18"
        paint-order="stroke" stroke-linejoin="round">${ch}</text>`;
    })
    .join('');
}

function wand(rise, beat) {
  const y = lerp(2300, 1560, ease.outQuad(rise));
  return `<rect x="526" y="${y + 60}" width="28" height="500" rx="14" fill="${INK}"/>` +
    crescent('wandmoon', 540, y + 10, 110, INK, -66) +
    heart(540, y - 150, 1.5 * beat, INK);
}

export default shots([
  // 1. Moonrise over a night sky.
  {
    duration: 3,
    render: ({ p, t }) =>
      svg(sparkles(t, WHITE, 55) + crescent('moon1', 540, lerp(1700, 760, ease.outQuad(p)), 300, WHITE), { background: NIGHT }),
  },
  // 2. Transformation: ribbons spiral in around the brooch.
  {
    duration: 3.5,
    render: ({ p, t, local }) =>
      svg(
        sparkles(t, WHITE, 45) +
          ribbons(local * 140 + ease.inQuad(p) * 900, lerp(1.35, 0.55, ease.inOutSine(p))) +
          brooch(lerp(110, 170, p)),
        { background: NIGHT },
      ),
  },
  // 3. Flash: a starburst floods the screen with white.
  {
    duration: 1.5,
    render: ({ p, local }) =>
      svg(rays(540, 960, 16, local * 90, lerp(300, 1600, ease.outQuad(p)), WHITE) +
        `<circle cx="540" cy="960" r="${lerp(80, 1200, ease.inQuad(p))}" fill="${WHITE}"/>`, { background: NIGHT }),
  },
  // 4. Name reveal under a black crescent.
  {
    duration: 4,
    render: ({ p, local }) =>
      svg(
        rays(540, 1100, 14, local * 12, 1500, RAY, 0.45) +
          crescent('moon4', 540, 480, lerp(0, 190, ease.outQuad(clamp(p * 3, 0, 1))), INK) +
          word('ASHLEY', 960, 220, local, 0.5) +
          word('XIANG', 1240, 220, local, 0.5 + 6 * 0.22 + 0.2) +
          sparkles(local, INK, 55),
        { background: WHITE },
      ),
  },
  // 5. Final pose: the wand rises and the heart beats.
  {
    duration: 4,
    render: ({ p, local }) =>
      svg(
        rays(540, 1100, 14, 48 + local * 12, 1500, RAY, 0.45) +
          crescent('moon5', 540, 480, 190, INK) +
          word('ASHLEY', 960, 220, 10, 0) +
          word('XIANG', 1240, 220, 10, 0) +
          wand(clamp(p * 3, 0, 1), 1 + 0.18 * Math.max(0, Math.sin(local * Math.PI * 3))) +
          sparkles(local + 4, INK, 70),
        { background: WHITE },
      ),
  },
]);
