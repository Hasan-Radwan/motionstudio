import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'grid',
  name: 'Grid Pulse',
  category: 'Grid',
  media: { default: 12, min: 1, max: 16 },
};

export const controls = [
  { key: 'cols', type: 'range', label: 'Columns', min: 2, max: 6, step: 1, default: 4 },
  { key: 'rows', type: 'range', label: 'Rows', min: 2, max: 6, step: 1, default: 3 },
  { key: 'gap', type: 'range', label: 'Gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'wave', type: 'range', label: 'Wave', min: 0, max: 30, step: 1, default: 14, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
];

export function render(ctx, t, p, { imageAt, w, h }) {
  const cols = p.cols;
  const rows = p.rows;
  const gap = (Math.min(w, h) * p.gap) / 100;
  const margin = gap * 1.2;
  const cellW = (w - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (h - margin * 2 - gap * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const phase = t + (c + r) / (cols + rows);
      const pulse = (p.wave / 100) * (0.5 - 0.5 * Math.cos(phase * TAU));
      const s = 1 - pulse * 0.5;
      const x = margin + c * (cellW + gap);
      const y = margin + r * (cellH + gap);
      const cw = cellW * s;
      const ch = cellH * s;
      const ox = x + (cellW - cw) / 2;
      const oy = y + (cellH - ch) / 2;
      ctx.save();
      ctx.globalAlpha = 0.7 + pulse * 1.2 > 1 ? 1 : 0.7 + pulse * 1.2;
      drawCard(ctx, imageAt(r * cols + c), ox, oy, cw, ch, {
        r: cornerR(p.radius, cw, ch),
        shadowBlur: cellW * 0.14 * (0.4 + pulse),
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowY: cellH * 0.04,
        shine: false,
      });
      ctx.restore();
    }
  }
}
