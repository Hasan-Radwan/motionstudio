import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'radialWheel',
  name: 'Radial Wheel',
  category: 'Orbit',
  media: { default: 8, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 12, step: 1, default: 8 },
  { key: 'radius', type: 'range', label: 'Wheel size', min: 24, max: 48, step: 1, default: 38, unit: '%' },
  { key: 'size', type: 'range', label: 'Card size', min: 12, max: 34, step: 1, default: 22, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Perspective', min: 30, max: 95, step: 1, default: 62, unit: '%' },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 3, step: 1, default: 1 },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

// Cards fixed to the rim of a tilted wheel that spins a whole number of turns per
// loop (so it's seamless). Unlike Orbit, each card TUMBLES with the rim (its
// rotation follows the tangent), giving a turning-wheel feel. Back cards are
// smaller/dimmer for depth.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1;
  const cx = w / 2;
  const cy = h / 2;
  const R = (w * p.radius) / 100;
  const ry = R * (p.tilt / 100); // vertical squash = perspective tilt
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const base = t * TAU * Math.round(p.turns);

  const items = [];
  for (let i = 0; i < p.count; i++) {
    const a = base + (i / p.count) * TAU;
    const depth = (Math.sin(a) + 1) / 2; // 0 far (top) .. 1 near (bottom)
    items.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * ry, rot: a + Math.PI / 2, depth, idx: i });
  }
  items.sort((a, b) => a.depth - b.depth); // far first, near on top

  for (const it of items) {
    const s = 0.72 + it.depth * 0.42;
    const cw = cardW * s;
    const ch = cardH * s;
    ctx.save();
    ctx.globalAlpha = 0.5 + it.depth * 0.5;
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.035 * s,
      shadowColor: withAlpha('#000000', 0.45 * it.depth),
      shadowY: min * 0.015,
      shine: false,
    });
    ctx.restore();
  }
}
