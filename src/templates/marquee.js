import { drawCard, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'marquee',
  name: 'Marquee',
  category: 'Ticker & Marquee',
  media: { default: 8, min: 1, max: 14 },
};

export const controls = [
  { key: 'rows', type: 'range', label: 'Rows', min: 1, max: 4, step: 1, default: 2 },
  { key: 'gap', type: 'range', label: 'Gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
  { key: 'pad', type: 'range', label: 'Row padding', min: 0, max: 10, step: 0.5, default: 3, unit: '%' },
];

// Alternating rows scroll in opposite directions, wrapping seamlessly.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const rows = p.rows;
  const gap = (min * p.gap) / 100;
  const pad = (h * p.pad) / 100;
  const rowH = (h - pad * 2 - gap * (rows - 1)) / rows;
  const cardH = rowH;
  const cardW = cardH * imgR;
  const step = cardW + gap;
  const n = Math.ceil(w / step) + 3;
  const period = n * step;

  for (let r = 0; r < rows; r++) {
    const dir = r % 2 === 0 ? 1 : -1;
    const y = pad + r * (rowH + gap);
    const scroll = ((((t * dir) % 1) + 1) % 1) * step; // 0..step
    for (let i = 0; i < n; i++) {
      let x = i * step - scroll;
      x = ((x % period) + period) % period; // 0..period
      if (x > w + step) x -= period; // pull overflow back to the left edge
      drawCard(ctx, imageAt(r * 31 + i), x, y, cardW, cardH, {
        r: cornerR(p.radius, cardW, cardH),
        shadowBlur: min * 0.03,
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowY: min * 0.012,
        shine: false,
      });
    }
  }
}
