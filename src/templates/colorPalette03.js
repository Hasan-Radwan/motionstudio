import { roundedRectPath } from '../engine/canvasUtils.js';

// Default Mediterranean palette (matches the reference). Editable per swatch.
const PALETTE = [
  '#C05A34', // Terra Cotta
  '#DECBA0', // Sand
  '#6E7A3F', // Olive
  '#D79A2B', // Ochre
  '#C0682F', // Clay
  '#2C6B78', // Sea
  '#8B3A2E',
  '#4A5D3A',
  '#E3C56B',
];

const smooth = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

export const meta = {
  id: 'colorPalette03',
  name: 'Color Palette 03',
  category: 'Colors',
  pro: true, // Pro template: previewable/editable, gated at export
  aspect: '9:16',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Colors', min: 3, max: 9, step: 1, default: 6 },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 8, step: 0.5, default: 2, unit: '%' },
  { key: 'radius', type: 'range', label: 'Roundness', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'marginX', type: 'range', label: 'Side margin', min: 4, max: 30, step: 1, default: 12, unit: '%' },
  { key: 'marginY', type: 'range', label: 'Top / bottom margin', min: 6, max: 34, step: 1, default: 22, unit: '%' },
  { key: 'codeSize', type: 'range', label: 'Code size', min: 6, max: 26, step: 1, default: 13, unit: '%' },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 100, step: 1, default: 70, unit: '%' },
  { key: 'backdrop', type: 'toggle', label: 'Backdrop', default: true },
  { key: 'backdropColor', type: 'color', label: 'Backdrop color', default: '#F3EFE6' },
  { key: 'codeColor', type: 'color', label: 'Code color', default: '#3A3A3A' },
  ...PALETTE.map((c, i) => ({
    key: `c${i + 1}`,
    type: 'color',
    label: `Color ${String(i + 1).padStart(2, '0')}`,
    default: c,
  })),
];

// A row of tall vertical capsule swatches, each with its hex code below it — and
// nothing else. The bars GROW UP from the baseline with a staggered dynamic
// entrance, hold, then retract at the end so the loop is seamless. An optional
// flat backdrop gives the clean poster look (turn it off to sit over your own
// uploaded background). The hex code updates live as each colour is edited.
export function render(ctx, t, p, { w, h }) {
  const n = Math.round(p.count);
  if (p.backdrop) {
    ctx.fillStyle = p.backdropColor || '#F3EFE6';
    ctx.fillRect(0, 0, w, h);
  }

  const mx = w * (p.marginX / 100);
  const my = h * (p.marginY / 100);
  const gap = Math.min(w, h) * (p.gap / 100);
  const areaW = w - 2 * mx;
  const barW = (areaW - (n - 1) * gap) / n;
  if (barW <= 1) return;

  const codePx = Math.round(barW * (p.codeSize / 100));
  const codeArea = codePx * 2.4; // room for the code beneath the bars
  const barTopY = my;
  const barBaseY = h - my - codeArea; // bars grow up from here
  const barFullH = barBaseY - barTopY;
  if (barFullH <= 1) return;
  const roundFrac = Math.min(100, Math.max(0, p.radius)) / 100;

  for (let i = 0; i < n; i++) {
    const color = p[`c${i + 1}`] || PALETTE[i % PALETTE.length];
    const x = mx + i * (barW + gap);

    // staggered grow-up entrance, synchronized retract at the end → seamless
    const d = n > 1 ? (i / (n - 1)) * (p.stagger / 100) * 0.4 : 0;
    let a;
    if (t < d) a = 0;
    else if (t < d + 0.28) a = smooth((t - d) / 0.28);
    else if (t < 0.8) a = 1;
    else a = 1 - smooth((t - 0.8) / 0.2);
    if (a <= 0.001) continue;

    const barH = barFullH * a;
    const barY = barBaseY - barH;
    const r = roundFrac * Math.min(barW / 2, barH / 2);

    ctx.save();
    roundedRectPath(ctx, x, barY, barW, barH, r);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();

    // hex code centred below the bar (fades in with the bar)
    ctx.save();
    ctx.globalAlpha = a;
    ctx.fillStyle = p.codeColor || '#3A3A3A';
    ctx.font = `600 ${codePx}px Inter, system-ui, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(color).toUpperCase(), x + barW / 2, barBaseY + codeArea * 0.5);
    ctx.restore();
  }
}
