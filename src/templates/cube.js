import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'cube',
  name: 'Cube Spin',
  category: '3D & Perspective',
  media: { default: 4, min: 1, max: 4 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Size', min: 30, max: 70, step: 1, default: 48, unit: '%' },
  { key: 'depth', type: 'range', label: 'Depth', min: 20, max: 100, step: 1, default: 60, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 6, unit: '%' },
];

// A rotating box: up to two image faces are visible at once, foreshortened by
// cos(angle) and shaded by depth. One full turn per loop (seamless).
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.2;
  const cx = w / 2;
  const cy = h / 2;
  let cardW = (w * p.size) / 100;
  let cardH = cardW / imgR;
  const maxH = h * (p.size / 100);
  if (cardH > maxH) {
    cardH = maxH;
    cardW = cardH * imgR;
  }
  const half = (cardW / 2) * (p.depth / 100);
  const ang = t * TAU;

  const faces = [];
  for (let k = 0; k < 4; k++) {
    const a = ang + (k * Math.PI) / 2;
    const cosA = Math.cos(a);
    if (cosA <= 0.02) continue; // back-facing
    faces.push({ cosA, x: cx + Math.sin(a) * half, faceW: cardW * cosA, idx: k });
  }
  faces.sort((f1, f2) => f1.cosA - f2.cosA); // side (dim) first, front last

  for (const f of faces) {
    const x = f.x - f.faceW / 2;
    const y = cy - cardH / 2;
    ctx.save();
    roundedRectPath(ctx, x, y, f.faceW, cardH, cornerR(p.radius, f.faceW, cardH));
    ctx.save();
    ctx.clip();
    drawImageCover(ctx, imageAt(f.idx), x, y, f.faceW, cardH);
    // shade side faces so the fold reads as 3D
    ctx.fillStyle = `rgba(0,0,0,${(1 - f.cosA) * 0.45})`;
    ctx.fillRect(x, y, f.faceW, cardH);
    ctx.restore();
    ctx.restore();
  }
}
