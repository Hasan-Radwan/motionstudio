import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'wave',
  name: 'Wave Grid',
  category: 'Grid',
  media: { default: 9, min: 1, max: 16 },
};

export const controls = [
  { key: 'cols', type: 'range', label: 'Columns', min: 2, max: 6, step: 1, default: 4 },
  { key: 'rows', type: 'range', label: 'Rows', min: 2, max: 6, step: 1, default: 3 },
  { key: 'gap', type: 'range', label: 'Gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'amp', type: 'range', label: 'Wave height', min: 0, max: 12, step: 0.5, default: 5, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
];

// A tile grid where each card bobs up and down, offset by a diagonal phase so a
// wave travels across the grid.
export function render(ctx, t, p, { imageAt, w, h }) {
  const cols = p.cols;
  const rows = p.rows;
  const gap = (Math.min(w, h) * p.gap) / 100;
  const margin = gap * 1.2;
  const cellW = (w - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (h - margin * 2 - gap * (rows - 1)) / rows;
  const amp = (h * p.amp) / 100;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const phase = (c + r) / (cols + rows);
      const bob = Math.sin((t + phase) * TAU) * amp;
      const lift = (Math.sin((t + phase) * TAU) + 1) / 2; // 0..1 for lighting
      const x = margin + c * (cellW + gap);
      const y = margin + r * (cellH + gap) + bob;
      ctx.save();
      ctx.globalAlpha = 0.8 + lift * 0.2;
      drawCard(ctx, imageAt(r * cols + c), x, y, cellW, cellH, {
        r: cornerR(p.radius, cellW, cellH),
        shadowBlur: cellW * 0.12 * (0.5 + lift),
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowY: cellH * 0.05 + amp * 0.15,
        shine: false,
      });
      ctx.restore();
    }
  }
}
