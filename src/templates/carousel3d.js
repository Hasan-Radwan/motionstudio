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
  { key: 'radius', type: 'range', label: 'Ring size', min: 20, max: 200, step: 1, default: 34, unit: '%' },
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
  // Global 3D rotation of the WHOLE ring (all cards move together as one block).
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
// vertical axis by a single advancing angle. Rotation X/Y/Z rotate the WHOLE ring
// rigidly: each card is drawn as a projected parallelogram from its Euler-rotated
// 3D frame (upright spine + a width axis that Face-turn morphs between camera-
// facing and cylinder-tangent), so the group tips and turns as one block. Depth
// drives size / opacity / paint order.
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
    const sa = Math.sin(a);
    const ca = Math.cos(a);
    // width axis morphs camera-facing (1,0,0) ↔ cylinder-tangent (ca,0,-sa) via
    // Face turn; spine stays upright. Both Euler-rotated with the whole group.
    let wx = (1 - faceTurn) + ca * faceTurn;
    let wz = -sa * faceTurn;
    const wl = Math.hypot(wx, 0, wz) || 1;
    const P = rotateXYZ(sa * R, 0, ca * R, rx, ry, rz);
    const S = rotateXYZ(0, 1, 0, rx, ry, rz);
    const W = rotateXYZ(wx / wl, 0, wz / wl, rx, ry, rz);
    const proj = foc / Math.max(1, camDist - P.z);
    const depth = clamp((P.z + R) / (2 * R), 0, 1);
    const sizeScale = minS + depth * (1 - minS);
    const alpha = backA + depth * (1 - backA);
    items.push({ x: cx + P.x * proj, y: cy + P.y * proj, S, W, sizeScale, alpha, depth, z: P.z, idx: i });
  }
  items.sort((a, b) => a.z - b.z);

  for (const it of items) {
    const cw = cardW * it.sizeScale;
    const ch = cardH * it.sizeScale;
    if (cw < 0.5 || it.alpha <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = clamp(it.alpha, 0, 1);
    ctx.transform(it.W.x, it.W.y, it.S.x, it.S.y, it.x, it.y);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.05 * it.sizeScale,
      shadowColor: withAlpha('#000000', 0.5 * it.depth),
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
