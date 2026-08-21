import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { clamp } from '../engine/easing.js';

const TAU = Math.PI * 2;

export const meta = {
  id: 'imageTrail',
  name: 'Image Trail',
  category: 'Stack & Scatter',
  media: { default: 5, min: 1, max: 12 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Image size', min: 8, max: 32, step: 1, default: 16, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 8, unit: '%' },
  {
    key: 'path',
    type: 'select',
    label: 'Path',
    default: 'figure8',
    options: [
      { value: 'figure8', label: 'Figure 8' },
      { value: 'circle', label: 'Circle' },
      { value: 'lissajous', label: 'Lissajous' },
    ],
  },
  { key: 'pathSize', type: 'range', label: 'Path size', min: 20, max: 92, step: 1, default: 62, unit: '%' },
  { key: 'drops', type: 'range', label: 'Trail count', min: 6, max: 40, step: 1, default: 20 },
  { key: 'life', type: 'range', label: 'Visible for', min: 0.1, max: 0.6, step: 0.02, default: 0.3 },
  { key: 'blur', type: 'range', label: 'Blur', min: 0, max: 24, step: 1, default: 10, unit: 'px' },
  { key: 'loops', type: 'range', label: 'Loops', min: 1, max: 3, step: 1, default: 1 },
  { key: 'label', type: 'toggle', label: 'Label', default: true },
  { key: 'labelText', type: 'text', label: 'Label text', rows: 1, default: 'ROTION' },
  { key: 'labelColor', type: 'color', label: 'Label color', default: '#FFFFFF' },
  { key: 'labelSize', type: 'range', label: 'Label size', min: 4, max: 26, step: 1, default: 11, unit: '%' },
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

function pathPoint(kind, u, loops, A) {
  const th = u * TAU * loops;
  if (kind === 'circle') return { x: Math.cos(th) * A, y: Math.sin(th) * A };
  if (kind === 'lissajous') return { x: Math.sin(3 * th) * A, y: Math.sin(2 * th) * A };
  return { x: Math.sin(th) * A, y: Math.sin(2 * th) * A * 0.6 }; // figure 8
}

// Auto-path image trail: a virtual point travels a closed looping path and
// "drops" images along it; each drop fades in (scale + blur), holds, then fades
// out — leaving a trail. This is the seamless, deterministic version of a
// cursor-driven trail (the cursor is replaced by the path), so it loops and
// exports cleanly. Optional centred label sits behind the trail.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);
  if (p.bg !== 'none') {
    ctx.fillStyle = p.bgColor || '#0A1622';
    ctx.fillRect(0, 0, w, h);
  }

  const cx = w / 2;
  const cy = h / 2;

  // centred label, behind the trail
  if (p.label && String(p.labelText || '').trim()) {
    const ls = min * (p.labelSize / 100);
    ctx.save();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = `700 ${ls}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
    ctx.fillStyle = p.labelColor || '#FFFFFF';
    ctx.fillText(String(p.labelText), cx, cy);
    ctx.restore();
  }

  const A = min * (p.pathSize / 100) * 0.5;
  const cardBase = (min * p.size) / 100;
  const N = Math.round(p.drops);
  const loops = Math.round(p.loops);
  const life = clamp(p.life, 0.05, 0.95);
  const ein = life * 0.35;
  const eout = life * 0.5;
  const nImgs = Math.max(1, count);

  // Build the currently-visible drops (deterministic function of t → seamless).
  const items = [];
  for (let k = 0; k < N; k++) {
    const tk = k / N;
    const age = (((t - tk) % 1) + 1) % 1;
    if (age >= life) continue;
    let e;
    if (age < ein) e = age / ein;
    else if (age > life - eout) e = (life - age) / eout;
    else e = 1;
    items.push({ pos: pathPoint(p.path, tk, loops, A), e: clamp(e, 0, 1), age, idx: k % nImgs });
  }
  items.sort((a, b) => b.age - a.age); // oldest first, newest on top

  for (const it of items) {
    const op = it.e;
    if (op <= 0.02) continue;
    const scale = 0.5 + 0.5 * op;
    const blur = p.blur * (1 - op);
    const im = imageAt(it.idx);
    const aspect = im && im.width ? im.width / im.height : 0.75;
    const cw = cardBase * scale;
    const ch = cw / aspect;
    ctx.save();
    ctx.globalAlpha = op;
    if (blur > 0.3) ctx.filter = `blur(${blur.toFixed(1)}px)`;
    ctx.translate(cx + it.pos.x, cy + it.pos.y);
    drawCard(ctx, im, -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.03 * scale,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowY: min * 0.012,
      shine: false,
    });
    ctx.restore();
  }
}
