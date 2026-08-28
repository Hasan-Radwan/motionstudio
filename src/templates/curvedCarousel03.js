import { drawCard, cornerR, withAlpha, drawImageContain } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';
import { rotateXYZ } from '../engine/threed.js';

const DEG = Math.PI / 180;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export const meta = {
  id: 'curvedCarousel03',
  name: 'Curved Carousel 03',
  category: 'Carousel & Flow',
  pro: true,
  aspect: '4:5',
  media: { default: 8, min: 1, max: 16 },
};

export const controls = [
  { key: 'radius', type: 'range', label: 'Ring size', min: 20, max: 200, step: 1, default: 42, unit: '%' },
  { key: 'size', type: 'range', label: 'Card size', min: 12, max: 40, step: 1, default: 22, unit: '%' },
  { key: 'perspective', type: 'range', label: 'Perspective', min: 1.2, max: 6, step: 0.1, default: 2.6 },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 3, step: 1, default: 1 },
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
  { key: 'rotationX', type: 'range', label: 'Rotation X', min: -180, max: 180, step: 1, default: -18, unit: '°' },
  { key: 'rotationY', type: 'range', label: 'Rotation Y', min: -180, max: 180, step: 1, default: 0, unit: '°' },
  { key: 'rotationZ', type: 'range', label: 'Rotation Z', min: -180, max: 180, step: 1, default: 0, unit: '°' },
  { key: 'minScale', type: 'range', label: 'Back scale', min: 30, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'backOpacity', type: 'range', label: 'Back fade', min: 0, max: 100, step: 1, default: 35, unit: '%' },
  { key: 'faceTurn', type: 'range', label: 'Face turn', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 14, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -50, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -50, max: 50, step: 1, default: 10, unit: '%' },
  // Foreground subject (static PNG cut-out, first image) pinned at the ring centre
  // so the cards orbit around it.
  { key: 'fgSize', type: 'range', label: 'Foreground size', min: 30, max: 100, step: 1, default: 50, unit: '%' },
  { key: 'fgX', type: 'range', label: 'Foreground X', min: 0, max: 100, step: 1, default: 51, unit: '%' },
  { key: 'fgY', type: 'range', label: 'Foreground Y', min: 40, max: 100, step: 1, default: 96, unit: '%' },
];

// A circular 3D card ring (same virtual cylinder as Carousel 3D 01) that spins
// around a pinned foreground subject (PNG cut-out): the cards orbit behind the
// person. Depth drives size / opacity / paint order; the foreground is drawn last.
// Seamless because `turns` is an integer number of full revolutions per loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);

  const fgSlot = p.fg == null ? 1 : p.fg;
  const fgIndex = fgSlot > 0 ? (fgSlot - 1) % count : -1;
  const posters = [];
  for (let i = 0; i < count; i++) if (i !== fgIndex) posters.push(i);
  const n = posters.length;

  if (n > 0) {
    const dir = p.direction === 'ccw' ? -1 : 1;
    const cx = w / 2 + (w * (p.posX || 0)) / 100;
    const cy = h / 2 + (h * (p.posY || 0)) / 100;
    const R = (w * p.radius) / 100;
    const foc = R * p.perspective;
    const camDist = foc + R;
    const cardW = (w * p.size) / 100;
    const ref = imageAt(posters[0]);
    const imgR = ref && ref.width ? ref.width / ref.height : 0.72;
    const cardH = cardW / imgR;
    const step = TAU / n;
    const base = t * TAU * Math.round(p.turns) * dir;
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
      const wx = (1 - faceTurn) + ca * faceTurn;
      const wz = -sa * faceTurn;
      const wl = Math.hypot(wx, 0, wz) || 1;
      const P = rotateXYZ(sa * R, 0, ca * R, rx, ry, rz);
      const S = rotateXYZ(0, 1, 0, rx, ry, rz);
      const W = rotateXYZ(wx / wl, 0, wz / wl, rx, ry, rz);
      const proj = foc / Math.max(1, camDist - P.z);
      const depth = clamp((P.z + R) / (2 * R), 0, 1);
      const sizeScale = minS + depth * (1 - minS);
      const alpha = backA + depth * (1 - backA);
      items.push({ x: cx + P.x * proj, y: cy + P.y * proj, S, W, sizeScale, alpha, depth, z: P.z, idx: posters[i] });
    }
    items.sort((a, b) => a.z - b.z);

    const drawRingCard = (it) => {
      const cw = cardW * it.sizeScale;
      const ch = cardH * it.sizeScale;
      if (cw < 0.5 || it.alpha <= 0.01) return;
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
    };

    // The subject sits at the RING CENTRE (z = 0): draw the back-half cards
    // (z ≤ 0) BEHIND it, then the subject, then the front-half cards (z > 0) OVER
    // it — so the ring orbits AROUND the subject, passing both behind and in front.
    for (const it of items) if (it.z <= 0) drawRingCard(it);
    drawSubject();
    for (const it of items) if (it.z > 0) drawRingCard(it);
  } else {
    drawSubject();
  }

  // The pinned foreground subject (PNG cut-out) drawn at the ring centre.
  function drawSubject() {
    if (fgIndex < 0) return;
    const fg = imageAt(fgIndex);
    if (!fg || !fg.width) return;
    const fw = (w * p.fgSize) / 100;
    const fh = fw / (fg.width / fg.height);
    const cxFg = w * ((p.fgX ?? 50) / 100);
    const bottom = h * (p.fgY / 100);
    drawImageContain(ctx, fg, cxFg - fw / 2, bottom - fh, fw, fh);
  }
}
