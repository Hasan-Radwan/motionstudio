import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { TAU, pingpong } from '../engine/easing.js';

export const meta = {
  id: 'spotlight',
  name: 'Spotlight',
  category: 'Spotlight & Focus',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 96, step: 1, default: 80, unit: '%' },
  { key: 'zoom', type: 'range', label: 'Ken-Burns zoom', min: 0, max: 20, step: 1, default: 8, unit: '%' },
  { key: 'vignette', type: 'range', label: 'Vignette', min: 0, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
  { key: 'glow', type: 'toggle', label: 'Moving glow', default: true },
];

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

  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, cornerR(p.radius, fw, fh));
  ctx.clip();
  // subtle zoom that returns to start (seamless)
  const z = 1 + (p.zoom / 100) * pingpong(t);
  const zw = fw * z;
  const zh = fh * z;
  drawImageCover(ctx, image, x - (zw - fw) / 2, y - (zh - fh) / 2, zw, zh);

  // moving glow band
  if (p.glow) {
    const gx = x + fw * (0.5 + 0.4 * Math.cos(t * TAU));
    const gy = y + fh * (0.5 + 0.3 * Math.sin(t * TAU));
    const g = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(fw, fh) * 0.5);
    g.addColorStop(0, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillRect(x, y, fw, fh);
    ctx.globalCompositeOperation = 'source-over';
  }

  // vignette
  if (p.vignette > 0) {
    const v = ctx.createRadialGradient(
      x + fw / 2,
      y + fh / 2,
      Math.min(fw, fh) * 0.3,
      x + fw / 2,
      y + fh / 2,
      Math.max(fw, fh) * 0.72
    );
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, `rgba(0,0,0,${p.vignette / 100})`);
    ctx.fillStyle = v;
    ctx.fillRect(x, y, fw, fh);
  }
  ctx.restore();
}
