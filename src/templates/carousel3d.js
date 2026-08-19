import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'carousel3d',
  name: 'Carousel 3D 01',
  category: '3D & Perspective',
  media: { default: 10, min: 1, max: 24 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 24, step: 1, default: 10 },
  { key: 'radius', type: 'range', label: 'Ring size', min: 20, max: 46, step: 1, default: 34, unit: '%' },
  { key: 'size', type: 'range', label: 'Card size', min: 14, max: 40, step: 1, default: 26, unit: '%' },
  { key: 'perspective', type: 'range', label: 'Perspective', min: 1.2, max: 6, step: 0.1, default: 2.6 },
  { key: 'tilt', type: 'range', label: 'Tilt', min: 0, max: 40, step: 1, default: 14, unit: '%' },
  { key: 'turns', type: 'range', label: 'Turns', min: 0.25, max: 3, step: 0.25, default: 1 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'cw',
    options: [
      { value: 'cw', label: 'Clockwise' },
      { value: 'ccw', label: 'Counter-clockwise' },
    ],
  },
  { key: 'minScale', type: 'range', label: 'Back scale', min: 30, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'backOpacity', type: 'range', label: 'Back fade', min: 0, max: 100, step: 1, default: 35, unit: '%' },
  { key: 'faceTurn', type: 'range', label: 'Face turn', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 8, unit: '%' },
  { key: 'offsetX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'offsetY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

// A premium editorial 3D card carousel — the same mathematical orbital system as
// a CSS/WebGL version, but drawn with fake-3D Canvas2D so preview and export are
// pixel-identical. All cards ride ONE shared virtual circle in the XZ plane and a
// single continuously-advancing angle spins the whole ring around the vertical
// (Y) axis — no per-card keyframes.
//
//   a     = base + i * step                 // base advances with the loop
//   wx    = sin(a) * R,  wz = cos(a) * R    // position on the ring (front = +wz)
//   proj  = foc / (foc + R - wz)            // pinhole perspective (front spreads, back compresses)
//   depth = (wz + R) / (2R)                 // 0 = far back .. 1 = front
//   scale = minScale + depth*(1 - minScale) // depth-based sizing
//
// Depth also drives opacity and paint order; the card's own facing (cos a) drives
// a horizontal foreshorten so the ring reads as a true rotating cylinder rather
// than flat billboards. Whole `turns` loop seamlessly (config repeats every 360°).
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const dir = p.direction === 'ccw' ? -1 : 1;
  const cx = w / 2 + (w * (p.offsetX || 0)) / 100;
  const cy = h / 2 + (h * (p.offsetY || 0)) / 100;
  const R = (w * p.radius) / 100;
  const foc = R * p.perspective; // focal length: larger = gentler perspective
  const cardW = (w * p.size) / 100;
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 0.72; // portrait fallback
  const cardH = cardW / imgR; // preserve the image's aspect ratio
  const step = TAU / n;
  const base = t * TAU * p.turns * dir;
  const minS = p.minScale / 100;
  const backA = (p.backOpacity ?? 35) / 100;
  const tiltAmt = (p.tilt || 0) / 100;
  const faceTurn = (p.faceTurn ?? 100) / 100;

  const items = [];
  for (let i = 0; i < n; i++) {
    const a = base + i * step;
    const ca = Math.cos(a);
    const sa = Math.sin(a);
    const wz = ca * R; // world Z: +R at the front, -R at the back
    const proj = foc / (foc + R - wz); // perspective factor (>1 near, <1 far)
    const depth = (wz + R) / (2 * R); // 0 back .. 1 front
    const x = cx + sa * R * proj; // horizontal position, perspective-spread
    const y = cy - wz * tiltAmt * proj; // ring tilt: back rides higher
    const scale = minS + depth * (1 - minS); // 1 at the front, minScale at the back
    const alpha = backA + depth * (1 - backA);
    // Facing foreshorten: full width at front/back, edge-on (thin) at the sides.
    const widthFactor = 1 - faceTurn * (1 - Math.abs(ca));
    const mirror = ca < 0 ? -1 : 1; // far-side cards show their back (mirrored)
    items.push({ x, y, scale, alpha, widthFactor, mirror, sa, depth, idx: i, order: foc + R - wz });
  }
  items.sort((a, b) => b.order - a.order); // far first, near painted on top

  for (const it of items) {
    const cw = cardW * it.scale;
    const ch = cardH * it.scale;
    if (cw < 1 || it.alpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, it.alpha));
    ctx.translate(it.x, it.y);
    ctx.rotate(it.sa * 0.04 * faceTurn); // very subtle wobble, keeps it un-mechanical
    ctx.scale(it.widthFactor * it.mirror, 1); // cylinder foreshorten + back mirror
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.05 * it.scale,
      shadowColor: withAlpha('#000000', 0.5 * it.depth),
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
