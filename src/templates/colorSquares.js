import { roundedRectPath } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

// Default named palette (matches the reference swatch board). Users can recolour
// each swatch; the labels keep these names.
const PALETTE = [
  { name: 'Pure Blue', color: '#4285F4' },
  { name: 'Turquoise', color: '#7ACFC0' },
  { name: 'Green', color: '#2E7D46' },
  { name: 'Yellow', color: '#F2C33D' },
  { name: 'Pink', color: '#E8559A' },
  { name: 'Brown', color: '#6E4B3A' },
  { name: 'Orange', color: '#EB7B5E' },
  { name: 'Purple', color: '#7C5CFF' },
  { name: 'Red', color: '#E24A3B' },
];

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};

export const meta = {
  id: 'colorSquares',
  name: 'Color Squares',
  category: 'Colors',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Colors', min: 3, max: 9, step: 1, default: 9 },
  { key: 'size', type: 'range', label: 'Square size', min: 18, max: 60, step: 1, default: 34, unit: '%' },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 12, step: 0.5, default: 4, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 16, unit: '%' },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 100, step: 1, default: 60, unit: '%' },
  { key: 'spin', type: 'range', label: 'Wobble', min: 0, max: 100, step: 1, default: 30, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  ...PALETTE.map((c, i) => ({
    key: `c${i + 1}`,
    type: 'color',
    label: `Color ${String(i + 1).padStart(2, '0')}`,
    default: c.color,
  })),
];

// A board of colour squares that POP IN with a staggered overshoot (entrance),
// hold with a gentle wobble, then pop out together at the end — so the loop is
// seamless (all squares hidden at t=0 and t=1). A colour showcase, not an image
// template. Arranged in the tightest grid that fits `count`.
export function render(ctx, t, p, { w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const offX = (w * (p.posX || 0)) / 100;
  const offY = (h * (p.posY || 0)) / 100;
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cell = min * (p.size / 100);
  const gap = min * (p.gap / 100);
  const gridW = cols * cell + (cols - 1) * gap;
  const gridH = rows * cell + (rows - 1) * gap;
  const x0 = (w - gridW) / 2 + offX;
  const y0 = (h - gridH) / 2 + offY;
  const spread = (p.stagger / 100) * 0.32; // total entrance stagger span
  const wob = (p.spin / 100) * 0.14; // wobble amount (radians)

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    // last row centred if it isn't full
    const rowCount = row === rows - 1 ? n - row * cols : cols;
    const rowW = rowCount * cell + (rowCount - 1) * gap;
    const rowX0 = (w - rowW) / 2 + offX;
    const cx = rowX0 + col * (cell + gap) + cell / 2;
    const cy = y0 + row * (cell + gap) + cell / 2;

    const d = n > 1 ? (i / (n - 1)) * spread : 0; // per-square entrance delay
    let s; // scale 0..1
    if (t < d) s = 0;
    else if (t < d + 0.22) s = easeOutBack(smooth((t - d) / 0.22));
    else if (t < 0.8) s = 1;
    else s = 1 - smooth((t - 0.8) / 0.2); // synchronized exit → seamless at t=1
    if (s <= 0.001) continue;

    const rot = wob * Math.sin((t + i * 0.13) * TAU); // seamless wobble
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rot);
    ctx.scale(s, s);
    const cw = cell;
    const r = (Math.min(50, Math.max(0, p.radius)) / 100) * (cw / 2);
    roundedRectPath(ctx, -cw / 2, -cw / 2, cw, cw, r);
    ctx.fillStyle = p[`c${i + 1}`] || PALETTE[i % PALETTE.length].color;
    ctx.fill();
    ctx.restore();
  }
}
