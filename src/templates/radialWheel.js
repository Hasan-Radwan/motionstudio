import { drawCard, cornerR, withAlpha, coverBleed } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'radialWheel',
  name: 'Radial Wheel',
  category: 'Orbit',
  media: { default: 8, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 12, step: 1, default: 9 },
  { key: 'radius', type: 'range', label: 'Wheel size', min: 24, max: 48, step: 1, default: 36, unit: '%' },
  { key: 'size', type: 'range', label: 'Card size', min: 12, max: 34, step: 1, default: 12, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Perspective', min: 30, max: 95, step: 1, default: 76, unit: '%' },
  { key: 'turns', type: 'range', label: 'Turns', min: 0.25, max: 3, step: 0.25, default: 0.25 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'cw',
    options: [
      { value: 'cw', label: 'Clockwise' },
      { value: 'ccw', label: 'Counter-clockwise' },
    ],
  },
  { key: 'offsetX', type: 'range', label: 'Position X', min: -50, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'offsetY', type: 'range', label: 'Position Y', min: -50, max: 50, step: 1, default: 50, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 30, unit: '%' },
  { key: 'opacity', type: 'range', label: 'Card opacity', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'backdrop', type: 'toggle', label: 'Photo backdrop', default: true },
  { key: 'blur', type: 'range', label: 'Backdrop blur', min: 0, max: 40, step: 1, default: 0, unit: 'px' },
  { key: 'dim', type: 'range', label: 'Backdrop dim', min: 0, max: 80, step: 1, default: 5, unit: '%' },
];

// Cards fixed to the rim of a tilted wheel that spins a whole number of turns per
// loop (so it's seamless). Each card TUMBLES with the rim (its rotation follows
// the tangent). Direction, X/Y position, and a photo backdrop are user-controlled.
//
// The backdrop shows the SAME image as whichever card is currently at the front of
// the wheel, and cross-fades to the next card's image as the wheel turns — so the
// full-frame background changes in lock-step with the tumbling cards.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1;
  const count = Math.round(p.count);
  const dir = p.direction === 'ccw' ? -1 : 1;
  const cx = w / 2 + (w * (p.offsetX || 0)) / 100;
  const cy = h / 2 + (h * (p.offsetY || 0)) / 100;
  const R = (w * p.radius) / 100;
  const ry = R * (p.tilt / 100); // vertical squash = perspective tilt
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const step = TAU / count;
  // Fractional turns are allowed (e.g. 0.25–0.75) for a slower spin; whole turns
  // still loop perfectly seamlessly. No rounding here so the choice takes effect.
  const base = t * TAU * p.turns * dir;

  // ---- photo backdrop (locked to the frontmost card's image) ----
  if (p.backdrop) {
    // Continuous "front slot": the (fractional) card index whose angle sits at the
    // front of the wheel (a = +π/2, where the card is nearest / lowest on screen).
    // The two cards bracketing that slot are i0 (below) and i1 (above); the actual
    // frontmost card flips from i0 to i1 as `frac` passes 0.5.
    const f = (Math.PI / 2 - base) / step;
    const fLoop = ((f % count) + count) % count;
    const i0 = Math.floor(fLoop);
    const frac = fLoop - i0;
    const i1 = (i0 + 1) % count;
    // Hold on the frontmost card's image, then swap quickly around the hand-off
    // (frac≈0.5) with a short smoothstep cross-fade — so the backdrop always shows
    // the SAME image as the card currently at the front of the wheel.
    const band = 0.22;
    const x = Math.min(1, Math.max(0, (frac - (0.5 - band)) / (2 * band)));
    const wUp = x * x * (3 - 2 * x); // 0 while i0 is front, →1 as i1 takes the front
    ctx.save();
    coverBleed(ctx, imageAt(i0), w, h, p.blur);
    if (wUp > 0.001) {
      ctx.globalAlpha = wUp; // cross-fade toward the incoming front card
      coverBleed(ctx, imageAt(i1), w, h, p.blur);
    }
    ctx.restore();
    if (p.dim > 0) {
      ctx.save();
      ctx.fillStyle = withAlpha('#0a1622', p.dim / 100);
      ctx.fillRect(0, 0, w, h);
      ctx.restore();
    }
  }

  // ---- wheel of tumbling cards ----
  const items = [];
  for (let i = 0; i < count; i++) {
    const a = base + i * step;
    const depth = (Math.sin(a) + 1) / 2; // 0 far (top) .. 1 near (bottom)
    items.push({ x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * ry, rot: a + Math.PI / 2, depth, idx: i });
  }
  items.sort((a, b) => a.depth - b.depth); // far first, near on top

  const cardOpacity = (p.opacity ?? 100) / 100;
  for (const it of items) {
    const s = 0.72 + it.depth * 0.42;
    const cw = cardW * s;
    const ch = cardH * s;
    ctx.save();
    ctx.globalAlpha = (0.5 + it.depth * 0.5) * cardOpacity;
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.035 * s,
      shadowColor: withAlpha('#000000', 0.45 * it.depth),
      shadowY: min * 0.015,
      shine: false,
    });
    ctx.restore();
  }
}
