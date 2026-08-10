import { drawCard, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'globe',
  name: 'Card Globe',
  category: 'Orbit',
  media: { default: 8, min: 1, max: 16 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 16, step: 1, default: 10 },
  { key: 'size', type: 'range', label: 'Card size', min: 10, max: 30, step: 1, default: 18, unit: '%' },
  { key: 'radius', type: 'range', label: 'Globe size', min: 24, max: 46, step: 1, default: 38, unit: '%' },
  { key: 'flatten', type: 'range', label: 'Perspective', min: 60, max: 100, step: 1, default: 88, unit: '%' },
];

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// Cards spread evenly over a sphere (Fibonacci distribution) that rotates a full
// turn per loop. Back-facing cards are smaller and dimmer for depth.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.3;
  const cx = w / 2;
  const cy = h / 2;
  const R = (Math.min(w, h) * p.radius) / 100;
  const baseW = (w * p.size) / 100;
  const ang = t * TAU;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const flat = p.flatten / 100;
  const n = p.count;

  const items = [];
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2; // 1 .. -1
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN;
    const px = Math.cos(theta) * rr;
    const pz = Math.sin(theta) * rr;
    // rotate around the vertical axis
    const rx = px * ca - pz * sa;
    const rz = px * sa + pz * ca; // -1 back .. 1 front
    items.push({
      x: cx + rx * R,
      y: cy + y * R * flat,
      depth: (rz + 1) / 2, // 0 back .. 1 front
      idx: i,
    });
  }
  items.sort((a, b) => a.depth - b.depth); // back first

  for (const it of items) {
    const s = 0.5 + it.depth * 0.7;
    const cw = baseW * s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.35 + it.depth * 0.65;
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cw * 0.1,
      shadowBlur: min * 0.025 * s,
      shadowColor: withAlpha('#000000', 0.4 * it.depth),
      shadowY: min * 0.012,
      shine: false,
    });
    ctx.restore();
  }
}
