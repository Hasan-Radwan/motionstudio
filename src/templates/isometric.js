import { roundedRectPath, drawImageCover, cardShadowScale } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'isometric',
  name: 'Isometric',
  category: 'Isometric',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Card size', min: 40, max: 84, step: 1, default: 58, unit: '%' },
  { key: 'angle', type: 'range', label: 'Rotation', min: 0, max: 45, step: 1, default: 26, unit: '°' },
  { key: 'flat', type: 'range', label: 'Flatten', min: 35, max: 75, step: 1, default: 55, unit: '%' },
  { key: 'depth', type: 'range', label: 'Thickness', min: 0, max: 8, step: 0.5, default: 3.5, unit: '%' },
  { key: 'float', type: 'range', label: 'Float', min: 0, max: 6, step: 0.5, default: 2.5, unit: '%' },
];

function facePath(ctx, cw, ch, r) {
  roundedRectPath(ctx, -cw / 2, -ch / 2, cw, ch, r);
}

export function render(ctx, t, p, { image, w, h }) {
  const min = Math.min(w, h);
  const imgR = image && image.width ? image.width / image.height : 1.4;
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const A = (p.angle * Math.PI) / 180;
  const flat = p.flat / 100;
  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const floatY = Math.sin(t * TAU) * (h * p.float) / 100;
  const depth = (min * p.depth) / 100;
  const r = cardW * 0.05;

  const applyIso = () => ctx.transform(cosA, sinA * flat, -sinA, cosA * flat, 0, 0);

  // --- extruded thickness (dark copy offset straight down) ---
  if (depth > 0.5) {
    ctx.save();
    ctx.translate(w / 2, h / 2 + floatY + depth);
    applyIso();
    facePath(ctx, cardW, cardH, r);
    ctx.fillStyle = '#0b0c10';
    ctx.fill();
    ctx.restore();
  }

  // --- top face (the image) ---
  ctx.save();
  ctx.translate(w / 2, h / 2 + floatY);
  // soft ground shadow (global strength, 0 = off)
  const sh = cardShadowScale();
  if (sh > 0) {
    ctx.save();
    applyIso();
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowBlur = min * 0.05 * sh;
    ctx.shadowOffsetY = min * 0.02 * sh;
    facePath(ctx, cardW, cardH, r);
    ctx.fillStyle = '#0e0f13';
    ctx.fill();
    ctx.restore();
  }

  applyIso();
  ctx.save();
  facePath(ctx, cardW, cardH, r);
  ctx.clip();
  drawImageCover(ctx, image, -cardW / 2, -cardH / 2, cardW, cardH);
  // subtle top-light sheen
  const g = ctx.createLinearGradient(0, -cardH / 2, 0, cardH / 2);
  g.addColorStop(0, 'rgba(255,255,255,0.12)');
  g.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
  ctx.restore();
  ctx.restore();
}
