import { roundedRectPath } from '../engine/canvasUtils.js';

// Default palette (earthy Pantone-style set from the reference). Editable.
const PALETTE = [
  '#C9B79C', // warm sand
  '#6B7A3F', // mangrove leaf
  '#EFE9DD', // ivory
  '#1E2A44', // navy
  '#24422E', // pine green
  '#B99B72', // tan
  '#8199AE',
  '#D4AF83',
  '#3B2A1E',
];

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const easeOutBack = (x) => {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
};
const lerp = (a, b, u) => a + (b - a) * u;
// deterministic 0..1 from (index, salt)
const rnd = (i, s) => {
  const x = Math.sin((i + 1) * 12.9898 + s * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

export const meta = {
  id: 'colorPalette04',
  name: 'Color Palette 04',
  category: 'Colors',
  pro: true, // Pro template: previewable/editable, gated at export
  aspect: '9:16',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Colors', min: 3, max: 9, step: 1, default: 6 },
  { key: 'size', type: 'range', label: 'Card size', min: 26, max: 60, step: 1, default: 42, unit: '%' },
  { key: 'spacing', type: 'range', label: 'Spacing', min: 40, max: 160, step: 1, default: 100, unit: '%' },
  { key: 'labelH', type: 'range', label: 'Label height', min: 12, max: 40, step: 1, default: 24, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 30, step: 1, default: 6, unit: '%' },
  { key: 'spread', type: 'range', label: 'Scatter', min: 0, max: 100, step: 1, default: 55, unit: '%' },
  { key: 'rotate', type: 'range', label: 'Rotation', min: 0, max: 100, step: 1, default: 40, unit: '%' },
  { key: 'codeSize', type: 'range', label: 'Code size', min: 6, max: 22, step: 1, default: 12, unit: '%' },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 100, step: 1, default: 75, unit: '%' },
  { key: 'backdrop', type: 'toggle', label: 'Backdrop', default: true },
  ...PALETTE.map((c, i) => ({
    key: `c${i + 1}`,
    type: 'color',
    label: `Color ${String(i + 1).padStart(2, '0')}`,
    default: c,
  })),
];

// A scattered pile of Pantone-style colour chips — each a swatch with a white
// label strip showing ONLY its hex code (nothing else), overlapping at slight
// angles. The chips DEAL IN one by one (staggered) — flying up + scaling with an
// overshoot into their scattered pose — hold, then fade out at the end so the
// loop is seamless. Hex codes update live as the colours are edited.
export function render(ctx, t, p, { w, h }) {
  const n = Math.round(p.count);
  if (p.backdrop) {
    ctx.fillStyle = '#E4E1D8';
    ctx.fillRect(0, 0, w, h);
  }

  const min = Math.min(w, h);
  const cardW = min * (p.size / 100);
  const cardH = cardW * 1.3;
  const r = (Math.min(30, Math.max(0, p.radius)) / 100) * (cardW / 2);
  const labelH = cardH * (p.labelH / 100);
  const codePx = Math.round(cardW * (p.codeSize / 100));
  const jitter = p.spread / 100; // how far each card wanders from its grid cell
  const rotMax = (p.rotate / 100) * 0.5; // radians
  const spacing = (p.spacing ?? 100) / 100; // spreads/tightens the whole grid

  // Distribute the cards across the frame on an aspect-aware grid (with jitter),
  // so they spread out as a loose collage instead of piling up in the centre.
  const cols = Math.max(1, Math.round(Math.sqrt(n * (w / h))));
  const rows = Math.ceil(n / cols);
  const mgn = min * 0.05;
  const cellW = (w - 2 * mgn) / cols;
  const cellH = (h - 2 * mgn) / rows;

  for (let i = 0; i < n; i++) {
    const color = p[`c${i + 1}`] || PALETTE[i % PALETTE.length];
    const row = Math.floor(i / cols);
    const col = i % cols;
    // centre the last row if it isn't full
    const rowCount = row === rows - 1 ? n - row * cols : cols;
    const colOffset = (cols - rowCount) / 2;
    // cell centre, spread/tightened around the frame centre by `spacing`
    const cellX = mgn + (col + colOffset + 0.5) * cellW;
    const cellY = mgn + (row + 0.5) * cellH;
    const fx = w / 2 + (cellX - w / 2) * spacing + (rnd(i, 1) - 0.5) * cellW * jitter;
    const fy = h / 2 + (cellY - h / 2) * spacing + (rnd(i, 2) - 0.5) * cellH * jitter;
    const fang = (rnd(i, 3) - 0.5) * rotMax;

    // staggered deal-in entrance, synchronized fade-out at the end
    const d = n > 1 ? (i / (n - 1)) * (p.stagger / 100) * 0.42 : 0;
    const enterA = smooth(clamp01((t - d) / 0.3));
    const exitA = smooth(clamp01((t - 0.82) / 0.18));
    const alpha = enterA * (1 - exitA);
    if (alpha <= 0.001) continue;

    const e = easeOutBack(enterA);
    const startX = fx + (rnd(i, 4) - 0.5) * w * 0.12;
    const startY = fy + h * 0.28; // fly up from below
    const x = lerp(startX, fx, e);
    const y = lerp(startY, fy, e);
    const ang = lerp(fang + (rnd(i, 5) - 0.5) * 0.6, fang, e);
    const scale = lerp(0.72, 1, e);

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(x, y);
    ctx.rotate(ang);
    ctx.scale(scale, scale);

    const cw = cardW;
    const ch = cardH;
    // soft drop shadow so the pile reads as layered paper
    ctx.shadowColor = 'rgba(0,0,0,0.22)';
    ctx.shadowBlur = min * 0.03;
    ctx.shadowOffsetY = min * 0.012;
    roundedRectPath(ctx, -cw / 2, -ch / 2, cw, ch, r);
    ctx.fillStyle = '#ffffff'; // paper base (shows as the label strip)
    ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // swatch colour fills everything above the label strip
    ctx.save();
    roundedRectPath(ctx, -cw / 2, -ch / 2, cw, ch, r);
    ctx.clip();
    ctx.fillStyle = color;
    ctx.fillRect(-cw / 2, -ch / 2, cw, ch - labelH);
    ctx.restore();

    // hex code — the only text — in the white label strip
    ctx.fillStyle = 'rgba(24,26,30,0.9)';
    ctx.font = `700 ${codePx}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(color).toUpperCase(), -cw / 2 + cw * 0.09, ch / 2 - labelH / 2);
    ctx.restore();
  }
}
