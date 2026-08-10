import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';
import { TAU, clamp } from '../engine/easing.js';

export const meta = {
  id: 'reflection',
  name: 'Reflection',
  category: '3D & Perspective',
  media: { default: 1, min: 1, max: 6 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Image size', min: 46, max: 84, step: 1, default: 66, unit: '%' },
  { key: 'gap', type: 'range', label: 'Gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'fade', type: 'range', label: 'Reflection', min: 20, max: 80, step: 1, default: 55, unit: '%' },
  { key: 'zoom', type: 'range', label: 'Slow zoom', min: 0, max: 16, step: 1, default: 8, unit: '%' },
];

const smooth = (x) => {
  const v = clamp(x, 0, 1);
  return v * v * (3 - 2 * v);
};

// A hero image with a mirrored, fading floor reflection and a gentle breathing
// zoom; crossfades through the set. Seamless on a cosine.
export function render(ctx, t, p, { imageAt, w, h, count }) {
  count = Math.max(1, count || 1);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const z = 1 + (p.zoom / 100) * (0.5 - 0.5 * Math.cos(t * TAU));

  const gap = (Math.min(w, h) * p.gap) / 100;
  const reflH = 0.5; // reflection is half the image height
  let fw = (w * p.size) / 100;
  let fh = fw / imgR;
  const totalMax = h * 0.92;
  const total = fh + gap + fh * reflH;
  if (total > totalMax) {
    const k = totalMax / total;
    fh *= k;
    fw = fh * imgR;
  }
  fw *= z;
  fh *= z;
  const stackH = fh + gap + fh * reflH;
  const x = (w - fw) / 2;
  const y = (h - stackH) / 2;
  const r = cornerR(6, fw, fh);

  const prog = t * count;
  const k = Math.floor(prog);
  const frac = prog - k;
  const nextA = smooth((frac - 0.7) / 0.3);

  const paint = (img, alpha) => {
    // main image
    ctx.save();
    ctx.globalAlpha = alpha;
    roundedRectPath(ctx, x, y, fw, fh, r);
    ctx.clip();
    drawImageCover(ctx, img, x, y, fw, fh);
    ctx.restore();

    // reflection (mirrored below, fading down)
    const ry = y + fh + gap;
    ctx.save();
    ctx.globalAlpha = alpha * (p.fade / 100);
    ctx.translate(x, ry + fh * reflH);
    ctx.scale(1, -1);
    roundedRectPath(ctx, 0, 0, fw, fh * reflH, r);
    ctx.clip();
    drawImageCover(ctx, img, 0, -(fh - fh * reflH), fw, fh);
    ctx.restore();

    // fade the reflection out toward the bottom
    const g = ctx.createLinearGradient(0, ry, 0, ry + fh * reflH);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.85)');
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = g;
    ctx.fillRect(x, ry, fw, fh * reflH);
    ctx.restore();
  };

  paint(imageAt(k), 1);
  if (nextA > 0.001) paint(imageAt(k + 1), nextA);
}
