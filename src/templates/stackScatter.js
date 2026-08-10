import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { seeded, pingpong, easeInOut } from '../engine/easing.js';

export const meta = {
  id: 'stackScatter',
  name: 'Stack Scatter',
  category: 'Stack & Scatter',
  media: { default: 6, min: 1, max: 9 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Copies', min: 3, max: 9, step: 1, default: 6 },
  { key: 'size', type: 'range', label: 'Card size', min: 30, max: 66, step: 1, default: 44, unit: '%' },
  { key: 'spread', type: 'range', label: 'Scatter', min: 10, max: 60, step: 1, default: 34, unit: '%' },
  { key: 'spin', type: 'range', label: 'Rotation', min: 0, max: 40, step: 1, default: 18, unit: '°' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 11, unit: '%' },
];

export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cx = w / 2;
  const cy = h / 2;
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const s = easeInOut(pingpong(t)); // 0 stacked -> 1 scattered -> 0

  const rnd = seeded(p.count * 7 + 3);
  const targets = [];
  for (let i = 0; i < p.count; i++) {
    const ang = rnd() * Math.PI * 2;
    const dist = (0.3 + rnd() * 0.7) * (w * p.spread) / 100;
    targets.push({
      dx: Math.cos(ang) * dist,
      dy: Math.sin(ang) * dist * 0.7,
      rot: ((rnd() - 0.5) * 2 * p.spin * Math.PI) / 180,
      i,
    });
  }

  for (let i = 0; i < p.count; i++) {
    const tg = targets[i];
    const stackOff = (i - (p.count - 1) / 2) * min * 0.008;
    const x = cx + tg.dx * s + stackOff;
    const y = cy + tg.dy * s + stackOff;
    const rot = tg.rot * s;
    ctx.save();
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
