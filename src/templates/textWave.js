import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'textWave',
  name: 'Text Wave',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 1, default: 'WAVE', placeholder: 'your text' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 6, max: 34, step: 1, default: 18, unit: '%' },
  {
    key: 'weight',
    type: 'select',
    label: 'Weight',
    default: '700',
    options: [
      { value: '400', label: 'Regular' },
      { value: '600', label: 'Semibold' },
      { value: '700', label: 'Bold' },
      { value: '800', label: 'Extrabold' },
    ],
  },
  { key: 'color', type: 'color', label: 'Text color', default: '#FFFFFF' },
  { key: 'amplitude', type: 'range', label: 'Wave height', min: 0, max: 60, step: 1, default: 22, unit: '%' },
  { key: 'waves', type: 'range', label: 'Waves', min: 1, max: 5, step: 1, default: 2 },
  { key: 'spread', type: 'range', label: 'Spread', min: 0, max: 200, step: 1, default: 80, unit: '%' },
  { key: 'letterSpacing', type: 'range', label: 'Letter spacing', min: -8, max: 40, step: 1, default: 2, unit: '%' },
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

// Kinetic wave typography: each letter bobs on a travelling sine wave. Seamless —
// the wave completes a whole number of cycles per loop, so it never jumps.
export function render(ctx, t, p, { w, h }) {
  const min = Math.min(w, h);
  if (p.bg !== 'none') {
    ctx.fillStyle = p.bgColor || '#0A1622';
    ctx.fillRect(0, 0, w, h);
  }
  const size = min * (p.fontSize / 100);
  const chars = [...String(p.text || '').replace(/\r?\n/g, ' ')];
  if (!chars.length) return;

  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `${p.weight || 700} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = p.color || '#FFFFFF';

  const ls = size * (p.letterSpacing / 100);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalW = widths.reduce((s, x) => s + x, 0) + ls * (chars.length - 1);
  const amp = size * (p.amplitude / 100);
  const phase = t * TAU * Math.round(p.waves);
  const perChar = ((p.spread / 100) * TAU) / Math.max(1, chars.length);

  let x = w / 2 - totalW / 2;
  const cy = h / 2;
  chars.forEach((ch, i) => {
    const y = cy + amp * Math.sin(phase + i * perChar);
    if (ch !== ' ') ctx.fillText(ch, x, y);
    x += widths[i] + ls;
  });
  ctx.restore();
}
