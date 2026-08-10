import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'flip3d',
  name: 'Flip Card',
  category: '3D & Perspective',
  media: { default: 2, min: 1, max: 6 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Card size', min: 40, max: 90, step: 1, default: 64, unit: '%' },
  { key: 'spins', type: 'range', label: 'Flips / loop', min: 1, max: 3, step: 1, default: 1 },
  { key: 'float', type: 'range', label: 'Float', min: 0, max: 6, step: 0.5, default: 2, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 11, unit: '%' },
];

// A card rotating around its vertical axis. Each half-turn reveals the next
// image, so it reads as a two-sided card flipping through the set.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.5;
  let cardW = (w * p.size) / 100;
  let cardH = cardW / imgR;
  const maxH = h * (p.size / 100);
  if (cardH > maxH) {
    cardH = maxH;
    cardW = cardH * imgR;
  }

  const ang = t * TAU * p.spins;
  const c = Math.cos(ang);
  // which face is showing → which image; count half-turns elapsed
  const face = Math.floor((ang + Math.PI / 2) / Math.PI);
  const img = imageAt(face);
  const floatY = Math.sin(t * TAU) * (h * p.float) / 100;

  ctx.save();
  ctx.translate(w / 2, h / 2 + floatY);
  const sx = Math.max(0.02, Math.abs(c));
  // vertical shear adds perspective; mirror the image on the back half-turn
  ctx.transform(sx, Math.sin(ang) * 0.06, 0, 1, 0, 0);
  if (c < 0) ctx.scale(-1, 1);

  drawCard(ctx, img, -cardW / 2, -cardH / 2, cardW, cardH, {
    r: cornerR(p.radius, cardW, cardH),
    shadowBlur: min * 0.06,
    shadowColor: 'rgba(0,0,0,0.5)',
    shadowY: min * 0.03,
    // a shine flash as the card passes edge-on
    shine: sx < 0.5 ? 0.5 : false,
    shineStrength: 0.4,
  });
  ctx.restore();
}
