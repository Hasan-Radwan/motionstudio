import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'haloGlobe',
  name: 'Halo Globe',
  category: 'Orbit',
  media: { default: 10, min: 1, max: 16 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 16, step: 1, default: 11 },
  { key: 'size', type: 'range', label: 'Card size', min: 9, max: 26, step: 1, default: 16, unit: '%' },
  { key: 'radius', type: 'range', label: 'Globe size', min: 24, max: 46, step: 1, default: 37, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Axis tilt', min: 0, max: 45, step: 1, default: 22, unit: '°' },
];

const GOLDEN = Math.PI * (3 - Math.sqrt(5));

// A tilted sphere of cards (Fibonacci spread) spinning a full turn per loop. The
// axis tilt gives it an orbiting-planet feel; depth drives size and brightness.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.3;
  const cx = w / 2;
  const cy = h / 2;
  const R = (min * p.radius) / 100;
  const baseW = (w * p.size) / 100;
  const ang = t * TAU;
  const ca = Math.cos(ang);
  const sa = Math.sin(ang);
  const tilt = (p.tilt * Math.PI) / 180;
  const ct = Math.cos(tilt);
  const st = Math.sin(tilt);
  const n = p.count;

  const items = [];
  for (let i = 0; i < n; i++) {
    const y = n === 1 ? 0 : 1 - (i / (n - 1)) * 2;
    const rr = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = i * GOLDEN;
    const px = Math.cos(theta) * rr;
    const pz = Math.sin(theta) * rr;
    // spin around the vertical axis
    let rx = px * ca - pz * sa;
    let rz = px * sa + pz * ca;
    let ry = y;
    // then tilt the whole globe forward around the horizontal axis
    const ty = ry * ct - rz * st;
    const tz = ry * st + rz * ct;
    items.push({
      x: cx + rx * R,
      y: cy + ty * R,
      depth: (tz + 1) / 2,
      idx: i,
    });
  }
  items.sort((a, b) => a.depth - b.depth);

  for (const it of items) {
    const s = 0.5 + it.depth * 0.7;
    const cw = baseW * s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.32 + it.depth * 0.68;
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cornerR(50, cw, ch) * 0.2,
      shadowBlur: min * 0.025 * s,
      shadowColor: withAlpha('#000000', 0.4 * it.depth),
      shadowY: min * 0.012,
      shine: false,
    });
    ctx.restore();
  }
}
