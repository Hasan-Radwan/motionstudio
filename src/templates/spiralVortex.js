import { drawCard, cornerR } from '../engine/canvasUtils.js';

const TAU = Math.PI * 2;

export const meta = {
  id: 'spiralVortex',
  name: 'Spiral Vortex',
  category: 'Orbit',
  media: { default: 8, min: 1, max: 12 },
};

export const controls = [
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 6, step: 0.5, default: 3.5 },
  { key: 'spacing', type: 'range', label: 'Spacing', min: 1, max: 15, step: 1, default: 5 },
  { key: 'spread', type: 'range', label: 'Spread', min: 1, max: 12, step: 1, default: 6 },
  { key: 'size', type: 'range', label: 'Card size', min: 8, max: 44, step: 1, default: 22, unit: '%' },
  { key: 'attenuation', type: 'range', label: 'Attenuation', min: 0, max: 4, step: 0.5, default: 2 },
  { key: 'fadeIn', type: 'range', label: 'Fade in', min: 0, max: 50, step: 1, default: 20, unit: '%' },
  { key: 'fadeOut', type: 'range', label: 'Fade out', min: 0, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 8, unit: '%' },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'in',
    options: [
      { value: 'in', label: 'Inward' },
      { value: 'out', label: 'Outward' },
    ],
  },
];

// Arc-length reparameterization of the Archimedean spiral, cached per `turns`
// value (the shape is radius-independent, built once at R=1) so equal parameter
// steps become equal VISUAL spacing along the path.
const _tableCache = new Map();
function getArcTable(turns) {
  const key = turns.toFixed(2);
  let table = _tableCache.get(key);
  if (table) return table;
  const spiral = (n) => {
    const ang = n * turns * TAU;
    const rad = 1 - n;
    return { x: rad * Math.cos(ang), y: -rad * Math.sin(ang) };
  };
  const M = 2000;
  const cum = new Float32Array(M + 1);
  let prev = spiral(0);
  for (let k = 1; k <= M; k++) {
    const pt = spiral(k / M);
    cum[k] = cum[k - 1] + Math.hypot(pt.x - prev.x, pt.y - prev.y);
    prev = pt;
  }
  const total = cum[M] || 1;
  const K = 1024;
  const nForArc = new Float32Array(K + 1);
  let j = 0;
  for (let a = 0; a <= K; a++) {
    const target = (a / K) * total;
    while (j < M && cum[j + 1] < target) j++;
    const seg = cum[j + 1] - cum[j];
    const f = seg > 0 ? (target - cum[j]) / seg : 0;
    nForArc[a] = (j + f) / M;
  }
  const arcToN = (s) => {
    const x = Math.max(0, Math.min(K, s * K));
    const i = Math.floor(x);
    const a = nForArc[i];
    const b = nForArc[Math.min(i + 1, K)];
    return a + (b - a) * (x - i);
  };
  table = { arcToN };
  if (_tableCache.size > 12) _tableCache.clear();
  _tableCache.set(key, table);
  return table;
}

// Images flow along an Archimedean spiral from the outer edge into the centre
// (a vortex), rotating to follow the spiral's tangent and fading at the ends. A
// continuous, equal-arc stream — cards cycle through the images so it's infinite
// even with one — and it loops seamlessly (the config at t=0 equals t=1).
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);
  const { arcToN } = getArcTable(p.turns);
  const cx = w / 2;
  const cy = h / 2;
  const R = 0.48 * min * (1 + (p.spread - 1) * 0.18);
  const cardBase = (min * p.size) / 100;
  const stepFrac = Math.max(0.005, (p.spacing * 0.5) / 100);
  const slots = Math.min(400, Math.ceil(1 / stepFrac) + 2);
  const nImgs = Math.max(1, count);
  const dir = p.direction === 'out' ? -1 : 1;
  const base = t * dir;
  const fadeIn = p.fadeIn;
  const fadeOut = p.fadeOut;

  const spiral = (n) => {
    const ang = n * p.turns * TAU;
    const rad = R * (1 - n);
    return { x: rad * Math.cos(ang), y: -rad * Math.sin(ang) };
  };

  const cards = [];
  for (let i = 0; i < slots; i++) {
    const s = (((base + i * stepFrac) % 1) + 1) % 1;
    cards.push({ tt: s * 100, n: arcToN(s), img: i % nImgs });
  }
  cards.sort((a, b) => a.n - b.n); // outer first, centre on top

  for (const card of cards) {
    const { tt, n, img } = card;
    let opacity = 1;
    if (tt < fadeIn) opacity = tt / fadeIn;
    else if (fadeOut > 0 && tt > 100 - fadeOut) opacity = (100 - tt) / fadeOut;
    if (opacity <= 0.01) continue;

    const pt = spiral(n);
    const dist = Math.hypot(pt.x, pt.y);
    const scale = p.attenuation > 0 ? Math.pow(Math.min(dist / R, 1), p.attenuation * 0.5) : 1;
    const p2 = spiral(Math.min(n + 0.001, 1));
    const angle = Math.atan2(p2.y - pt.y, p2.x - pt.x);

    const im = imageAt(img);
    const aspect = im && im.width ? im.width / im.height : 1;
    let cw = cardBase * scale;
    let ch = cw / aspect;
    if (aspect < 1) {
      ch = cardBase * scale;
      cw = ch * aspect;
    }
    if (cw < 1) continue;

    ctx.save();
    ctx.translate(cx + pt.x, cy + pt.y);
    ctx.rotate(angle);
    ctx.globalAlpha = opacity;
    drawCard(ctx, im, -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.02 * scale,
      shadowColor: 'rgba(0,0,0,0.35)',
      shadowY: min * 0.006,
      shine: false,
    });
    ctx.restore();
  }
}
