import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'mosaic',
  name: 'Mosaic Flip',
  category: 'Grid',
  media: { default: 9, min: 1, max: 16 },
};

export const controls = [
  { key: 'cols', type: 'range', label: 'Columns', min: 2, max: 6, step: 1, default: 4 },
  { key: 'rows', type: 'range', label: 'Rows', min: 2, max: 6, step: 1, default: 3 },
  { key: 'gap', type: 'range', label: 'Gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
];

// Tiles flip around their vertical axis in a diagonal wave, cycling images.
export function render(ctx, t, p, { imageAt, w, h }) {
  const cols = p.cols;
  const rows = p.rows;
  const gap = (Math.min(w, h) * p.gap) / 100;
  const margin = gap * 1.2;
  const cellW = (w - margin * 2 - gap * (cols - 1)) / cols;
  const cellH = (h - margin * 2 - gap * (rows - 1)) / rows;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const phase = (c + r) / (cols + rows);
      const cA = Math.cos((t + phase) * TAU);
      const sx = Math.max(0.02, Math.abs(cA));
      // alternate image on the back half-turn so it reads as flipping tiles
      const img = imageAt(r * cols + c + (cA < 0 ? cols * rows : 0));
      const x = margin + c * (cellW + gap) + cellW / 2;
      const y = margin + r * (cellH + gap) + cellH / 2;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(sx, 1);
      drawCard(ctx, img, -cellW / 2, -cellH / 2, cellW, cellH, {
        r: cornerR(p.radius, cellW, cellH),
        shadowBlur: cellW * 0.1,
        shadowColor: 'rgba(0,0,0,0.4)',
        shadowY: cellH * 0.03,
        shine: false,
      });
      // darken as the tile turns edge-on
      ctx.globalAlpha = (1 - sx) * 0.4;
      ctx.fillStyle = '#000';
      ctx.fillRect(-cellW / 2, -cellH / 2, cellW, cellH);
      ctx.restore();
    }
  }
}
