import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'filmstrip',
  name: 'Filmstrip',
  category: 'Carousel & Flow',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Strip height', min: 40, max: 90, step: 1, default: 62, unit: '%' },
  { key: 'gap', type: 'range', label: 'Frame gap', min: 1, max: 8, step: 0.5, default: 3, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 30, step: 1, default: 6, unit: '%' },
];

// A classic film strip: frames scroll left with sprocket holes on a dark band.
export function render(ctx, t, p, { imageAt, w, h }) {
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const stripH = (h * p.size) / 100;
  const bandY = (h - stripH) / 2;
  const perf = stripH * 0.12; // sprocket band height
  const frameH = stripH - perf * 2 - stripH * 0.06;
  const frameW = frameH * imgR;
  const gap = (w * p.gap) / 100;
  const step = frameW + gap;
  const frameY = bandY + perf + stripH * 0.03;

  // dark film base
  ctx.save();
  ctx.fillStyle = '#0a0a0c';
  ctx.fillRect(0, bandY, w, stripH);

  // sprocket holes top and bottom
  const holeW = perf * 0.7;
  const holeH = perf * 0.5;
  const holeStep = holeW * 2;
  const holeScroll = (t % 1) * holeStep;
  ctx.fillStyle = '#1c1c22';
  for (let hx = -holeStep; hx < w + holeStep; hx += holeStep) {
    const x = hx - holeScroll;
    roundedRectPath(ctx, x, bandY + perf * 0.25, holeW, holeH, holeH * 0.3);
    ctx.fill();
    roundedRectPath(ctx, x, bandY + stripH - perf * 0.75, holeW, holeH, holeH * 0.3);
    ctx.fill();
  }

  // frames
  const n = Math.ceil(w / step) + 3;
  const period = n * step;
  const scroll = (t % 1) * step;
  for (let i = 0; i < n; i++) {
    let x = i * step - scroll;
    x = ((x % period) + period) % period;
    if (x > w + step) x -= period;
    ctx.save();
    roundedRectPath(ctx, x, frameY, frameW, frameH, cornerR(p.radius, frameW, frameH));
    ctx.clip();
    drawImageCover(ctx, imageAt(i), x, frameY, frameW, frameH);
    ctx.restore();
  }
  ctx.restore();
}
