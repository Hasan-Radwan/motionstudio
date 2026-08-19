import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { easeOut, easeInOut, easeOutBack, lerp, clamp } from '../engine/easing.js';

export const meta = {
  id: 'stagger',
  name: 'Stagger Reveal',
  category: 'Reveal & Wipe',
  media: { default: 9, min: 1, max: 24 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Elements', min: 3, max: 24, step: 1, default: 9 },
  { key: 'columns', type: 'range', label: 'Columns', min: 1, max: 6, step: 1, default: 3 },
  { key: 'stagger', type: 'range', label: 'Stagger', min: 0, max: 0.14, step: 0.005, default: 0.06 },
  { key: 'duration', type: 'range', label: 'Duration', min: 0.1, max: 0.6, step: 0.01, default: 0.32 },
  {
    key: 'from',
    type: 'select',
    label: 'From',
    default: 'bottom',
    options: [
      { value: 'bottom', label: 'Bottom' },
      { value: 'top', label: 'Top' },
      { value: 'left', label: 'Left' },
      { value: 'right', label: 'Right' },
      { value: 'scale', label: 'Scale' },
      { value: 'center', label: 'Center' },
    ],
  },
  { key: 'distance', type: 'range', label: 'Distance', min: 0, max: 60, step: 1, default: 28, unit: '%' },
  { key: 'startScale', type: 'range', label: 'Start scale', min: 0, max: 100, step: 1, default: 55, unit: '%' },
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
  { key: 'gap', type: 'range', label: 'Gap', min: 2, max: 30, step: 1, default: 10, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 10, unit: '%' },
];

// Staggered reveal: a grid of elements that animate into place one after another,
// each offset by a per-element delay. This is the parametric family the brief
// describes — dozens of looks come from the same math by changing the params:
//
//   delayᵢ  = i * stagger
//   pᵢ      = ease((t - delayᵢ) / duration)          // per-element progress
//   xᵢ      = lerp(startX, homeX, pᵢ)                 // and yᵢ, scaleᵢ, opacityᵢ
//
// To loop seamlessly (t=0 must equal t=1) each element runs a full enter → hold →
// exit cycle on its OWN phase: the delay just shifts where in the loop the element
// currently is, so the group reads as a travelling wave that never jumps.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const cols = Math.max(1, Math.min(Math.round(p.columns), n));
  const rows = Math.ceil(n / cols);
  const gap = min * (p.gap / 100);

  // Grid geometry — centred composition inside a comfortable margin.
  const availW = w * 0.84;
  const availH = h * 0.8;
  const cellW = (availW - gap * (cols - 1)) / cols;
  const cellH = (availH - gap * (rows - 1)) / rows;
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1;
  let cardW = cellW;
  let cardH = cardW / imgR;
  if (cardH > cellH) {
    cardH = cellH;
    cardW = cardH * imgR;
  }
  const gridW = cols * cellW + (cols - 1) * gap;
  const gridH = rows * cellH + (rows - 1) * gap;
  const x0 = (w - gridW) / 2 + cellW / 2;
  const y0 = (h - gridH) / 2 + cellH / 2;

  const dur = clamp(p.duration, 0.05, 0.9);
  const ease = p.ease === 'inout' ? easeInOut : p.ease === 'back' ? easeOutBack : easeOut;
  const dist = min * (p.distance / 100);
  const sScale = p.startScale / 100;
  const cx = w / 2;
  const cy = h / 2;

  for (let i = 0; i < n; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const homeX = x0 + col * (cellW + gap);
    const homeY = y0 + row * (cellH + gap);

    // Per-element looped local time, offset by its stagger delay.
    const lt = (((t - i * p.stagger) % 1) + 1) % 1;
    // Envelope: rise in [0,dur], hold at 1, fall in [1-dur,1] → seamless at the seam.
    let e;
    if (lt < dur) e = ease(lt / dur);
    else if (lt > 1 - dur) e = ease((1 - lt) / dur);
    else e = 1;
    const op = clamp(e, 0, 1); // opacity ignores easeOutBack overshoot

    // Start offset by chosen direction (position overshoots with 'back' ease).
    let sx = homeX;
    let sy = homeY;
    const from = p.from;
    if (from === 'bottom') sy = homeY + dist;
    else if (from === 'top') sy = homeY - dist;
    else if (from === 'left') sx = homeX - dist;
    else if (from === 'right') sx = homeX + dist;
    else if (from === 'center') {
      sx = cx;
      sy = cy;
    }
    // 'scale' → no positional travel, pure scale/opacity.

    const x = lerp(sx, homeX, e);
    const y = lerp(sy, homeY, e);
    const scale = lerp(sScale, 1, e);
    if (op <= 0.01 || scale <= 0.01) continue;

    const cw = cardW * scale;
    const ch = cardH * scale;
    ctx.save();
    ctx.globalAlpha = op;
    ctx.translate(x, y);
    drawCard(ctx, imageAt(i), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.03 * scale,
      shadowColor: withAlpha('#000000', 0.4 * op),
      shadowY: min * 0.012,
      shine: false,
    });
    ctx.restore();
  }
}
