import { drawCard, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'orbit',
  name: 'Orbit',
  category: 'Orbit',
  media: { default: 5, min: 1, max: 8 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Copies', min: 3, max: 8, step: 1, default: 5 },
  { key: 'radius', type: 'range', label: 'Radius', min: 20, max: 46, step: 1, default: 34, unit: '%' },
  { key: 'flatten', type: 'range', label: 'Perspective', min: 20, max: 90, step: 1, default: 45, unit: '%' },
  { key: 'size', type: 'range', label: 'Card size', min: 16, max: 44, step: 1, default: 28, unit: '%' },
];

export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cx = w / 2;
  const cy = h / 2;
  const rx = (w * p.radius) / 100;
  const ry = rx * (p.flatten / 100);

  const items = [];
  for (let i = 0; i < p.count; i++) {
    const ang = t * TAU + (i / p.count) * TAU;
    const depth = (Math.sin(ang) + 1) / 2; // 0 back .. 1 front
    items.push({
      x: cx + Math.cos(ang) * rx,
      y: cy + Math.sin(ang) * ry,
      depth,
      img: imageAt(i),
    });
  }
  items.sort((a, b) => a.depth - b.depth); // back first

  const baseW = (w * p.size) / 100;
  for (const it of items) {
    const s = 0.6 + it.depth * 0.55;
    const cw = baseW * s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.45 + it.depth * 0.55;
    drawCard(ctx, it.img, it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cw * 0.09,
      shadowBlur: min * 0.03 * s,
      shadowColor: withAlpha('#000000', 0.4 * it.depth),
      shadowY: min * 0.015,
      shine: false,
    });
    ctx.restore();
  }
}
