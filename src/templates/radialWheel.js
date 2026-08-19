import { drawCard, cornerR, withAlpha, drawImageCover } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'radialWheel',
  name: 'Radial Wheel',
  category: 'Orbit',
  media: { default: 8, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 4, max: 12, step: 1, default: 8 },
  { key: 'radius', type: 'range', label: 'Wheel size', min: 24, max: 48, step: 1, default: 38, unit: '%' },
  { key: 'size', type: 'range', label: 'Card size', min: 12, max: 34, step: 1, default: 22, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Perspective', min: 30, max: 95, step: 1, default: 62, unit: '%' },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 3, step: 1, default: 1 },
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
  { key: 'offsetY', type: 'range', label: 'Position Y', min: -50, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
  { key: 'backdrop', type: 'toggle', label: 'Photo backdrop', default: true },
  { key: 'blur', type: 'range', label: 'Backdrop blur', min: 0, max: 40, step: 1, default: 18, unit: 'px' },
  { key: 'dim', type: 'range', label: 'Backdrop dim', min: 0, max: 80, step: 1, default: 42, unit: '%' },
];

// Draw a full-bleed cover image, slightly over-scanned so a blur filter never
// reveals transparent edges. Used for the photo backdrop.
function coverBleed(ctx, img, w, h, blurPx) {
  if (!img || !img.width) return;
  const m = Math.max(blurPx * 2.5, Math.max(w, h) * 0.04);
  ctx.save();
  if (blurPx > 0) ctx.filter = `blur(${blurPx}px)`;
  drawImageCover(ctx, img, -m, -m, w + m * 2, h + m * 2);
  ctx.restore();
}

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
  const base = t * TAU * Math.round(p.turns) * dir;

  // ---- photo backdrop (front card's image, cross-fading as the wheel turns) ----
  if (p.backdrop) {
    // Continuous "front slot": the (fractional) card index whose angle sits at the
    // front of the wheel (a = +π/2, where the card is nearest / lowest on screen).
    const f = (Math.PI / 2 - base) / step;
    const fLoop = ((f % count) + count) % count;
    const i0 = Math.floor(fLoop);
    const frac = fLoop - i0;
    const i1 = (i0 + 1) % count;
    ctx.save();
    coverBleed(ctx, imageAt(i0), w, h, p.blur);
    if (frac > 0.001) {
      ctx.globalAlpha = frac; // cross-fade toward the incoming front card
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

  for (const it of items) {
    const s = 0.72 + it.depth * 0.42;
    const cw = cardW * s;
    const ch = cardH * s;
    ctx.save();
    ctx.globalAlpha = 0.5 + it.depth * 0.5;
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
