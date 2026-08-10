import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { pingpong } from '../engine/easing.js';

export const meta = {
  id: 'zoomBlur',
  name: 'Zoom Blur',
  category: 'Spotlight & Focus',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 100, step: 1, default: 90, unit: '%' },
  { key: 'amount', type: 'range', label: 'Blur pulse', min: 5, max: 40, step: 1, default: 22, unit: '%' },
  { key: 'copies', type: 'range', label: 'Streak steps', min: 3, max: 12, step: 1, default: 8 },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 9, unit: '%' },
];

// A punchy radial zoom-blur: stacked scaled copies of the image create a streak
// that pulses in and out (seamless).
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
  const amt = (p.amount / 100) * pingpong(t);

  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, cornerR(p.radius, fw, fh));
  ctx.clip();

  // base image
  drawImageCover(ctx, image, x, y, fw, fh);

  // additive zoomed copies fanning outward = radial blur streak
  const k = Math.round(p.copies);
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 1; i <= k; i++) {
    const f = i / k;
    const scale = 1 + amt * f * 0.6;
    const zw = fw * scale;
    const zh = fh * scale;
    ctx.globalAlpha = amt * 0.5 * (1 - f);
    drawImageCover(ctx, image, cx - zw / 2, cy - zh / 2, zw, zh);
  }
  ctx.restore();
}
