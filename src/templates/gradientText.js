import { pingpong } from '../engine/easing.js';

export const meta = {
  id: 'gradientText',
  name: 'Gradient Text',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 2, default: 'GRADIENT', placeholder: 'your text' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 6, max: 40, step: 1, default: 22, unit: '%' },
  {
    key: 'weight',
    type: 'select',
    label: 'Weight',
    default: '800',
    options: [
      { value: '600', label: 'Semibold' },
      { value: '700', label: 'Bold' },
      { value: '800', label: 'Extrabold' },
      { value: '900', label: 'Black' },
    ],
  },
  { key: 'color1', type: 'color', label: 'Colour 1', default: '#00E5A0' },
  { key: 'color2', type: 'color', label: 'Colour 2', default: '#2563EB' },
  { key: 'angle', type: 'range', label: 'Angle', min: 0, max: 360, step: 5, default: 90, unit: '°' },
  { key: 'shine', type: 'toggle', label: 'Shine', default: true },
  { key: 'shineSpeed', type: 'range', label: 'Shine speed', min: 1, max: 6, step: 1, default: 2 },
  {
    key: 'bg',
    type: 'select',
    label: 'Background',
    default: 'color',
    options: [
      { value: 'color', label: 'Color' },
      { value: 'none', label: 'Transparent' },
    ],
  },
  { key: 'bgColor', type: 'color', label: 'Background color', default: '#0A1622' },
];

// Text filled with a two-colour gradient, with an optional bright shine that
// sweeps across (source-atop keeps it on the letters only). The background is
// composited BEHIND afterwards so the shine never leaks outside the text.
// Seamless: the shine ping-pongs (goes across and back) over the loop.
export function render(ctx, t, p, { w, h }) {
  const min = Math.min(w, h);
  const size = min * (p.fontSize / 100);
  const lines = String(p.text || '').split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) {
    if (p.bg !== 'none') {
      ctx.fillStyle = p.bgColor || '#0A1622';
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${p.weight || 800} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;

  const lineH = size * 1.08;
  const total = lineH * (lines.length - 1);
  const cx = w / 2;
  const cy = h / 2;
  let maxW = 0;
  for (const ln of lines) maxW = Math.max(maxW, ctx.measureText(ln).width);
  const half = Math.max(maxW, lineH * lines.length) / 2;

  // gradient across the chosen angle, spanning the text box
  const a = (p.angle * Math.PI) / 180;
  const gx = Math.cos(a) * half;
  const gy = Math.sin(a) * half;
  const grad = ctx.createLinearGradient(cx - gx, cy - gy, cx + gx, cy + gy);
  grad.addColorStop(0, p.color1 || '#00E5A0');
  grad.addColorStop(1, p.color2 || '#2563EB');
  ctx.fillStyle = grad;
  lines.forEach((ln, i) => ctx.fillText(ln, cx, cy + i * lineH - total / 2));

  // shine sweep, kept to the letters via source-atop
  if (p.shine) {
    const band = half * 0.5;
    const k = pingpong((((t * Math.round(p.shineSpeed)) % 1) + 1) % 1); // 0→1→0, seamless
    const sweep = cx - half - band + (2 * half + 2 * band) * k;
    const sg = ctx.createLinearGradient(sweep - band, 0, sweep + band, 0);
    sg.addColorStop(0, 'rgba(255,255,255,0)');
    sg.addColorStop(0.5, 'rgba(255,255,255,0.55)');
    sg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalCompositeOperation = 'source-atop';
    ctx.fillStyle = sg;
    ctx.fillRect(cx - half - band, cy - half, 2 * (half + band), 2 * half);
  }

  // background behind the (already-composited) text
  if (p.bg !== 'none') {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = p.bgColor || '#0A1622';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
