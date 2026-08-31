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
  { key: 'count', type: 'range', label: 'Panels', min: 4, max: 16, step: 1, default: 8 },
  { key: 'size', type: 'range', label: 'Panel size', min: 14, max: 50, step: 1, default: 30, unit: '%' },
  { key: 'fov', type: 'range', label: 'Field of view', min: 40, max: 150, step: 1, default: 124, unit: '°' },
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
  { key: 'graze', type: 'range', label: 'Edge shade', min: 0, max: 100, step: 1, default: 42, unit: '%' },
  { key: 'rounded', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 6, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

// A rotunda: a ring of pictures hung on a cylinder wall, seen from INSIDE, that
// turns automatically so the panels sweep past the viewer. Ported from the WebGL
// Rotunda Carousel — the pointer drag is replaced by a steady auto-spin (default
// right → left). Canvas2D approximation: each panel is placed by its ring angle
// with a perspective-tangent screen position, foreshortened + shaded toward the
// grazing edges. Seamless because `turns` is an integer number of revolutions.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = count;
  if (n < 1) return;
  const min = Math.min(w, h);
  const dir = p.direction === 'ltr' ? -1 : 1; // rtl default → panels drift right→left
  const yaw = t * TAU * Math.max(1, Math.round(p.turns)) * dir;
  const viewHalf = (Math.min(150, Math.max(40, p.fov)) / 2) * DEG;
  const tanHalf = Math.tan(viewHalf) || 1;
  const offX = (w * (p.posX || 0)) / 100;
  const offY = (h * (p.posY || 0)) / 100;
  const cx = w / 2 + offX;
  const cy = h / 2 + offY;
  const ref = imageAt(0);
  const imgR = ref && ref.width ? ref.width / ref.height : 1.4;
  const cardW = min * (p.size / 100);
  const cardH = cardW / imgR;
  const graze = (p.graze / 100);
  const coverage = 1.14; // how far the FOV edges map past the frame edges
  const step = TAU / n;

  const items = [];
  for (let i = 0; i < n; i++) {
    const phi = wrapPi(i * step + yaw);
    if (Math.abs(phi) >= viewHalf) continue; // behind the camera / out of view
    const face = Math.cos(phi); // 1 dead-centre → smaller toward the edges
    const x = cx + (Math.tan(phi) / tanHalf) * (w * 0.5 * coverage);
    const edge = (viewHalf - Math.abs(phi)) / viewHalf; // 1 centre → 0 at the rim
    const alpha = Math.min(1, edge / 0.12); // fade in/out at the FOV edges
    const shade = graze + (1 - graze) * face;
    items.push({ x, face, alpha, shade, idx: i });
  }
  // no depth sort needed (convex wall, no self-occlusion); paint edges first so
  // the centred panel reads on top where they'd graze.
  items.sort((a, b) => a.face - b.face);

  for (const it of items) {
    if (it.alpha <= 0.01) continue;
    const cw = cardW * (0.4 + 0.6 * it.face); // horizontal foreshorten
    const ch = cardH * (0.86 + 0.14 * it.face);
    const bx = it.x - cw / 2;
    const by = cy - ch / 2;
    const r = cornerR(p.rounded, cw, ch);
    ctx.save();
    ctx.globalAlpha = it.alpha;
    roundedRectPath(ctx, bx, by, cw, ch, r);
    ctx.clip();
    const im = imageAt(it.idx);
    if (im && im.width) drawImageCover(ctx, im, bx, by, cw, ch);
    else {
      ctx.fillStyle = `hsl(${(it.idx * 40 + 210) % 360}, 30%, 42%)`;
      ctx.fillRect(bx, by, cw, ch);
    }
    if (it.shade < 1) {
      ctx.fillStyle = `rgba(0,0,0,${(1 - it.shade).toFixed(3)})`; // grazing dim
      ctx.fillRect(bx, by, cw, ch);
    }
    ctx.restore();
  }
}
