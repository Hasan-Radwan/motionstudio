import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';
import { rotateXYZ } from '../engine/threed.js';

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

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
  // Global 3D rotation of the WHOLE ring (all cards rotate together).
  { key: 'rotationX', type: 'range', label: 'Rotation X', min: -180, max: 180, step: 1, default: 16, unit: '°' },
  { key: 'rotationY', type: 'range', label: 'Rotation Y', min: -180, max: 180, step: 1, default: 0, unit: '°' },
  { key: 'rotationZ', type: 'range', label: 'Rotation Z', min: -180, max: 180, step: 1, default: 0, unit: '°' },
  { key: 'minScale', type: 'range', label: 'Back scale', min: 30, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'backOpacity', type: 'range', label: 'Back fade', min: 0, max: 100, step: 1, default: 35, unit: '%' },
  { key: 'faceTurn', type: 'range', label: 'Face turn', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 8, unit: '%' },
  { key: 'offsetX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'offsetY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

// A premium editorial 3D card carousel — one shared virtual ring, spun around the
// vertical axis by a single advancing angle (no per-card keyframes). On top of the
// spin, Rotation X/Y/Z rotate the WHOLE ring rigidly in 3D: every card's world
// position is Euler-rotated and pinhole-projected, so the group tips and turns
// together. Depth drives scale / opacity / paint order; each card's rotated facing
// normal drives a horizontal foreshorten so the ring reads as a real cylinder.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const dir = p.direction === 'ccw' ? -1 : 1;
  const cx = w / 2 + (w * (p.offsetX || 0)) / 100;
  const cy = h / 2 + (h * (p.offsetY || 0)) / 100;
  const R = (w * p.radius) / 100;
  const foc = R * p.perspective; // focal length
  const camDist = foc + R; // camera sits just beyond the nearest card
  const cardW = (w * p.size) / 100;
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 0.72;
  const cardH = cardW / imgR;
  const step = TAU / n;
  const base = t * TAU * p.turns * dir;
  const minS = p.minScale / 100;
  const backA = (p.backOpacity ?? 35) / 100;
  const faceTurn = (p.faceTurn ?? 100) / 100;
  const rx = (p.rotationX || 0) * DEG;
  const ry = (p.rotationY || 0) * DEG;
  const rz = (p.rotationZ || 0) * DEG;

  const items = [];
  for (let i = 0; i < n; i++) {
    const a = base + i * step;
    // ring position, then rigid Euler rotation of the whole group
    const pos = rotateXYZ(Math.sin(a) * R, 0, Math.cos(a) * R, rx, ry, rz);
    const denom = Math.max(1, camDist - pos.z);
    const proj = foc / denom;
    const depth = clamp((pos.z + R) / (2 * R), 0, 1); // 0 far .. 1 near
    const scale = minS + depth * (1 - minS);
    const alpha = backA + depth * (1 - backA);

    // Facing normal: blend between cylinder-tangent (faceTurn=1) and camera-facing
    // (faceTurn=0), then rotate it with the group. Its z tells us how edge-on the
    // card is → horizontal foreshorten + mirror the far side.
    let nx = Math.sin(a) * faceTurn;
    let nz = Math.cos(a) * faceTurn + (1 - faceTurn);
    const nl = Math.hypot(nx, nz) || 1;
    const nrm = rotateXYZ(nx / nl, 0, nz / nl, rx, ry, rz);
    const facing = nrm.z;
    const widthFactor = Math.max(0.03, Math.abs(facing));
    const mirror = facing < 0 ? -1 : 1;

    items.push({
      x: cx + pos.x * proj,
      y: cy + pos.y * proj,
      scale,
      alpha,
      widthFactor,
      mirror,
      depth,
      z: pos.z,
      idx: i,
    });
  }
  items.sort((a, b) => a.z - b.z); // far first, near painted on top

  for (const it of items) {
    const cw = cardW * it.scale;
    const ch = cardH * it.scale;
    if (cw < 1 || it.alpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, it.alpha));
    ctx.translate(it.x, it.y);
    ctx.rotate(rz); // rigid screen-plane rotation so Rotation Z spins the board
    ctx.scale(it.widthFactor * it.mirror, 1);
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
