import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'cardTilt3d',
  name: 'Card Tilt',
  category: '3D & Perspective',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Card size', min: 40, max: 92, step: 1, default: 66, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Tilt', min: 0, max: 32, step: 1, default: 16, unit: '°' },
  { key: 'float', type: 'range', label: 'Float', min: 0, max: 6, step: 0.5, default: 2.5, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
  { key: 'shine', type: 'toggle', label: 'Shine sweep', default: true },
];

export function render(ctx, t, p, { image, w, h }) {
  const min = Math.min(w, h);
  const imgR = image && image.width ? image.width / image.height : 1.6;
  let cardW = (w * p.size) / 100;
  let cardH = cardW / imgR;
  const maxH = h * (p.size / 100);
  if (cardH > maxH) {
    cardH = maxH;
    cardW = cardH * imgR;
  }
  const tilt = (Math.sin(t * TAU) * p.tilt * Math.PI) / 180;
  const floatY = Math.sin(t * TAU) * (h * p.float) / 100;

  ctx.save();
  ctx.translate(w / 2, h / 2 + floatY);
  // fake rotateY: narrow horizontally + vertical shear for perspective
  const scaleX = Math.cos(tilt);
  const shearY = Math.sin(tilt) * 0.14;
  ctx.transform(scaleX, shearY, 0, 1, 0, 0);

  drawCard(ctx, image, -cardW / 2, -cardH / 2, cardW, cardH, {
    r: cornerR(p.radius, cardW, cardH),
    shadowBlur: min * 0.06,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowY: min * 0.03,
    shine: p.shine ? t : false,
    shineStrength: 0.28,
  });
  ctx.restore();
}
