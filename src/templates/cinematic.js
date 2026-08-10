import { drawImageCover } from '../engine/canvasUtils.js';
import { TAU, clamp } from '../engine/easing.js';

export const meta = {
  id: 'cinematic',
  name: 'Cinematic',
  category: 'Spotlight & Focus',
  media: { default: 1, min: 1, max: 8 },
};

export const controls = [
  { key: 'zoom', type: 'range', label: 'Slow zoom', min: 4, max: 24, step: 1, default: 12, unit: '%' },
  { key: 'bars', type: 'range', label: 'Letterbox', min: 4, max: 18, step: 1, default: 11, unit: '%' },
  { key: 'vignette', type: 'range', label: 'Vignette', min: 0, max: 70, step: 1, default: 40, unit: '%' },
];

const smooth = (x) => {
  const v = clamp(x, 0, 1);
  return v * v * (3 - 2 * v);
};

// A film look: full-frame image with a slow Ken-Burns push, crossfading through
// the set, framed by letterbox bars and a soft vignette. Zoom breathes on a
// cosine so the loop is seamless.
export function render(ctx, t, p, { imageAt, w, h, count }) {
  count = Math.max(1, count || 1);
  const z = 1 + (p.zoom / 100) * (0.5 - 0.5 * Math.cos(t * TAU));
  const dw = w * z;
  const dh = h * z;
  const ox = (w - dw) / 2 + Math.sin(t * TAU) * w * 0.02;
  const oy = (h - dh) / 2;

  const prog = t * count;
  const k = Math.floor(prog);
  const frac = prog - k;
  const nextA = smooth((frac - 0.7) / 0.3);

  drawImageCover(ctx, imageAt(k), ox, oy, dw, dh);
  if (nextA > 0.001) {
    ctx.save();
    ctx.globalAlpha = nextA;
    drawImageCover(ctx, imageAt(k + 1), ox, oy, dw, dh);
    ctx.restore();
  }

  // vignette
  if (p.vignette > 0) {
    const g = ctx.createRadialGradient(
      w / 2,
      h / 2,
      Math.min(w, h) * 0.25,
      w / 2,
      h / 2,
      Math.max(w, h) * 0.72
    );
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${p.vignette / 100})`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
  }

  // letterbox bars
  const bar = (h * p.bars) / 100;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, w, bar);
  ctx.fillRect(0, h - bar, w, bar);
}
