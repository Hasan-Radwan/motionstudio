import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { pingpong, easeOut, seeded } from '../engine/easing.js';

export const meta = {
  id: 'cascade',
  name: 'Cascade',
  category: 'Stack & Scatter',
  media: { default: 6, min: 1, max: 10 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 3, max: 10, step: 1, default: 6 },
  { key: 'size', type: 'range', label: 'Card size', min: 30, max: 64, step: 1, default: 46, unit: '%' },
  { key: 'spin', type: 'range', label: 'Tumble', min: 0, max: 40, step: 1, default: 16, unit: '°' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 11, unit: '%' },
];

// Cards drop in from above one after another to form a centred stack, then lift
// back out — seamless because the whole motion runs on a symmetric ping-pong.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const cx = w / 2;
  const cy = h / 2;
  const P = pingpong(t); // 0 (up) → 1 (settled) → 0
  const rnd = seeded(p.count * 17 + 9);

  for (let i = 0; i < p.count; i++) {
    const phase = (i / p.count) * 0.55; // stagger the drops
    const f = easeOut(Math.max(0, Math.min(1, (P - phase) / (1 - phase))));
    const stackOff = (i - (p.count - 1) / 2) * min * 0.01;
    const startY = cy - h * 0.85;
    const y = startY + (cy + stackOff - startY) * f;
    const x = cx + stackOff;
    const rot = (((rnd() - 0.5) * 2 * p.spin * Math.PI) / 180) * (1 - f);
    ctx.save();
    ctx.globalAlpha = Math.min(1, f * 3);
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawCard(ctx, imageAt(i), -cardW / 2, -cardH / 2, cardW, cardH, {
      r: cornerR(p.radius, cardW, cardH),
      shadowBlur: min * 0.05,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
