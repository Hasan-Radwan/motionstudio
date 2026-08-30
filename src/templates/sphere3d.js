import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';
import { rotateXYZ } from '../engine/threed.js';

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const hash = (i) => {
  const s = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return s - Math.floor(s);
};

export const meta = {
  id: 'sphere3d',
  name: 'Sphere 3D',
  category: 'Orbit',
  media: { default: 12, min: 1, max: 40 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Nodes', min: 6, max: 40, step: 1, default: 30 },
  { key: 'radius', type: 'range', label: 'Sphere size', min: 20, max: 120, step: 1, default: 42, unit: '%' },
  { key: 'size', type: 'range', label: 'Node size', min: 8, max: 40, step: 1, default: 18, unit: '%' },
  { key: 'perspective', type: 'range', label: 'Perspective', min: 1.2, max: 6, step: 0.1, default: 2.6 },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 4, step: 1, default: 1 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'ccw',
    options: [
      { value: 'cw', label: 'Clockwise' },
      { value: 'ccw', label: 'Counter-clockwise' },
    ],
  },
  { key: 'tilt', type: 'range', label: 'Tilt (X)', min: 0, max: 60, step: 1, default: 22, unit: '°' },
  { key: 'scatter', type: 'range', label: 'Scatter', min: 0, max: 100, step: 1, default: 0, unit: '%' },
  { key: 'rounded', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 14, unit: '%' },
  { key: 'minScale', type: 'range', label: 'Back scale', min: 30, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'backOpacity', type: 'range', label: 'Back fade', min: 0, max: 100, step: 1, default: 35, unit: '%' },
  { key: 'coreSize', type: 'range', label: 'Core glow', min: 0, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'coreColor', type: 'color', label: 'Core color', default: '#7AB8FF' },
  // Wireframe strings from the core to each node.
  { key: 'showLines', type: 'toggle', label: 'Show lines', default: true },
  { key: 'lineColor', type: 'color', label: 'Line color', default: '#FFFFFF' },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

// A spherical gallery: media nodes spread on a Fibonacci sphere shell that spins
// automatically (no cursor). Nodes are billboarded image cards, projected with
// perspective, depth-sorted and depth-dimmed. The core→node wireframe strings are
// hidden by default (toggle them on). Seamless because `turns` is an integer
// number of full revolutions per loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const dir = p.direction === 'cw' ? -1 : 1;
  const cx = w / 2 + (w * (p.posX || 0)) / 100;
  const cy = h / 2 + (h * (p.posY || 0)) / 100;
  const R = (min * p.radius) / 100;
  const foc = R * p.perspective;
  const camDist = foc + R;
  const cardW = (min * p.size) / 100;
  const ref = imageAt(0);
  const imgR = ref && ref.width ? ref.width / ref.height : 1;
  const cardH = cardW / imgR;
  const minS = p.minScale / 100;
  const backA = (p.backOpacity ?? 35) / 100;
  // Tilt sways automatically with a seamless pseudo-random wander (a blend of
  // harmonics that repeats every loop). The control sets the sway amplitude.
  const tiltAmp = (p.tilt || 0) * DEG;
  const tiltNoise = 0.6 * Math.sin(t * TAU) + 0.3 * Math.sin(t * TAU * 2 + 1.3) + 0.1 * Math.sin(t * TAU * 3 + 2.5);
  const tilt = tiltAmp * tiltNoise;
  const yaw = t * TAU * Math.max(1, Math.round(p.turns)) * dir;
  const coreR = (min * (p.coreSize || 0)) / 100;
  const showLines = !!p.showLines;

  const items = [];
  for (let i = 0; i < n; i++) {
    const y = 1 - (2 * (i + 0.5)) / n;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const th = GOLDEN * i;
    const jitter = 1 + (hash(i) - 0.5) * (p.scatter / 100);
    const Rr = R * jitter;
    const P = rotateXYZ(Math.cos(th) * rr * Rr, y * Rr, Math.sin(th) * rr * Rr, tilt, yaw, 0);
    const proj = foc / Math.max(1, camDist - P.z);
    const depth = clamp((P.z + R) / (2 * R), 0, 1);
    const sizeScale = minS + depth * (1 - minS);
    const alpha = backA + depth * (1 - backA);
    items.push({ x: cx + P.x * proj, y: cy + P.y * proj, z: P.z, sizeScale, alpha, depth, idx: i });
  }
  items.sort((a, b) => a.z - b.z);

  // where the sorted run crosses the core (z = 0)
  let split = 0;
  while (split < n && items[split].z < 0) split++;

  const drawNode = (it) => {
    const cw = cardW * it.sizeScale;
    const ch = cardH * it.sizeScale;
    if (cw < 0.5 || it.alpha <= 0.01) return;
    if (showLines) {
      ctx.save();
      ctx.globalAlpha = it.alpha * 0.8;
      ctx.strokeStyle = withAlpha(p.lineColor || '#4A6A99', 1);
      ctx.lineWidth = Math.max(0.5, min * 0.0015);
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(it.x, it.y);
      ctx.stroke();
      ctx.restore();
    }
    ctx.save();
    ctx.globalAlpha = clamp(it.alpha, 0, 1);
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cornerR(p.rounded, cw, ch),
      shadowBlur: min * 0.04 * it.sizeScale,
      shadowColor: withAlpha('#000000', 0.5 * it.depth),
      shadowY: min * 0.015,
      shine: false,
    });
    ctx.restore();
  };

  const drawCore = () => {
    if (coreR <= 0.5) return;
    ctx.save();
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, coreR);
    g.addColorStop(0, withAlpha(p.coreColor || '#7AB8FF', 0.9));
    g.addColorStop(0.6, withAlpha(p.coreColor || '#7AB8FF', 0.4));
    g.addColorStop(1, withAlpha(p.coreColor || '#7AB8FF', 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, coreR, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  for (let o = 0; o < split; o++) drawNode(items[o]); // back half
  drawCore();
  for (let o = split; o < n; o++) drawNode(items[o]); // front half
}
