import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { clamp } from '../engine/easing.js';

export const meta = {
  id: 'featureStream',
  name: 'Feature Stream',
  category: 'Slideshow & Story',
  media: { default: 6, min: 1, max: 16 },
};

export const controls = [
  { key: 'hero', type: 'range', label: 'Hero size', min: 40, max: 68, step: 1, default: 54, unit: '%' },
  { key: 'thumbs', type: 'range', label: 'Stream count', min: 3, max: 8, step: 1, default: 5 },
  { key: 'thumb', type: 'range', label: 'Thumb size', min: 14, max: 30, step: 1, default: 22, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

const smooth = (x) => {
  const v = clamp(x, 0, 1);
  return v * v * (3 - 2 * v);
};

// A featured "hero" card on the left cross-fades through the whole set, while a
// column of thumbnails streams upward on the right. Both loops are seamless: the
// hero hands off between images and the stream wraps by exactly one span.
export function render(ctx, t, p, { imageAt, w, h, count }) {
  count = Math.max(1, count || 1);
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;

  // ---- hero (left) ----
  let heroW = (w * p.hero) / 100;
  let heroH = heroW / imgR;
  const maxH = h * 0.82;
  if (heroH > maxH) {
    heroH = maxH;
    heroW = heroH * imgR;
  }
  const heroCX = w * 0.34;
  const heroCY = h / 2;
  const hx = heroCX - heroW / 2;
  const hy = heroCY - heroH / 2;
  const r = cornerR(p.radius, heroW, heroH);

  const prog = t * count;
  const k = Math.floor(prog);
  const frac = prog - k;
  const nextA = smooth((frac - 0.68) / 0.32); // hold, then fade to next

  ctx.save();
  drawCard(ctx, imageAt(k), hx, hy, heroW, heroH, {
    r,
    shadowBlur: min * 0.06,
    shadowColor: 'rgba(0,0,0,0.55)',
    shadowY: min * 0.025,
    shine: false,
  });
  if (nextA > 0.001) {
    ctx.globalAlpha = nextA;
    drawCard(ctx, imageAt(k + 1), hx, hy, heroW, heroH, {
      r,
      shadowBlur: min * 0.06,
      shadowColor: 'rgba(0,0,0,0.55)',
      shadowY: min * 0.025,
      shine: false,
    });
  }
  ctx.restore();

  // ---- stream (right) ----
  const m = Math.round(p.thumbs);
  const thumbW = (w * p.thumb) / 100;
  const thumbH = thumbW / imgR;
  const colX = w * 0.82;
  const spacing = (h + thumbH) / m;
  const span = h + thumbH;

  for (let i = 0; i < m; i++) {
    const yRaw = (((i * spacing - t * span) % span) + span) % span; // 0..span
    const cyT = yRaw - thumbH; // screen y (top), scrolls up
    // fade in/out at the column edges
    const edge = Math.min(
      smooth((cyT + thumbH) / (thumbH * 0.8)),
      smooth((h - cyT) / (thumbH * 0.8))
    );
    ctx.save();
    ctx.globalAlpha = 0.5 + 0.5 * edge;
    drawCard(ctx, imageAt(k + 1 + i), colX - thumbW / 2, cyT, thumbW, thumbH, {
      r: cornerR(p.radius, thumbW, thumbH),
      shadowBlur: min * 0.03,
      shadowColor: 'rgba(0,0,0,0.4)',
      shadowY: min * 0.012,
      shine: false,
    });
    ctx.restore();
  }
}
