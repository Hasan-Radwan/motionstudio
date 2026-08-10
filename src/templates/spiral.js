import { drawCard, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'spiral',
  name: 'Spiral',
  category: 'Orbit',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 3, max: 12, step: 1, default: 7 },
  { key: 'size', type: 'range', label: 'Card size', min: 14, max: 40, step: 1, default: 24, unit: '%' },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 3, step: 0.5, default: 1.5 },
  { key: 'radius', type: 'range', label: 'Radius', min: 20, max: 46, step: 1, default: 36, unit: '%' },
  { key: 'flatten', type: 'range', label: 'Perspective', min: 30, max: 100, step: 1, default: 60, unit: '%' },
];

// Cards laid along a spiral that rotates a full turn per loop (seamless). Inner
// cards are smaller/dimmer, giving a vortex feel.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cx = w / 2;
  const cy = h / 2;
  const maxR = (Math.min(w, h) * p.radius) / 100;
  const baseW = (w * p.size) / 100;

  const items = [];
  for (let i = 0; i < p.count; i++) {
    const f = p.count === 1 ? 1 : i / (p.count - 1); // 0 inner .. 1 outer
    const ang = t * TAU + f * p.turns * TAU;
    const rad = maxR * (0.15 + 0.85 * f);
    items.push({
      x: cx + Math.cos(ang) * rad,
      y: cy + Math.sin(ang) * rad * (p.flatten / 100),
      s: 0.4 + f * 0.75,
      idx: i,
    });
  }
  items.sort((a, b) => a.s - b.s); // small/back first

  for (const it of items) {
    const cw = baseW * it.s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.4 + it.s * 0.55;
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cw * 0.1,
      shadowBlur: min * 0.03 * it.s,
      shadowColor: withAlpha('#000000', 0.4 * it.s),
      shadowY: min * 0.015,
      shine: false,
    });
    ctx.restore();
  }
}
