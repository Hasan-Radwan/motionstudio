import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'splitScreen',
  name: 'Split Screen',
  category: 'Slideshow & Story',
  media: { default: 3, min: 1, max: 5 },
};

export const controls = [
  { key: 'panels', type: 'range', label: 'Panels', min: 2, max: 5, step: 1, default: 3 },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 6, step: 0.5, default: 2, unit: '%' },
  { key: 'zoom', type: 'range', label: 'Ken Burns', min: 4, max: 24, step: 1, default: 12, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 6, unit: '%' },
];

// Vertical panels side by side, each slowly zooming/panning a different image
// (out of phase). The zoom breathes on a cosine, so every panel loops seamlessly.
export function render(ctx, t, p, { imageAt, w, h }) {
  const n = Math.round(p.panels);
  const gap = (Math.min(w, h) * p.gap) / 100;
  const pw = (w - gap * (n - 1)) / n;

  for (let i = 0; i < n; i++) {
    const x = i * (pw + gap);
    const ph = i / n;
    const zoom = (p.zoom / 100) * (0.5 - 0.5 * Math.cos((t + ph) * TAU));
    const z = 1 + zoom;
    const dw = pw * z;
    const dh = h * z;
    const panX = (pw - dw) / 2 + Math.sin((t + ph) * TAU) * pw * 0.05;
    const panY = (h - dh) / 2;
    ctx.save();
    roundedRectPath(ctx, x, 0, pw, h, cornerR(p.radius, pw, h));
    ctx.clip();
    drawImageCover(ctx, imageAt(i), x + panX, panY, dw, dh);
    // soft edge shading so adjacent panels read as separate
    const edge = ctx.createLinearGradient(x, 0, x + pw, 0);
    edge.addColorStop(0, 'rgba(0,0,0,0.28)');
    edge.addColorStop(0.12, 'rgba(0,0,0,0)');
    edge.addColorStop(0.88, 'rgba(0,0,0,0)');
    edge.addColorStop(1, 'rgba(0,0,0,0.28)');
    ctx.fillStyle = edge;
    ctx.fillRect(x, 0, pw, h);
    ctx.restore();
  }
}
