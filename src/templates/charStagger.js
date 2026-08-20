import { easeOut, easeOutBack, easeInOut, lerp, clamp } from '../engine/easing.js';

export const meta = {
  id: 'charStagger',
  name: 'Text Stagger',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 1, default: 'STAGGER', placeholder: 'your text' },
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
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 0.12, step: 0.002, default: 0.03 },
  { key: 'duration', type: 'range', label: 'Duration', min: 0.1, max: 0.6, step: 0.01, default: 0.28 },
  {
    key: 'from',
    type: 'select',
    label: 'From',
    default: 'up',
    options: [
      { value: 'up', label: 'Rise up' },
      { value: 'down', label: 'Drop down' },
      { value: 'scale', label: 'Scale' },
    ],
  },
  { key: 'distance', type: 'range', label: 'Distance', min: 0, max: 100, step: 1, default: 50, unit: '%' },
  {
    key: 'ease',
    type: 'select',
    label: 'Ease',
    default: 'out',
    options: [
      { value: 'out', label: 'Smooth' },
      { value: 'inout', label: 'Ease in-out' },
      { value: 'back', label: 'Overshoot' },
    ],
  },
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

// Per-character stagger: each letter animates in (rise / drop / scale) one after
// another, holds, then out — a looping travelling wave of characters. Seamless
// via an enter → hold → exit envelope on each letter's own phase.
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
  ctx.textAlign = 'center';
  ctx.font = `${p.weight || 700} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = p.color || '#FFFFFF';

  const ls = size * (p.letterSpacing / 100);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalW = widths.reduce((s, x) => s + x, 0) + ls * (chars.length - 1);
  const dur = clamp(p.duration, 0.05, 0.9);
  const ease = p.ease === 'inout' ? easeInOut : p.ease === 'back' ? easeOutBack : easeOut;
  const dist = size * (p.distance / 100) * 1.4;

  let x = w / 2 - totalW / 2;
  const cy = h / 2;
  chars.forEach((ch, i) => {
    const cw = widths[i];
    const cxi = x + cw / 2;
    x += cw + ls;
    if (ch === ' ') return;

    const lt = (((t - i * p.stagger) % 1) + 1) % 1;
    let e;
    if (lt < dur) e = ease(lt / dur);
    else if (lt > 1 - dur) e = ease((1 - lt) / dur);
    else e = 1;
    const op = clamp(e, 0, 1);
    if (op <= 0.01) return;

    let dy = 0;
    let scale = 1;
    if (p.from === 'up') dy = (1 - e) * dist;
    else if (p.from === 'down') dy = -(1 - e) * dist;
    else if (p.from === 'scale') scale = lerp(0.4, 1, e);

    ctx.save();
    ctx.globalAlpha = op;
    ctx.translate(cxi, cy + dy);
    if (scale !== 1) ctx.scale(scale, scale);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}
