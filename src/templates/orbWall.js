import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'orbWall',
  name: 'Orb Wall',
  category: 'Orbit',
  media: { default: 12, min: 1, max: 16 },
};

export const controls = [
  { key: 'cols', type: 'range', label: 'Columns', min: 4, max: 10, step: 1, default: 7 },
  { key: 'rows', type: 'range', label: 'Rows', min: 2, max: 6, step: 1, default: 4 },
  { key: 'size', type: 'range', label: 'Tile size', min: 8, max: 22, step: 1, default: 14, unit: '%' },
  { key: 'radius', type: 'range', label: 'Globe size', min: 26, max: 48, step: 1, default: 40, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

// A lat/long grid of tiles wrapped onto the front of a sphere that spins a full
// turn per loop. Columns disappear round the left edge and reappear on the
// right, so the wrap is seamless.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.3;
  const cx = w / 2;
  const cy = h / 2;
  const R = (min * p.radius) / 100;
  const baseW = (w * p.size) / 100;
  const cols = p.cols;
  const rows = p.rows;
  const latSpan = Math.PI * 0.62; // keep tiles off the poles

  const items = [];
  for (let r = 0; r < rows; r++) {
    const lat = rows === 1 ? 0 : (r / (rows - 1) - 0.5) * latSpan;
    const cl = Math.cos(lat);
    const sl = Math.sin(lat);
    for (let c = 0; c < cols; c++) {
      const lon = (c / cols) * TAU + t * TAU;
      const x3 = cl * Math.sin(lon);
      const z3 = cl * Math.cos(lon); // -1 back .. 1 front
      if (z3 <= 0.02) continue; // cull the far side
      items.push({
        x: cx + x3 * R,
        y: cy + sl * R,
        depth: z3,
        idx: r * cols + c,
      });
    }
  }
  items.sort((a, b) => a.depth - b.depth); // back first

  for (const it of items) {
    const s = 0.45 + it.depth * 0.75;
    const cw = baseW * s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.25 + it.depth * 0.75;
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.02 * s,
      shadowColor: withAlpha('#000000', 0.4 * it.depth),
      shadowY: min * 0.008,
      shine: false,
    });
    ctx.restore();
  }
}
