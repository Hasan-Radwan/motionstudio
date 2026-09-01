import { roundedRectPath } from '../engine/canvasUtils.js';

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
// deterministic 0..1 from an integer (varies card heights per column)
const rand = (n) => {
  let s = Math.sin(n * 127.1 + 3.7) * 43758.5453;
  return s - Math.floor(s);
};
// Parse #rgb / #rrggbb → luminance 0..255 (to pick a readable caption colour).
const lumOf = (hex) => {
  let c = String(hex || '').replace('#', '');
  if (c.length === 3) c = c.split('').map((x) => x + x).join('');
  const num = parseInt(c || '000000', 16);
  return 0.299 * ((num >> 16) & 255) + 0.587 * ((num >> 8) & 255) + 0.114 * (num & 255);
};

export const meta = {
  id: 'colorStack',
  name: 'Color Palette 01',
  category: 'Colors',
  pro: true, // Pro template: previewable/editable, gated at export
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Colors', min: 4, max: 9, step: 1, default: 7 },
  { key: 'cols', type: 'range', label: 'Columns', min: 2, max: 4, step: 1, default: 3 },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 6, step: 0.5, default: 2, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 16, unit: '%' },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 100, step: 1, default: 65, unit: '%' },
  { key: 'margin', type: 'range', label: 'Margin', min: 0, max: 20, step: 1, default: 7, unit: '%' },
  { key: 'showCode', type: 'toggle', label: 'Show code', default: true },
  { key: 'codeSize', type: 'range', label: 'Code size', min: 6, max: 26, step: 1, default: 12, unit: '%' },
  ...PALETTE.map((c, i) => ({
    key: `c${i + 1}`,
    type: 'color',
    label: `Color ${String(i + 1).padStart(2, '0')}`,
    default: c.color,
  })),
];

// A masonry board of colour panels — columns of stacked rounded cards of varying
// heights, each labelled with its colour name in a vertical caption (matching the
// reference swatch board). The cards SLIDE + fade in with a staggered entrance,
// hold, then slide out at the end so the loop is seamless.
export function render(ctx, t, p, { w, h }) {
  const n = Math.round(p.count);
  const cols = Math.min(Math.round(p.cols), n);
  const gap = Math.min(w, h) * (p.gap / 100);
  const margin = Math.min(w, h) * (p.margin / 100);
  const areaX = margin;
  const areaY = margin;
  const areaW = w - margin * 2;
  const areaH = h - margin * 2;
  const colW = (areaW - (cols - 1) * gap) / cols;

  // Distribute colours across columns round-robin, so each column stacks a share.
  const columns = Array.from({ length: cols }, () => []);
  for (let i = 0; i < n; i++) columns[i % cols].push(i);

  let order = 0; // global entrance order for the stagger
  for (let c = 0; c < cols; c++) {
    const ids = columns[c];
    if (!ids.length) continue;
    // varied but normalized heights within the column
    const weights = ids.map((id) => 0.7 + rand(id + 1) * 0.8);
    const wsum = weights.reduce((a, b) => a + b, 0);
    const gapsH = (ids.length - 1) * gap;
    const cx = areaX + c * (colW + gap);
    let cy = areaY;

    for (let k = 0; k < ids.length; k++) {
      const id = ids[k];
      const cardH = ((areaH - gapsH) * weights[k]) / wsum;

      // staggered slide-in entrance, synchronized slide-out at the end
      const d = n > 1 ? (order / (n - 1)) * (p.stagger / 100) * 0.45 : 0;
      let a; // 0..1 appearance
      if (t < d) a = 0;
      else if (t < d + 0.26) a = smooth((t - d) / 0.26);
      else if (t < 0.78) a = 1;
      else a = 1 - smooth((t - 0.78) / 0.22);
      order++;
      if (a <= 0.001) {
        cy += cardH + gap;
        continue;
      }

      const slide = (1 - a) * cardH * 0.5; // rises into place
      const x = cx;
      const y = cy + slide;
      const r = (Math.min(40, Math.max(0, p.radius)) / 100) * (Math.min(colW, cardH) / 2);

      const color = p[`c${id + 1}`] || PALETTE[id % PALETTE.length].color;
      ctx.save();
      ctx.globalAlpha = a;
      roundedRectPath(ctx, x, y, colW, cardH, r);
      ctx.fillStyle = color;
      ctx.fill();

      // hex code caption (toggleable) — readable colour from the swatch luminance
      if (p.showCode) {
        ctx.fillStyle = lumOf(color) > 150 ? 'rgba(20,22,26,0.9)' : 'rgba(255,255,255,0.95)';
        ctx.font = `700 ${Math.round(colW * ((p.codeSize ?? 12) / 100))}px Inter, system-ui, sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(String(color).toUpperCase(), x + colW * 0.12, y + cardH - colW * 0.14);
      }
      ctx.restore();

      cy += cardH + gap;
    }
  }
}
