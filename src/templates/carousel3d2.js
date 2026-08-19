import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';
import { rotateXYZ } from '../engine/threed.js';

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const meta = {
  id: 'carousel3d2',
  name: 'Carousel 3D 02',
  category: '3D & Perspective',
  media: { default: 18, min: 1, max: 40 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 6, max: 40, step: 1, default: 18 },
  { key: 'size', type: 'range', label: 'Plane size', min: 10, max: 34, step: 1, default: 18, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corner radius', min: 0, max: 50, step: 1, default: 14, unit: '%' },
  { key: 'radius', type: 'range', label: 'Orbit radius', min: 10, max: 40, step: 1, default: 22, unit: '%' },
  { key: 'perspective', type: 'range', label: 'Perspective', min: 1.2, max: 6, step: 0.1, default: 2.2 },
  { key: 'fan', type: 'range', label: 'Fan', min: 0, max: 200, step: 1, default: 100, unit: '%' },
  { key: 'rotationX', type: 'range', label: 'Rotation X', min: -180, max: 180, step: 1, default: -58, unit: '°' },
  { key: 'rotationY', type: 'range', label: 'Rotation Y', min: -180, max: 180, step: 1, default: 0, unit: '°' },
  { key: 'rotationZ', type: 'range', label: 'Rotation Z', min: -180, max: 180, step: 1, default: 0, unit: '°' },
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
  { key: 'offsetX', type: 'range', label: 'Offset X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'offsetY', type: 'range', label: 'Offset Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

// A fanned, flower-like 3D carousel. Cards sit on a small ring and each one is
// spun in the screen plane by its own ring angle, so the group splays out like
// petals; the whole flower is then Euler-rotated in 3D (Rotation X/Y/Z) and
// pinhole-projected. Cycle deg / direction spin the fan; whole 360° cycles loop
// seamlessly (the configuration repeats).
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const dir = p.direction === 'ccw' ? -1 : 1;
  const cx = w / 2 + (w * (p.offsetX || 0)) / 100;
  const cy = h / 2 + (h * (p.offsetY || 0)) / 100;
  const R = (w * p.radius) / 100;
  const foc = R * p.perspective;
  const camDist = foc + R;
  const cardW = (w * p.size) / 100;
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 0.66;
  const cardH = cardW / imgR;
  const step = TAU / n;
  const cycle = (p.cycleDeg || 360) * DEG;
  const base = t * cycle * dir;
  const fan = (p.fan ?? 100) / 100;
  const rx = (p.rotationX || 0) * DEG;
  const ry = (p.rotationY || 0) * DEG;
  const rz = (p.rotationZ || 0) * DEG;

  const items = [];
  for (let i = 0; i < n; i++) {
    const a = base + i * step;
    const pos = rotateXYZ(Math.sin(a) * R, 0, Math.cos(a) * R, rx, ry, rz);
    const denom = Math.max(1, camDist - pos.z);
    const proj = foc / denom;
    const depth = clamp((pos.z + R) / (2 * R), 0, 1);

    // Petal facing: cards fan radially (rotate by their ring angle), rotated by
    // the group; the rotated normal's z gives the edge-on foreshorten.
    const nrm = rotateXYZ(Math.sin(a), 0, Math.cos(a), rx, ry, rz);
    const widthFactor = Math.max(0.03, Math.abs(nrm.z));
    const mirror = nrm.z < 0 ? -1 : 1;

    items.push({
      x: cx + pos.x * proj,
      y: cy + pos.y * proj,
      proj,
      depth,
      widthFactor,
      mirror,
      spin: a * fan + rz, // radial splay + group Z spin
      z: pos.z,
      idx: i,
    });
  }
  items.sort((a, b) => a.z - b.z);

  for (const it of items) {
    const s = it.proj; // perspective-driven size: near petals big, far small
    const cw = cardW * s;
    const ch = cardH * s;
    if (cw < 1) continue;
    ctx.save();
    ctx.globalAlpha = clamp(0.35 + it.depth * 0.65, 0, 1);
    ctx.translate(it.x, it.y);
    ctx.rotate(it.spin);
    ctx.scale(it.widthFactor * it.mirror, 1);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.045 * s,
      shadowColor: withAlpha('#000000', 0.5 * it.depth),
      shadowY: min * 0.015,
      shine: false,
    });
    ctx.restore();
  }
}
