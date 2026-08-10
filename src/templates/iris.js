import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { triangle, easeInOut } from '../engine/easing.js';

export const meta = {
  id: 'iris',
  name: 'Iris Reveal',
  category: 'Reveal & Wipe',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 100, step: 1, default: 88, unit: '%' },
  { key: 'edge', type: 'range', label: 'Edge glow', min: 0, max: 100, step: 1, default: 55, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 8, unit: '%' },
];

// The image is revealed through a circle that opens from the centre and closes
// again — a seamless iris in / out.
export function render(ctx, t, p, { image, w, h }) {
  const imgR = image && image.width ? image.width / image.height : 1.6;
  let fw = (w * p.size) / 100;
  let fh = fw / imgR;
  const maxH = (h * p.size) / 100;
  if (fh > maxH) {
    fh = maxH;
    fw = fh * imgR;
  }
  const x = (w - fw) / 2;
  const y = (h - fh) / 2;
  const cx = w / 2;
  const cy = h / 2;

  const prog = easeInOut(triangle(t)); // 0 → 1 → 0
  const maxR = 0.5 * Math.hypot(fw, fh) * 1.02;
  const r = prog * maxR;

  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, cornerR(p.radius, fw, fh));
  ctx.clip();
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.clip();
  drawImageCover(ctx, image, x, y, fw, fh);
  ctx.restore();

  // glowing ring at the iris edge
  if (p.edge > 0 && prog > 0.01 && prog < 0.99) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,255,255,${(p.edge / 100) * 0.9})`;
    ctx.lineWidth = Math.max(2, Math.min(fw, fh) * 0.006);
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 16;
    ctx.stroke();
  }
  ctx.restore();
}
