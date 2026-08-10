import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'fan',
  name: 'Card Fan',
  category: 'Stack & Scatter',
  media: { default: 5, min: 1, max: 9 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 3, max: 9, step: 1, default: 5 },
  { key: 'size', type: 'range', label: 'Card size', min: 24, max: 52, step: 1, default: 36, unit: '%' },
  { key: 'spread', type: 'range', label: 'Spread', min: 20, max: 110, step: 1, default: 70, unit: '°' },
  { key: 'sway', type: 'range', label: 'Sway', min: 0, max: 20, step: 1, default: 8, unit: '°' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 11, unit: '%' },
];

// Cards fanned out around a pivot below the frame, gently swaying as a whole.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const count = p.count;
  const spread = (p.spread * Math.PI) / 180;
  const sway = ((p.sway * Math.PI) / 180) * Math.sin(t * TAU);

  const pivotX = w / 2;
  const pivotY = h * 1.02 + cardH * 0.9; // below the visible frame
  const armLen = cardH * 0.9 + h * 0.28;

  for (let i = 0; i < count; i++) {
    const f = count === 1 ? 0.5 : i / (count - 1);
    const ang = -spread / 2 + f * spread + sway;
    ctx.save();
    ctx.translate(pivotX, pivotY);
    ctx.rotate(ang);
    // card sits out along the arm, pointing up from the pivot
    drawCard(ctx, imageAt(i), -cardW / 2, -armLen - cardH / 2, cardW, cardH, {
      r: cornerR(p.radius, cardW, cardH),
      shadowBlur: min * 0.05,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
