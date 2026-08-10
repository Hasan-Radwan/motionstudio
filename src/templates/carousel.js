import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'carousel',
  name: 'Carousel',
  category: 'Carousel & Flow',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Card size', min: 30, max: 70, step: 1, default: 46, unit: '%' },
  { key: 'gap', type: 'range', label: 'Gap', min: 2, max: 20, step: 1, default: 8, unit: '%' },
  { key: 'focus', type: 'range', label: 'Center focus', min: 0, max: 40, step: 1, default: 18, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const gap = (w * p.gap) / 100;
  const step = cardW + gap;
  const cy = h / 2;

  // enough cards to cover the width plus one for seamless wrap
  const n = Math.ceil(w / step) + 3;
  const scroll = (t % 1) * step; // moves exactly one card per loop -> seamless

  for (let i = -1; i < n; i++) {
    let x = w / 2 + i * step - scroll - ((n - 1) / 2) * step + step / 2;
    // wrap into a periodic band centered on screen
    const period = n * step;
    x = ((((x - w / 2) % period) + period) % period) - period / 2 + w / 2;

    const dist = Math.abs(x - w / 2) / (w / 2); // 0 center .. 1 edge
    const focus = 1 + (p.focus / 100) * Math.max(0, 1 - dist * 1.4);
    const cw = cardW * focus;
    const ch = cardH * focus;
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * Math.max(0, 1 - dist);
    drawCard(ctx, imageAt(i), x - cw / 2, cy - ch / 2, cw, ch, {
      r: cornerR(p.radius, cw, ch),
      shadowBlur: min * 0.05 * focus,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
