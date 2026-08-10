import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { triangle, easeInOut } from '../engine/easing.js';

export const meta = {
  id: 'blinds',
  name: 'Blinds',
  category: 'Reveal & Wipe',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 100, step: 1, default: 88, unit: '%' },
  { key: 'count', type: 'range', label: 'Slats', min: 3, max: 14, step: 1, default: 7 },
  { key: 'dir', type: 'select', label: 'Direction', default: 'h', options: [
      { value: 'h', label: 'Horizontal' },
      { value: 'v', label: 'Vertical' },
    ] },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 8, unit: '%' },
];

// The image is revealed through opening slats (venetian blinds), then closes —
// seamless in / out.
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
  const prog = easeInOut(triangle(t)); // 0 → 1 → 0

  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, cornerR(p.radius, fw, fh));
  ctx.clip();

  const n = p.count;
  if (p.dir === 'h') {
    const band = fh / n;
    for (let i = 0; i < n; i++) {
      const by = y + i * band;
      const openH = band * prog;
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, by + (band - openH) / 2, fw, openH);
      ctx.clip();
      drawImageCover(ctx, image, x, y, fw, fh);
      ctx.restore();
    }
  } else {
    const band = fw / n;
    for (let i = 0; i < n; i++) {
      const bx = x + i * band;
      const openW = band * prog;
      ctx.save();
      ctx.beginPath();
      ctx.rect(bx + (band - openW) / 2, y, openW, fh);
      ctx.clip();
      drawImageCover(ctx, image, x, y, fw, fh);
      ctx.restore();
    }
  }
  ctx.restore();
}
