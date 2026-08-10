import { drawCard, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'totem',
  name: 'Totem Wall',
  category: 'Ticker & Marquee',
  media: { default: 9, min: 1, max: 16 },
};

export const controls = [
  { key: 'cols', type: 'range', label: 'Columns', min: 2, max: 6, step: 1, default: 4 },
  { key: 'gap', type: 'range', label: 'Gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
  { key: 'pad', type: 'range', label: 'Side padding', min: 0, max: 10, step: 0.5, default: 3, unit: '%' },
];

// Vertical columns of cards, alternating scroll up / down, wrapping seamlessly.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cols = p.cols;
  const gap = (min * p.gap) / 100;
  const pad = (w * p.pad) / 100;
  const colW = (w - pad * 2 - gap * (cols - 1)) / cols;
  const cardW = colW;
  const cardH = cardW / imgR;
  const step = cardH + gap;
  const n = Math.ceil(h / step) + 3;
  const period = n * step;

  for (let c = 0; c < cols; c++) {
    const dir = c % 2 === 0 ? 1 : -1;
    const x = pad + c * (colW + gap);
    const scroll = ((((t * dir) % 1) + 1) % 1) * step; // 0..step
    for (let i = 0; i < n; i++) {
      let y = i * step - scroll;
      y = ((y % period) + period) % period; // 0..period
      if (y > h + step) y -= period; // wrap overflow back to the top
      drawCard(ctx, imageAt(c * 29 + i), x, y, cardW, cardH, {
        r: cornerR(p.radius, cardW, cardH),
        shadowBlur: min * 0.03,
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowY: min * 0.012,
        shine: false,
      });
    }
  }
}
