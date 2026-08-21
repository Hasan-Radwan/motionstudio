import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'text3dFlip',
  name: '3D Stagger Flip',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 1, default: 'STAGGER FLIP', placeholder: 'your text' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 6, max: 34, step: 1, default: 16, unit: '%' },
  {
    key: 'weight',
    type: 'select',
    label: 'Weight',
    default: '600',
    options: [
      { value: '400', label: 'Regular' },
      { value: '600', label: 'Semibold' },
      { value: '700', label: 'Bold' },
      { value: '800', label: 'Extrabold' },
    ],
  },
  { key: 'color', type: 'color', label: 'Front color', default: '#FFFFFF' },
  { key: 'flipColor', type: 'color', label: 'Flip color', default: '#00E5A0' },
  {
    key: 'rotateDirection',
    type: 'select',
    label: 'Flip axis',
    default: 'top',
    options: [
      { value: 'top', label: 'Flip up' },
      { value: 'bottom', label: 'Flip down' },
      { value: 'left', label: 'Flip left' },
      { value: 'right', label: 'Flip right' },
    ],
  },
  {
    key: 'staggerFrom',
    type: 'select',
    label: 'Stagger from',
    default: 'first',
    options: [
      { value: 'first', label: 'First' },
      { value: 'last', label: 'Last' },
      { value: 'center', label: 'Center' },
    ],
  },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 0.3, step: 0.005, default: 0.06 },
  { key: 'flips', type: 'range', label: 'Flips', min: 1, max: 4, step: 1, default: 1 },
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

const DIRS = { top: ['y', 1], bottom: ['y', -1], left: ['x', 1], right: ['x', -1] };

// 3D stagger flip: each character continuously flips on a fake-3D card axis
// (vertical squash = flip around X, horizontal squash = flip around Y), revealing
// a second "flip colour" on its back face. A per-character phase offset — ordered
// from first / last / centre — makes the flips ripple across the word. Seamless:
// each letter turns a whole number of times per loop.
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
  ctx.font = `${p.weight || 600} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;

  const ls = size * (p.letterSpacing / 100);
  const widths = chars.map((c) => ctx.measureText(c).width);
  const totalW = widths.reduce((s, x) => s + x, 0) + ls * (chars.length - 1);
  const [axis, dir] = DIRS[p.rotateDirection] || DIRS.top;
  const flips = Math.round(p.flips);
  const n = chars.length;
  const center = Math.floor(n / 2);

  let x = w / 2 - totalW / 2;
  const cy = h / 2;
  chars.forEach((ch, i) => {
    const cwi = widths[i];
    const cxi = x + cwi / 2;
    x += cwi + ls;
    if (ch === ' ') return;

    const order = p.staggerFrom === 'last' ? n - 1 - i : p.staggerFrom === 'center' ? Math.abs(center - i) : i;
    const phase = order * p.stagger * TAU;
    const a = t * TAU * flips * dir + phase;
    const c = Math.cos(a);
    const back = c < 0;

    ctx.save();
    ctx.globalAlpha = 0.6 + 0.4 * Math.abs(c); // edge-on faces read as dimmer (depth)
    ctx.fillStyle = back ? p.flipColor || '#00E5A0' : p.color || '#FFFFFF';
    ctx.translate(cxi, cy);
    if (axis === 'y') ctx.scale(1, c);
    else ctx.scale(c, 1);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
  });
  ctx.restore();
}
