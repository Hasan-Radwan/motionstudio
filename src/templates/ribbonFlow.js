import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'ribbonFlow',
  name: 'Ribbon Flow',
  category: 'Carousel & Flow',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 12, step: 1, default: 7 },
  { key: 'size', type: 'range', label: 'Card size', min: 16, max: 40, step: 1, default: 26, unit: '%' },
  { key: 'amp', type: 'range', label: 'Wave height', min: 4, max: 26, step: 1, default: 15, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 12, unit: '%' },
];

// Cards ride a horizontal sine "ribbon" that scrolls across the frame, each card
// tilting to follow the wave's slope. Cards wrap off one edge and back on the
// other, so the flow is seamless.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cw = (w * p.size) / 100;
  const ch = cw / imgR;
  const amp = (h * p.amp) / 100;
  const n = Math.round(p.count);
  const travel = w + cw * 2;
  const waves = 1.4;

  const items = [];
  for (let i = 0; i < n; i++) {
    const u = (i / n + t) % 1; // 0..1 scroll progress
    const x = -cw + u * travel;
    const fx = x / w;
    const angle = (fx * waves + t) * TAU;
    const y = h / 2 + Math.sin(angle) * amp;
    // slope of the ribbon for the card's tilt (clamped so it never over-rotates)
    const slope = Math.cos(angle) * amp * ((waves / w) * TAU);
    const rot = Math.atan(slope) * 0.7;
    const depth = 0.5 + 0.5 * Math.sin(angle); // front of the wave reads nearer
    items.push({ x, y, rot, depth, idx: i });
  }
  items.sort((a, b) => a.depth - b.depth);

  for (const it of items) {
    const s = 0.82 + it.depth * 0.28;
    const dw = cw * s;
    const dh = ch * s;
    ctx.save();
    ctx.globalAlpha = 0.7 + it.depth * 0.3;
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    drawCard(ctx, imageAt(it.idx), -dw / 2, -dh / 2, dw, dh, {
      r: cornerR(p.radius, dw, dh),
      shadowBlur: min * 0.04 * s,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowY: min * 0.018,
      shine: false,
    });
    ctx.restore();
  }
}
