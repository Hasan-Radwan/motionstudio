import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'carousel04',
  name: 'Carousel 04',
  category: 'Carousel & Flow',
  pro: true, // Pro template: previewable/editable, gated at export
  duration: 6,
  media: { default: 8, min: 3, max: 16 },
};

export const controls = [
  { key: 'barWidth', type: 'range', label: 'Bar width', min: 4, max: 20, step: 0.5, default: 8, unit: '%' },
  { key: 'barHeight', type: 'range', label: 'Bar height', min: 20, max: 80, step: 1, default: 46, unit: '%' },
  { key: 'openSize', type: 'range', label: 'Open size', min: 30, max: 90, step: 1, default: 58, unit: '%' },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 8, step: 0.5, default: 1.5, unit: '%' },
  { key: 'blur', type: 'range', label: 'Blur', min: 0, max: 10, step: 0.5, default: 3 },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 8, unit: '%' },
  { key: 'cycles', type: 'range', label: 'Cycles', min: 1, max: 3, step: 1, default: 1 },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

const mod = (i, n) => (((i % n) + n) % n);
const easeCubicInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// The Originkit Magnetic Carousel's "open" interaction, AUTOMATED: instead of
// clicking a thin bar to expand it into a large square, the carousel opens each
// image in turn — one bar spotlights to a big square while the others stay thin,
// dimmed and blurred, then it hands off to the next. Cycles through all images.
// Seamless because it advances an integer number of full image-cycles per loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = count;
  if (n < 1) return;
  const min = Math.min(w, h);
  const offX = (w * (p.posX || 0)) / 100;
  const offY = (h * (p.posY || 0)) / 100;
  const bw0 = min * (p.barWidth / 100);
  const bh0 = min * (p.barHeight / 100);
  const os = min * (p.openSize / 100);
  const gap = min * (p.gap / 100);
  const cy = h / 2 + offY;

  // Which image is spotlit: hold on it, then ease the hand-off to the next.
  const cyc = Math.max(1, Math.round(p.cycles || 1));
  const raw = t * n * cyc;
  const stepIdx = Math.floor(raw);
  const ph = raw - stepIdx;
  const hold = 0.42;
  const e = ph < hold ? 0 : easeCubicInOut((ph - hold) / (1 - hold));
  const cur = mod(stepIdx, n);
  const nxt = mod(stepIdx + 1, n);

  // Per-bar open factor (0 = thin bar, 1 = full square).
  const openF = new Array(n).fill(0);
  openF[cur] += 1 - e;
  openF[nxt] += e;

  const wi = openF.map((v) => bw0 + (os - bw0) * v);
  const hi = openF.map((v) => bh0 + (os - bh0) * v);

  const total = wi.reduce((a, b) => a + b, 0) + (n - 1) * gap;
  let x = (w - total) / 2 + offX;
  for (let i = 0; i < n; i++) {
    const bw = wi[i];
    const bh = hi[i];
    const bx = x;
    const by = cy - bh / 2;
    const im = imageAt(i);
    const r = cornerR(p.corners, bw, bh);
    const closed = 1 - openF[i]; // 0 = fully open, 1 = fully collapsed
    const blurPx = (p.blur || 0) * closed;
    ctx.save();
    roundedRectPath(ctx, bx, by, bw, bh, r);
    ctx.clip();
    if (blurPx > 0.3) ctx.filter = `blur(${blurPx.toFixed(2)}px)`;
    if (im && im.width) drawImageCover(ctx, im, bx, by, bw, bh);
    else {
      ctx.fillStyle = `hsl(${(i * 360) / n}, 70%, 58%)`;
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.filter = 'none';
    if (closed > 0.01) {
      ctx.fillStyle = `rgba(8,10,14,${0.42 * closed})`; // dim the collapsed bars
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.restore();
    x += bw + gap;
  }
}
