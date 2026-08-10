import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { pingpong } from '../engine/easing.js';

export const meta = {
  id: 'slideshow',
  name: 'Slideshow',
  category: 'Slideshow & Story',
  media: { default: 4, min: 1, max: 10 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 100, step: 1, default: 92, unit: '%' },
  { key: 'zoom', type: 'range', label: 'Ken-Burns', min: 0, max: 20, step: 1, default: 10, unit: '%' },
  { key: 'fade', type: 'range', label: 'Crossfade', min: 5, max: 50, step: 1, default: 24, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 9, unit: '%' },
];

// Steps through every uploaded image, crossfading and slowly zooming each.
// Seamless: the last image crossfades back into the first at the loop seam.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = Math.max(1, count);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.6;
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

  const seg = (t % 1) * n; // 0..n
  const idx = Math.floor(seg) % n;
  const frac = seg - Math.floor(seg); // 0..1 within this image's segment
  const fadeF = p.fade / 100;

  const paint = (i, localT, alpha) => {
    const z = 1 + (p.zoom / 100) * pingpong(localT);
    const zw = fw * z;
    const zh = fh * z;
    ctx.globalAlpha = alpha;
    drawImageCover(ctx, imageAt(i), x - (zw - fw) / 2, y - (zh - fh) / 2, zw, zh);
  };

  // current image
  paint(idx, frac, 1);
  // next image fades in during the tail of the segment
  if (frac > 1 - fadeF && n > 1) {
    const a = (frac - (1 - fadeF)) / fadeF;
    paint(idx + 1, 0, a);
  }
  ctx.restore();
}
