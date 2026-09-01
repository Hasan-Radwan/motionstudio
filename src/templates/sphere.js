import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'sphere',
  name: 'Sphere Carousel',
  category: 'Carousel & Flow',
  duration: 5,
  media: { default: 8, min: 3, max: 16 },
};

export const controls = [
  { key: 'barWidth', type: 'range', label: 'Bar width', min: 4, max: 20, step: 0.5, default: 8, unit: '%' },
  { key: 'barHeight', type: 'range', label: 'Bar height', min: 20, max: 80, step: 1, default: 50, unit: '%' },
  { key: 'magnify', type: 'range', label: 'Magnify', min: 20, max: 180, step: 1, default: 110, unit: '%' },
  { key: 'influence', type: 'range', label: 'Influence', min: 10, max: 80, step: 1, default: 32, unit: '%' },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 8, step: 0.5, default: 1.5, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 6, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

const smoothstep = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// A macOS-dock-style "magnetic" row of thin image bars: a bar magnifies (width +
// a little height) as a focus point nears it, tapering off with distance. Ported
// from the Originkit Magnetic Carousel, with the CURSOR replaced by AUTOMATIC
// motion — a magnify wave sweeps left → right across the row. Seamless because the
// focus starts and ends off-screen (all bars collapsed at t=0 and t=1). No guide
// lines or centre marker are drawn — just the images.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = count;
  if (n < 1) return;
  const min = Math.min(w, h);
  const offX = (w * (p.posX || 0)) / 100;
  const offY = (h * (p.posY || 0)) / 100;
  const barW = min * (p.barWidth / 100);
  const barH = min * (p.barHeight / 100);
  const gap = min * (p.gap / 100);
  const infl = Math.max(1, w * (p.influence / 100));
  const mag = p.magnify / 100;
  const cy = h / 2 + offY;

  // Stable collapsed-layout centres (so the wave tracks the focus without jitter).
  const totalBase = n * barW + (n - 1) * gap;
  const startBase = (w - totalBase) / 2 + offX;
  const centers = [];
  for (let i = 0; i < n; i++) centers.push(startBase + i * (barW + gap) + barW / 2);

  // Auto focus sweeps from just off the left edge to just off the right edge; at
  // both ends every bar is collapsed, so the loop is seamless.
  const focusX = -infl + t * (w + 2 * infl);
  const f = centers.map((c) => smoothstep(Math.max(0, 1 - Math.abs(focusX - c) / infl)));

  // Magnified sizes (width grows fully, height a third as much — dock feel).
  const wi = f.map((v) => barW * (1 + mag * v));
  const hi = f.map((v) => barH * (1 + mag * 0.35 * v));

  // Lay the (magnified) bars out left→right, centred as a group.
  const total = wi.reduce((a, b) => a + b, 0) + (n - 1) * gap;
  let x = (w - total) / 2 + offX;
  for (let i = 0; i < n; i++) {
    const bw = wi[i];
    const bh = hi[i];
    const bx = x;
    const by = cy - bh / 2;
    const im = imageAt(i);
    const r = cornerR(p.corners, bw, bh);
    ctx.save();
    roundedRectPath(ctx, bx, by, bw, bh, r);
    ctx.clip();
    if (im && im.width) drawImageCover(ctx, im, bx, by, bw, bh);
    else {
      ctx.fillStyle = `hsl(${(i * 360) / n}, 70%, 58%)`;
      ctx.fillRect(bx, by, bw, bh);
    }
    ctx.restore();
    x += bw + gap;
  }
}
