import { easeInOut, clamp } from '../engine/easing.js';

export const meta = {
  id: 'lineReveal',
  name: 'Line Reveal',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 3, default: 'LINE\nREVEAL', placeholder: 'one line per row' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 6, max: 34, step: 1, default: 17, unit: '%' },
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
  { key: 'color', type: 'color', label: 'Text color', default: '#FFFFFF' },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 0.2, step: 0.005, default: 0.08 },
  { key: 'duration', type: 'range', label: 'Duration', min: 0.1, max: 0.6, step: 0.01, default: 0.3 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'up',
    options: [
      { value: 'up', label: 'From bottom' },
      { value: 'down', label: 'From top' },
    ],
  },
  {
    key: 'align',
    type: 'select',
    label: 'Align',
    default: 'center',
    options: [
      { value: 'left', label: 'Left' },
      { value: 'center', label: 'Center' },
      { value: 'right', label: 'Right' },
    ],
  },
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

// Editorial line reveal: each line rises into view from behind a clip edge,
// staggered line by line. Loops via an enter → hold → exit envelope on each
// line's own phase, so the block reads as a travelling reveal that never jumps.
export function render(ctx, t, p, { w, h }) {
  const min = Math.min(w, h);
  if (p.bg !== 'none') {
    ctx.fillStyle = p.bgColor || '#0A1622';
    ctx.fillRect(0, 0, w, h);
  }
  const size = min * (p.fontSize / 100);
  const lines = String(p.text || '').split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) return;

  ctx.textBaseline = 'middle';
  ctx.textAlign = p.align || 'center';
  ctx.font = `${p.weight || 800} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;

  const lineH = size * 1.2;
  const total = lineH * lines.length;
  const y0 = h / 2 - total / 2 + lineH / 2;
  const dir = p.direction === 'down' ? -1 : 1;
  const margin = w * 0.06;
  const ax = p.align === 'left' ? margin : p.align === 'right' ? w - margin : w / 2;
  const dur = clamp(p.duration, 0.05, 0.9);

  lines.forEach((line, i) => {
    const lt = (((t - i * p.stagger) % 1) + 1) % 1;
    let e;
    if (lt < dur) e = easeInOut(lt / dur);
    else if (lt > 1 - dur) e = easeInOut((1 - lt) / dur);
    else e = 1;

    const cyLine = y0 + i * lineH;
    ctx.save();
    // clip to this line's band so the text appears to rise from behind an edge
    ctx.beginPath();
    ctx.rect(0, cyLine - lineH / 2, w, lineH);
    ctx.clip();
    ctx.globalAlpha = clamp(e, 0, 1);
    ctx.fillStyle = p.color || '#FFFFFF';
    const yoff = (1 - e) * lineH * dir;
    ctx.fillText(line, ax, cyLine + yoff);
    ctx.restore();
  });
}
