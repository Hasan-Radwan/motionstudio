import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

const DEG = Math.PI / 180;
const wrapPi = (x) => {
  const t = TAU;
  return ((((x + Math.PI) % t) + t) % t) - Math.PI;
};

export const meta = {
  id: 'rotundaCarousel01',
  name: 'Rotunda Carousel 01',
  category: 'Carousel & Flow',
  media: { default: 8, min: 1, max: 16 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Panels', min: 4, max: 20, step: 1, default: 12 },
  { key: 'height', type: 'range', label: 'Wall height', min: 20, max: 90, step: 1, default: 58, unit: '%' },
  { key: 'curve', type: 'range', label: 'Curve', min: 0, max: 100, step: 1, default: 55, unit: '%' },
  { key: 'fov', type: 'range', label: 'Field of view', min: 40, max: 150, step: 1, default: 108, unit: '°' },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 3, step: 1, default: 1 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'rtl',
    options: [
      { value: 'rtl', label: 'Right to left' },
      { value: 'ltr', label: 'Left to right' },
    ],
  },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 6, step: 0.5, default: 1, unit: '%' },
  { key: 'graze', type: 'range', label: 'Edge shade', min: 0, max: 100, step: 1, default: 45, unit: '%' },
  { key: 'rounded', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 8, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

// A rotunda: pictures hung on a cylinder wall, seen from INSIDE — you stand at
// the centre and the wall in front of you curves. Ported from the WebGL Rotunda
// Carousel, the pointer drag replaced by a steady auto-spin (default right→left).
// The panels TILE the visible arc edge-to-edge (each spans from its own arc edge
// to the next), foreshorten via a perspective tangent, and shrink in height
// toward the rim — so the row reads as one concave curved band, not separate
// cards. Seamless because `turns` is an integer number of revolutions.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = count;
  if (n < 1) return;
  const min = Math.min(w, h);
  const dir = p.direction === 'rtl' ? -1 : 1; // rtl default → panels drift right→left
  const yaw = t * TAU * Math.max(1, Math.round(p.turns)) * dir;
  const viewHalf = (Math.min(150, Math.max(40, p.fov)) / 2) * DEG;
  const tanHalf = Math.tan(viewHalf) || 1;
  const offX = (w * (p.posX || 0)) / 100;
  const offY = (h * (p.posY || 0)) / 100;
  const cx = w / 2 + offX;
  const cy = h / 2 + offY;
  const wallH = h * (p.height / 100);
  const curve = p.curve / 100; // how much shorter the rim panels get (concavity)
  const graze = p.graze / 100;
  const gap = min * (p.gap / 100);
  const coverage = 1.06; // FOV edges map just past the frame edges
  const step = TAU / n;
  const clampV = (x) => Math.max(-viewHalf, Math.min(viewHalf, x));
  const mapX = (phi) => cx + (Math.tan(clampV(phi)) / tanHalf) * (w * 0.5 * coverage);

  const items = [];
  for (let i = 0; i < n; i++) {
    const c = wrapPi(i * step + yaw);
    if (Math.abs(c) - step / 2 >= viewHalf) continue; // fully out of the view arc
    const xL = mapX(c - step / 2);
    const xR = mapX(c + step / 2);
    if (xR - xL <= 0.5) continue;
    const face = Math.cos(clampV(c)); // 1 dead-centre → smaller toward the rim
    const outer = viewHalf + step / 2; // centre angle at which the panel fully exits
    const alpha = Math.max(0, Math.min(1, (outer - Math.abs(c)) / (step * 0.85)));
    items.push({ c, xL, xR, face, alpha, idx: i });
  }
  items.sort((a, b) => a.c - b.c); // left → right; a convex wall has no occlusion

  for (const it of items) {
    if (it.alpha <= 0.01) continue;
    const bw = it.xR - it.xL - gap;
    if (bw <= 0.5) continue;
    // Concave arc: panels shrink toward the frame edges as a parabola of their
    // screen-x distance from the centre, so the band bows like the inside wall.
    const nx = Math.min(1, Math.abs((it.xL + it.xR) / 2 - cx) / (w * 0.5));
    const ch = wallH * (1 - curve * nx * nx);
    const bx = it.xL + gap / 2;
    const by = cy - ch / 2;
    const r = cornerR(p.rounded, bw, ch);
    ctx.save();
    ctx.globalAlpha = it.alpha;
    roundedRectPath(ctx, bx, by, bw, ch, r);
    ctx.clip();
    const im = imageAt(it.idx);
    if (im && im.width) drawImageCover(ctx, im, bx, by, bw, ch);
    else {
      ctx.fillStyle = `hsl(${(it.idx * 40 + 210) % 360}, 32%, 44%)`;
      ctx.fillRect(bx, by, bw, ch);
    }
    const shade = graze + (1 - graze) * it.face;
    if (shade < 1) {
      ctx.fillStyle = `rgba(0,0,0,${(1 - shade).toFixed(3)})`; // grazing dim
      ctx.fillRect(bx, by, bw, ch);
    }
    ctx.restore();
  }
}
