import { drawImageCover, drawImageContain } from '../engine/canvasUtils.js';
import { clamp, lerp, easeOut } from '../engine/easing.js';

export const meta = {
  id: 'brandMotion01',
  name: 'Brand Motion 01',
  category: 'Logo & Branding',
  aspect: '16:9',
  duration: 5,
  // Image 1 = the logo (PNG). Images 2..N (up to 30) are an optional background
  // montage that flips quickly behind the revealed logo. One image works too.
  media: { default: 1, min: 1, max: 30 },
};

export const controls = [
  { key: 'logoSize', type: 'range', label: 'Logo size', min: 10, max: 90, step: 1, default: 46, unit: '%' },
  { key: 'overshoot', type: 'range', label: 'Overshoot', min: 0, max: 20, step: 1, default: 5, unit: '%' },
  { key: 'flips', type: 'range', label: 'Flip speed', min: 1, max: 8, step: 1, default: 2 },
  { key: 'bgZoom', type: 'range', label: 'Background zoom', min: 0, max: 12, step: 1, default: 3, unit: '%' },
  { key: 'shadow', type: 'range', label: 'Drop shadow', min: 0, max: 60, step: 1, default: 15, unit: '%' },
  { key: 'vignette', type: 'range', label: 'Vignette', min: 0, max: 100, step: 1, default: 35, unit: '%' },
];

// A professional logo reveal on a photorealistic mockup:
//   • Logo (image 1) fades in (0 → 100% over the first ~0.4s) and scales with a
//     "Scale & Overshoot" pop — 0% → 105% (~0.6s) → 100% (~0.8s), ease-out — then
//     holds for the rest of the clip.
//   • The mockup background (image 2, optional) does a slow Ken Burns zoom
//     (100% → 100%+Background-zoom) across the full 5s to add depth.
//   • A soft vignette darkens the edges so the eye lands on the centred logo, and
//     the logo casts a subtle drop shadow matched to the mockup lighting.
// Timings are fractions of the loop tuned for the default 5s duration.
const REVEAL = 0.16; // logo has fully settled by ~0.8s (16% of 5s)
const PEAK = 0.75; // overshoot peak at 75% of the reveal window (~0.6s)
const OPAC = 0.5; // opacity is full at 50% of the reveal window (~0.4s)

export function render(ctx, t, p, { imageAt, count, w, h }) {
  const logo = imageAt(0);
  const min = Math.min(w, h);
  const cx = w / 2;
  const cy = h / 2;

  // ---- background: a fast-flipping montage (images 2..N) behind the logo ----
  // With a single background image it's just a slow Ken Burns; with many it cuts
  // rapidly through EVERY image — `Flip speed` = full passes through the set per
  // loop, so all images always show (e.g. 30 images × 1 pass over 5s ≈ 6/sec).
  const montage = Math.max(0, count - 1);
  if (montage >= 1) {
    const flips = clamp(p.flips ?? 2, 1, 8);
    const idx = montage === 1 ? 0 : Math.floor(t * flips * montage) % montage;
    const mock = imageAt(1 + idx);
    if (mock && mock.width) {
      const z = 1 + (clamp(p.bgZoom, 0, 12) / 100) * t; // gentle Ken Burns zoom
      const bw = w * z;
      const bh = h * z;
      drawImageCover(ctx, mock, cx - bw / 2, cy - bh / 2, bw, bh);
    }
  }

  // ---- logo: fade + scale-overshoot reveal, then hold ----
  const u = clamp(t / REVEAL, 0, 1); // 0..1 across the reveal window
  const opacity = clamp(u / OPAC, 0, 1); // reaches full opacity partway through
  const over = 1 + clamp(p.overshoot, 0, 20) / 100; // e.g. 1.05
  let scale;
  if (t >= REVEAL) scale = 1; // settled — hold
  else if (u < PEAK) scale = over * easeOut(u / PEAK); // 0 → peak (105%)
  else scale = lerp(over, 1, easeOut((u - PEAK) / (1 - PEAK))); // peak → 100%

  if (logo && logo.width && opacity > 0.001) {
    const box = min * (clamp(p.logoSize, 10, 90) / 100);
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    const sh = clamp(p.shadow, 0, 60) / 100;
    if (sh > 0) {
      ctx.shadowColor = `rgba(0,0,0,${sh.toFixed(3)})`;
      ctx.shadowBlur = min * 0.04;
      ctx.shadowOffsetY = min * 0.015;
    }
    drawImageContain(ctx, logo, -box / 2, -box / 2, box, box);
    ctx.restore();
  }

  // ---- vignette: focus the eye on the centred logo ----
  const vig = clamp(p.vignette, 0, 100) / 100;
  if (vig > 0) {
    const r = Math.hypot(w, h) / 2;
    const g = ctx.createRadialGradient(cx, cy, r * 0.55, cx, cy, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, `rgba(0,0,0,${(vig * 0.6).toFixed(3)})`);
    ctx.save();
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ctx.restore();
  }
}
