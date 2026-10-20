// Moon Cat: a gray tabby chases a star across the moon and catches it.
// Tones: black sky, light gray moon, mid-gray cat with black stripes and outline, white star.

import { shots, svg, gray, ease, lerp, clamp, rng } from '../src/direct/scene-kit.js';

export const meta = { title: 'Moon Cat', fps: 12, duration: 14 };

const SKY = gray(0.08);
const GROUND = gray(0.8);
const CRATER = gray(0.55);
const FUR = gray(0.55);
const INK = gray(0);
const WHITE = gray(1);
const HORIZON = 1450;

const r = rng(11);
const STARS = Array.from({ length: 22 }, () => ({ x: r() * 1080, y: 80 + r() * 1150, s: 6 + r() * 8, ph: r() * 6 }));
const CRATERS = Array.from({ length: 7 }, (_, i) => ({ x: i * 330 + r() * 120, y: 1540 + r() * 300, w: 90 + r() * 90 }));

function sky(t) {
  return STARS.map(({ x, y, s, ph }) => {
    const k = 0.6 + 0.4 * Math.sin(t * 3 + ph);
    return `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(s * k).toFixed(1)}" fill="${WHITE}"/>`;
  }).join('');
}

// The moon's surface; `scroll` slides the craters left during the chase.
function moon(scroll = 0) {
  const span = 2310;
  const craters = CRATERS.map(({ x, y, w }) => {
    const cx = ((((x - scroll) % span) + span) % span) - 200;
    return `<ellipse cx="${cx.toFixed(0)}" cy="${y.toFixed(0)}" rx="${w.toFixed(0)}" ry="${(w * 0.35).toFixed(0)}" fill="${CRATER}"/>`;
  }).join('');
  return `<path d="M0 ${HORIZON} Q540 ${HORIZON - 60} 1080 ${HORIZON} V1920 H0 Z" fill="${GROUND}"/>` + craters;
}

function earth(x, y) {
  return `<circle cx="${x}" cy="${y}" r="110" fill="${gray(0.5)}"/>
    <path d="M${x - 70} ${y - 40} q40 -30 70 0 q20 30 -20 50 q-40 10 -50 -50 Z M${x + 20} ${y + 40} q40 -10 50 20 q-30 30 -50 -20 Z" fill="${gray(0.85)}"/>`;
}

// A five-point star with a little face; `glow` adds rays behind it.
function star(x, y, size, spin = 0, glow = 0) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const a = (i * 36 - 90 + spin) * (Math.PI / 180);
    const rr = i % 2 ? size * 0.45 : size;
    pts.push(`${(x + Math.cos(a) * rr).toFixed(1)},${(y + Math.sin(a) * rr).toFixed(1)}`);
  }
  let rays = '';
  if (glow > 0) {
    for (let i = 0; i < 12; i++) {
      const a = (i * 30 + spin * 0.5) * (Math.PI / 180);
      const r1 = size * 1.3, r2 = size * (1.3 + glow);
      rays += `<line x1="${(x + Math.cos(a) * r1).toFixed(1)}" y1="${(y + Math.sin(a) * r1).toFixed(1)}" x2="${(x + Math.cos(a) * r2).toFixed(1)}" y2="${(y + Math.sin(a) * r2).toFixed(1)}" stroke="${WHITE}" stroke-width="16" stroke-linecap="round"/>`;
    }
  }
  const eye = size * 0.09;
  return rays + `<polygon points="${pts.join(' ')}" fill="${WHITE}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
    <circle cx="${x - size * 0.16}" cy="${y - size * 0.02}" r="${eye}" fill="${INK}"/>
    <circle cx="${x + size * 0.16}" cy="${y - size * 0.02}" r="${eye}" fill="${INK}"/>`;
}

// The cat, facing right, origin at the centre of its body.
// `run` drives the leg cycle (radians); `sway` swings the tail; `sit` folds it upright.
function cat(x, y, { run = 0, stride = 0, sway = 0, scale = 1.25, tilt = 0, sit = 0 } = {}) {
  const leg = (lx, a) =>
    `<rect x="${lx - 17}" y="20" width="34" height="${lerp(120, 70, sit)}" rx="17" fill="${FUR}" stroke="${INK}" stroke-width="10" transform="rotate(${a.toFixed(1)} ${lx} 30)"/>`;
  const sw = Math.sin(run) * stride;
  const legs = leg(-110, -sw) + leg(-60, sw) + leg(80, sw) + leg(125, -sw);
  const tail = `M-150 -10 Q${-280} ${-40 + sway * 30} ${-250 + sway * 40} ${-190 + Math.abs(sway) * 20}`;
  const stripes = [-100, -50, 0, 50]
    .map((sx) => `<path d="M${sx} -72 q18 30 4 62" fill="none" stroke="${INK}" stroke-width="18" stroke-linecap="round"/>`)
    .join('');
  return `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${(tilt - sit * 25).toFixed(1)}) scale(${scale})">
    <path d="${tail}" fill="none" stroke="${INK}" stroke-width="54" stroke-linecap="round"/>
    <path d="${tail}" fill="none" stroke="${FUR}" stroke-width="34" stroke-linecap="round"/>
    ${legs}
    <ellipse cx="0" cy="0" rx="165" ry="78" fill="${FUR}" stroke="${INK}" stroke-width="10"/>
    ${stripes}
    <g transform="rotate(${(sit * 25).toFixed(1)} 160 -70)">
      <path d="M100 -110 L120 -205 L170 -140 Z M175 -140 L225 -205 L232 -105 Z" fill="${FUR}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/>
      <circle cx="165" cy="-75" r="78" fill="${FUR}" stroke="${INK}" stroke-width="10"/>
      <path d="M140 -148 v28 M168 -152 v30 M196 -148 v28" stroke="${INK}" stroke-width="14" stroke-linecap="round"/>
      <ellipse cx="200" cy="-42" rx="40" ry="28" fill="${WHITE}"/>
      <ellipse cx="195" cy="-88" rx="13" ry="20" fill="${INK}"/>
      <circle cx="232" cy="-52" r="10" fill="${INK}"/>
    </g>
  </g>`;
}

const FEET = HORIZON - 20 - 175; // body centre when standing on the ground

export default shots([
  // 1. The moon at night; a star floats down from the sky.
  {
    duration: 2.5,
    render: ({ p, t }) =>
      svg(sky(t) + earth(850, 300) + moon() + star(lerp(300, 720, p), lerp(-150, 1000, ease.outQuad(p)), 110, t * 120), { background: SKY }),
  },
  // 2. The cat walks in and stops to stare at the star.
  {
    duration: 2,
    render: ({ p, t, local }) => {
      const walk = ease.outQuad(clamp(p / 0.6, 0, 1));
      const moving = p < 0.6 ? 1 : 0;
      return svg(
        sky(t) + earth(850, 300) + moon() +
          star(720, 1000 + Math.sin(local * 4) * 25, 110 + (p > 0.6 ? 15 * Math.sin(local * 12) : 0), t * 120) +
          cat(lerp(-250, 300, walk), FEET, { run: local * 10, stride: 30 * moving, sway: Math.sin(local * 3) }),
        { background: SKY },
      );
    },
  },
  // 3. The chase: big floaty hops, the star bouncing just ahead.
  {
    duration: 4,
    render: ({ p, t, local }) => {
      const hop = Math.abs(Math.sin(local * Math.PI * 1.25));
      const starHop = Math.abs(Math.sin(local * Math.PI * 1.25 + 1.2));
      return svg(
        sky(t) + earth(lerp(850, 760, p), 300) + moon(local * 420) +
          star(lerp(720, 820, p), 1050 - starHop * 380, 100, t * 200) +
          cat(lerp(300, 380, p), FEET - hop * 300, { run: local * 14, stride: 40, sway: Math.sin(local * 6), tilt: -12 * Math.cos(local * Math.PI * 1.25) }),
        { background: SKY },
      );
    },
  },
  // 4. The big leap and the catch.
  {
    duration: 2.5,
    render: ({ p, t }) => {
      const up = clamp(p / 0.55, 0, 1);
      const down = clamp((p - 0.55) / 0.45, 0, 1);
      const cx = lerp(380, 560, ease.outQuad(up));
      const cy = p < 0.55 ? lerp(FEET, 820, ease.outQuad(up)) : lerp(820, FEET, ease.inQuad(down));
      const caught = p >= 0.55;
      const sx = caught ? cx + 200 : lerp(800, 760, up);
      const sy = caught ? cy - 180 : 760;
      const flash = caught ? Math.max(0, 1 - down * 2.5) : 0;
      const burst = flash > 0 ? `<circle cx="${sx}" cy="${sy}" r="${lerp(600, 120, 1 - flash)}" fill="${WHITE}" opacity="${flash.toFixed(2)}"/>` : '';
      return svg(
        sky(t) + earth(760, 300) + moon() +
          cat(cx, cy, { stride: 45, run: caught ? 0.8 : 2.4, sway: 1, tilt: caught ? lerp(-25, 0, down) : -25 }) +
          star(sx, sy, 100, t * 200, caught ? 0.6 : 0) + burst,
        { background: SKY },
      );
    },
  },
  // 5. Happy ending: the cat sits with its glowing star, Earth overhead.
  {
    duration: 3,
    render: ({ t, local }) =>
      svg(
        sky(t) + earth(760, 300) + moon() +
          cat(400, FEET + 30, { sit: 1, sway: Math.sin(local * 4) }) +
          star(830, 930 + Math.sin(local * 3) * 20, 100 + 8 * Math.sin(local * 6), t * 60, 0.5 + 0.2 * Math.sin(local * 6)),
        { background: SKY },
      ),
  },
]);
