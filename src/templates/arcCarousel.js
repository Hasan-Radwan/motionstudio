import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'arcCarousel',
  name: 'Arc Carousel',
  category: 'Carousel & Flow',
  media: { default: 8, min: 1, max: 14 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 14, step: 1, default: 8 },
  { key: 'size', type: 'range', label: 'Card size', min: 26, max: 60, step: 1, default: 42, unit: '%' },
  { key: 'radius', type: 'range', label: 'Ring size', min: 24, max: 46, step: 1, default: 34, unit: '%' },
  { key: 'bulge', type: 'range', label: 'Arc bulge', min: 0, max: 30, step: 1, default: 14, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

// Cards ride a 3D ring that turns a full revolution per loop. A vertical bulge
// bends the ring into a shallow dome so it reads as a sphere-carousel; near
// cards are big and bright, far cards recede behind.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cx = w / 2;
  const cy = h / 2;
  const R = (w * p.radius) / 100;
  const baseW = (w * p.size) / 100;
  const bulge = (h * p.bulge) / 100;
  const n = p.count;

  const items = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + t * TAU;
    const x3 = Math.sin(a);
    const z3 = Math.cos(a); // -1 back .. 1 front
    items.push({
      x: cx + x3 * R,
      y: cy - z3 * bulge, // front dips toward viewer, back rises
      depth: (z3 + 1) / 2,
      idx: i,
    });
  }
  items.sort((a, b) => a.depth - b.depth);

  for (const it of items) {
    const s = 0.5 + it.depth * 0.6;
    const cw = baseW * s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.4 + it.depth * 0.6;
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.04 * s,
      shadowColor: withAlpha('#000000', 0.5 * it.depth),
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
