import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { easeIn } from '../engine/easing.js';

export const meta = {
  id: 'deck',
  name: 'Swipe Deck',
  category: 'Carousel & Flow',
  media: { default: 4, min: 1, max: 10 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Card size', min: 40, max: 80, step: 1, default: 58, unit: '%' },
  { key: 'peek', type: 'range', label: 'Stack peek', min: 2, max: 12, step: 0.5, default: 5, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

// A stacked deck where the front card swipes away each beat, revealing the one
// behind, which rises into place. Seamless as the deck cycles.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = Math.max(1, count);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  let cardW = (w * p.size) / 100;
  let cardH = cardW / imgR;
  const maxH = h * (p.size / 100);
  if (cardH > maxH) {
    cardH = maxH;
    cardW = cardH * imgR;
  }
  const cx = w / 2;
  const cy = h / 2;
  const peek = (h * p.peek) / 100;

  const seg = (t % 1) * n;
  const idx = Math.floor(seg) % n;
  const frac = seg - Math.floor(seg);

  // draw back-to-front: depth 2 (deepest) → 0 (front)
  for (let d = 2; d >= 0; d--) {
    const ci = idx + d;
    let scale;
    let yoff;
    let xoff = 0;
    let rot = 0;
    let alpha = 1;
    if (d === 0) {
      const e = easeIn(frac);
      xoff = e * w * 0.85;
      rot = frac * 0.2;
      alpha = 1 - frac;
      scale = 1;
      yoff = 0;
    } else {
      const dd = d - frac; // rises toward the front as frac advances
      scale = 1 - dd * 0.05;
      yoff = dd * peek;
      alpha = Math.min(1, 1.15 - dd * 0.25);
    }
    if (alpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + xoff, cy + yoff);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    drawCard(ctx, imageAt(ci), -cardW / 2, -cardH / 2, cardW, cardH, {
      r: cornerR(p.radius, cardW, cardH),
      shadowBlur: Math.min(w, h) * 0.05,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowY: Math.min(w, h) * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
