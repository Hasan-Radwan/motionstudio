import { roundedRectPath } from '../engine/canvasUtils.js';

// Default palette (matches the earlier reference board). Editable per swatch.
const PALETTE = [
  '#183451', // Riviera Blue
  '#A9501C', // Terracotta
  '#F3ECDE', // Soft Ivory
  '#D4AF83', // Sand Linen
  '#2E4A3B',
  '#C97B4A',
  '#8199AE',
  '#E8D5B5',
  '#3B2A1E',
];

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

// Parse #rgb / #rrggbb → {r,g,b}; used to pick a readable caption colour.
function hexRGB(hex) {
  let h = String(hex || '').replace('#', '');
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h || '000000', 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export const meta = {
  id: 'colorPalette02',
  name: 'Color Palette 02',
  category: 'Colors',
  pro: true, // Pro template: previewable/editable, gated at export
  aspect: '9:16',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Colors', min: 3, max: 9, step: 1, default: 4 },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 8, step: 0.5, default: 2.5, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 14, unit: '%' },
  { key: 'marginX', type: 'range', label: 'Side margin', min: 4, max: 30, step: 1, default: 12, unit: '%' },
  { key: 'marginY', type: 'range', label: 'Top / bottom margin', min: 4, max: 30, step: 1, default: 14, unit: '%' },
  { key: 'codeSize', type: 'range', label: 'Code size', min: 8, max: 30, step: 1, default: 16, unit: '%' },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 100, step: 1, default: 70, unit: '%' },
  ...PALETTE.map((c, i) => ({
    key: `c${i + 1}`,
    type: 'color',
    label: `Color ${String(i + 1).padStart(2, '0')}`,
    default: c,
  })),
];

// A vertical stack of rounded colour cards over a user background image (set from
// the Background panel; a default sample background ships with the template). Each
// card shows ONLY its hex code — which updates live as the colour is edited — and
// nothing else. The cards slide + fade in with a staggered entrance, hold, then
// slide out at the end so the loop is seamless.
export function render(ctx, t, p, { w, h }) {
  const n = Math.round(p.count);
  const mx = w * (p.marginX / 100);
  const my = h * (p.marginY / 100);
  const gap = Math.min(w, h) * (p.gap / 100);
  const areaW = w - 2 * mx;
  const areaH = h - 2 * my;
  const cardH = (areaH - (n - 1) * gap) / n;
  if (cardH <= 1) return;
  const r = (Math.min(40, Math.max(0, p.radius)) / 100) * (Math.min(areaW, cardH) / 2);
  const codePx = Math.round(cardH * (p.codeSize / 100));

  for (let i = 0; i < n; i++) {
    const color = p[`c${i + 1}`] || PALETTE[i % PALETTE.length];
    const y = my + i * (cardH + gap);

    // staggered slide-in from the right, synchronized slide-out at the end
    const d = n > 1 ? (i / (n - 1)) * (p.stagger / 100) * 0.4 : 0;
    let a;
    if (t < d) a = 0;
    else if (t < d + 0.26) a = smooth((t - d) / 0.26);
    else if (t < 0.8) a = 1;
    else a = 1 - smooth((t - 0.8) / 0.2);
    if (a <= 0.001) continue;
    const dx = (1 - a) * w * 0.35;

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(dx, 0);
    roundedRectPath(ctx, mx, y, areaW, cardH, r);
    ctx.fillStyle = color;
    ctx.fill();

    // hex code caption only — readable colour chosen from the swatch luminance
    const { r: cr, g: cg, b: cb } = hexRGB(color);
    const lum = 0.299 * cr + 0.587 * cg + 0.114 * cb;
    ctx.fillStyle = lum > 150 ? 'rgba(20,22,26,0.9)' : 'rgba(255,255,255,0.95)';
    ctx.font = `700 ${codePx}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText(String(color).toUpperCase(), mx + cardH * 0.22, y + cardH - cardH * 0.24);
    ctx.restore();
  }
}
