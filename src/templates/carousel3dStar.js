import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';
import { rotateXYZ } from '../engine/threed.js';

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const meta = {
  id: 'carousel3dStar',
  name: 'Carousel 3D Star',
  category: '3D & Perspective',
  media: { default: 12, min: 1, max: 40 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Count', min: 4, max: 40, step: 1, default: 12 },
  { key: 'size', type: 'range', label: 'Plane size', min: 10, max: 36, step: 1, default: 22, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corner radius', min: 0, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'radius', type: 'range', label: 'Orbit radius', min: 3, max: 200, step: 1, default: 12, unit: '%' },
  { key: 'distance', type: 'range', label: 'Distance', min: 0, max: 100, step: 1, default: 50, unit: '%' },
  { key: 'perspective', type: 'range', label: 'Perspective', min: 1.2, max: 6, step: 0.1, default: 2.2 },
  { key: 'rotationX', type: 'range', label: 'Rotation X', min: -180, max: 180, step: 1, default: 90, unit: '°' },
  { key: 'rotationY', type: 'range', label: 'Rotation Y', min: -180, max: 180, step: 1, default: -14, unit: '°' },
  { key: 'rotationZ', type: 'range', label: 'Rotation Z', min: -180, max: 180, step: 1, default: -3, unit: '°' },
  { key: 'twist', type: 'range', label: 'Twist', min: -90, max: 90, step: 1, default: 0, unit: '°' },
  { key: 'offsetX', type: 'range', label: 'Offset X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'offsetY', type: 'range', label: 'Offset Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'cycleDeg', type: 'range', label: 'Cycle deg', min: 90, max: 720, step: 90, default: 360, unit: '°' },
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
];

// A star-burst 3D carousel. Cards are flat petals lying in a ring, their long axis
// pointing radially; with Rotation X ≈ 90° the ring is seen flat-on and the petals
// radiate into a star. Rotation X/Y/Z rotate the WHOLE group as one rigid block:
// each card is drawn as a real projected parallelogram from its 3D frame (its
// width & height axes are Euler-rotated with the group and fed to ctx.transform),
// so the cards never spin independently. Whole 360° cycles loop seamlessly.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const dir = p.direction === 'ccw' ? -1 : 1;
  const cx = w / 2 + (w * (p.offsetX || 0)) / 100;
  const cy = h / 2 + (h * (p.offsetY || 0)) / 100;
  const R = (w * p.radius) / 100;
  const foc = R * p.perspective;
  const camDist = foc + R + ((p.distance ?? 50) / 100) * R * 3;
  const cardW = (w * p.size) / 100;
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 0.66;
  const cardH = cardW / imgR;
  const step = TAU / n;
  const base = t * (p.cycleDeg || 360) * DEG * dir;
  const rx = (p.rotationX ?? 90) * DEG;
  const ry = (p.rotationY || 0) * DEG;
  const rz = (p.rotationZ || 0) * DEG;
  const tw = (p.twist || 0) * DEG; // per-card blade angle off pure-radial

  const items = [];
  for (let i = 0; i < n; i++) {
    const a = base + i * step;
    const sa = Math.sin(a);
    const ca = Math.cos(a);
    // Position sits at ring angle `a`; the card's own axes are angled by Twist
    // (angle a + tw) so each blade tilts off pure-radial → a pinwheel/fan look.
    const at = a + tw;
    const sat = Math.sin(at);
    const cat = Math.cos(at);
    const P = rotateXYZ(sa * R, 0, ca * R, rx, ry, rz);
    const S = rotateXYZ(sat, 0, cat, rx, ry, rz); // spine (height) axis
    const W = rotateXYZ(cat, 0, -sat, rx, ry, rz); // width axis
    const proj = foc / Math.max(1, camDist - P.z);
    const dref = Math.max(R, 1);
    const depth = clamp((P.z + dref) / (2 * dref), 0, 1);
    items.push({ x: cx + P.x * proj, y: cy + P.y * proj, S, W, proj, depth, z: P.z, idx: i });
  }
  items.sort((a, b) => a.z - b.z);

  for (const it of items) {
    const cw = cardW * it.proj;
    const ch = cardH * it.proj;
    if (cw < 0.5) continue;
    ctx.save();
    ctx.globalAlpha = clamp(0.4 + it.depth * 0.6, 0, 1);
    // Project the card quad: local (x=width, y=height) → screen via its rotated
    // 2D axes. The axes' foreshortening (|.| < 1 when they tilt toward the camera)
    // gives the true edge-on thinning, and the whole group turns rigidly.
    ctx.transform(it.W.x, it.W.y, it.S.x, it.S.y, it.x, it.y);
    // Root each card's INNER edge at the ring and extend it OUTWARD along its
    // spine (local y ≥ 0), so the blades radiate from the centre like a star
    // instead of piling up through the middle.
    drawCard(ctx, imageAt(it.idx), -cw / 2, 0, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.03 * it.proj,
      shadowColor: withAlpha('#000000', 0.5 * it.depth),
      shadowY: min * 0.01,
      shine: false,
    });
    ctx.restore();
  }
}
