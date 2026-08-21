import { drawCard, cornerR } from '../engine/canvasUtils.js';

const TAU = Math.PI * 2;

export const meta = {
  id: 'orbitRing',
  name: 'Orbit Ring',
  category: 'Orbit',
  media: { default: 9, min: 1, max: 16 },
};

export const controls = [
  { key: 'slots', type: 'range', label: 'Cards', min: 3, max: 16, step: 1, default: 9 },
  { key: 'radius', type: 'range', label: 'Orbit radius', min: 12, max: 46, step: 1, default: 30, unit: '%' },
  { key: 'size', type: 'range', label: 'Image size', min: 6, max: 30, step: 1, default: 14, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
  { key: 'depth', type: 'range', label: 'Depth', min: 0, max: 100, step: 1, default: 30, unit: '%' },
  { key: 'opacity', type: 'range', label: 'Opacity', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 4, step: 1, default: 1 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'ccw',
    options: [
      { value: 'cw', label: 'Clockwise' },
      { value: 'ccw', label: 'Counter-clockwise' },
    ],
  },
];

// A flat ring of images evenly spaced around a centre, rotating a whole number of
// turns per loop (so it's seamless). `depth` gives the front of the ring a gentle
// size boost + on-top paint order for a subtle sense of dimension. Adapted from
// the Proximity Orbit component.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.slots);
  const dir = p.direction === 'cw' ? 1 : -1;
  const cx = w / 2;
  const cy = h / 2;
  const R = (w * p.radius) / 100;
  const cardBase = (min * p.size) / 100;
  const depth = p.depth / 100;
  const alpha = (p.opacity ?? 100) / 100;
  const angle = t * TAU * Math.round(p.turns) * dir;

  const items = [];
  for (let i = 0; i < n; i++) {
    const a = i * (TAU / n) + angle;
    const d = (Math.sin(a) + 1) / 2; // 0 back (top) .. 1 front (bottom)
    items.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R, d, idx: i });
  }
  items.sort((a, b) => a.d - b.d); // back first, front painted on top

  for (const it of items) {
    const scale = 1 - depth * 0.5 + depth * it.d; // front larger when depth > 0
    const im = imageAt(it.idx % Math.max(1, count));
    const aspect = im && im.width ? im.width / im.height : 1;
    let cw = cardBase * scale;
    let ch = cw / aspect;
    if (aspect < 1) {
      ch = cardBase * scale;
      cw = ch * aspect;
    }
    if (cw < 1) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(it.x, it.y);
    drawCard(ctx, im, -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.03 * scale,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowY: min * 0.01,
      shine: false,
    });
    ctx.restore();
  }
}
