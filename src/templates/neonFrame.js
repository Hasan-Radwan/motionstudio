import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'neonFrame',
  name: 'Neon Frame',
  category: 'Logo & Branding',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 92, step: 1, default: 78, unit: '%' },
  { key: 'thickness', type: 'range', label: 'Border', min: 1, max: 6, step: 0.5, default: 3, unit: '%' },
  { key: 'glow', type: 'range', label: 'Glow', min: 0, max: 40, step: 1, default: 22, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 14, unit: '%' },
];

const HUES = ['#6c5cff', '#c86dff', '#ff5c9d', '#3ad1c6', '#ffd166', '#6c5cff'];

// A framed image ringed by a rotating multicolour glow — a premium ad / logo
// look. The conic gradient spins one full turn per loop (seamless).
export function render(ctx, t, p, { image, w, h }) {
  const min = Math.min(w, h);
  const imgR = image && image.width ? image.width / image.height : 1.5;
  let fw = (w * p.size) / 100;
  let fh = fw / imgR;
  const maxH = (h * p.size) / 100;
  if (fh > maxH) {
    fh = maxH;
    fw = fh * imgR;
  }
  const x = (w - fw) / 2;
  const y = (h - fh) / 2;
  const r = cornerR(p.radius, fw, fh);
  const cx = x + fw / 2;
  const cy = y + fh / 2;

  // image
  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, r);
  ctx.clip();
  drawImageCover(ctx, image, x, y, fw, fh);
  ctx.restore();

  // rotating neon border
  let stroke;
  if (typeof ctx.createConicGradient === 'function') {
    stroke = ctx.createConicGradient(t * TAU, cx, cy);
    HUES.forEach((c, i) => stroke.addColorStop(i / (HUES.length - 1), c));
  } else {
    stroke = HUES[0];
  }
  const lw = (min * p.thickness) / 100;
  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, r);
  ctx.lineWidth = lw;
  ctx.strokeStyle = stroke;
  ctx.shadowColor = 'rgba(140,120,255,0.85)';
  ctx.shadowBlur = (min * p.glow) / 100;
  ctx.stroke();
  ctx.stroke(); // second pass intensifies the glow
  ctx.restore();
}
