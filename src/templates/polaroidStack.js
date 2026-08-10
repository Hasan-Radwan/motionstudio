import { roundedRectPath, drawImageCover } from '../engine/canvasUtils.js';
import { seeded, TAU } from '../engine/easing.js';

export const meta = {
  id: 'polaroidStack',
  name: 'Polaroid Stack',
  category: 'Stack & Scatter',
  media: { default: 5, min: 1, max: 10 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Photos', min: 3, max: 10, step: 1, default: 5 },
  { key: 'size', type: 'range', label: 'Photo size', min: 30, max: 60, step: 1, default: 44, unit: '%' },
  { key: 'scatter', type: 'range', label: 'Scatter', min: 6, max: 40, step: 1, default: 22, unit: '°' },
  { key: 'border', type: 'range', label: 'Border', min: 3, max: 12, step: 0.5, default: 6, unit: '%' },
];

// White-bordered photo cards fanned into a casual pile, each gently breathing
// (rotating a touch) so the stack feels alive without drifting over the loop.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1;
  const photoW = (w * p.size) / 100;
  const photoH = photoW / imgR;
  const b = photoW * (p.border / 100); // border thickness
  const caption = b * 1.8; // taller bottom margin (classic polaroid)
  const cardW = photoW + b * 2;
  const cardH = photoH + b + caption;
  const cx = w / 2;
  const cy = h / 2;
  const rnd = seeded(Math.round(p.count) * 41 + 13);
  const scatter = (p.scatter * Math.PI) / 180;

  for (let i = 0; i < p.count; i++) {
    const baseAng = (rnd() - 0.5) * 2 * scatter;
    const ox = (rnd() - 0.5) * 2 * min * 0.06;
    const oy = (rnd() - 0.5) * 2 * min * 0.05;
    const wobble = Math.sin((t + i / p.count) * TAU) * 0.03;
    ctx.save();
    ctx.translate(cx + ox, cy + oy);
    ctx.rotate(baseAng + wobble);

    // card shadow + white body
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = min * 0.04;
    ctx.shadowOffsetY = min * 0.02;
    roundedRectPath(ctx, -cardW / 2, -cardH / 2, cardW, cardH, cardW * 0.03);
    ctx.fillStyle = '#f7f7f4';
    ctx.fill();
    ctx.restore();

    // photo inset
    const px = -cardW / 2 + b;
    const py = -cardH / 2 + b;
    ctx.save();
    roundedRectPath(ctx, px, py, photoW, photoH, photoW * 0.01);
    ctx.clip();
    drawImageCover(ctx, imageAt(i), px, py, photoW, photoH);
    ctx.restore();

    ctx.restore();
  }
}
