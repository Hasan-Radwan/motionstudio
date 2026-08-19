import { drawCard, cornerR, withAlpha, coverBleed } from '../engine/canvasUtils.js';

export const meta = {
  id: 'storyFeed',
  name: 'Story Feed',
  category: 'Slideshow & Story',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Stories', min: 3, max: 12, step: 1, default: 6 },
  { key: 'size', type: 'range', label: 'Card width', min: 30, max: 62, step: 1, default: 44, unit: '%' },
  { key: 'gap', type: 'range', label: 'Spacing', min: 34, max: 70, step: 1, default: 52, unit: '%' },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'up',
    options: [
      { value: 'up', label: 'Scroll up' },
      { value: 'down', label: 'Scroll down' },
    ],
  },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 16, unit: '%' },
  { key: 'backdrop', type: 'toggle', label: 'Photo backdrop', default: true },
  { key: 'blur', type: 'range', label: 'Backdrop blur', min: 0, max: 40, step: 1, default: 20, unit: 'px' },
  { key: 'dim', type: 'range', label: 'Backdrop dim', min: 0, max: 80, step: 1, default: 46, unit: '%' },
];

// A vertical feed of tall "story" cards that scroll up (or down): the centred card
// is largest and brightest, neighbours shrink and fade above/below. Advances one
// card per loop cycle and wraps, so it never jumps.
//
// The photo backdrop echoes the SAME image as the centred card and cross-fades to
// the next as the feed scrolls, so the full-frame background stays in sync with the
// story currently in focus.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const dir = p.direction === 'down' ? -1 : 1; // 'up' = feed scrolls upward
  const cardW = (w * p.size) / 100;
  const cardH = Math.min(cardW * 1.6, h * 0.72); // story = tall portrait frame
  const spacing = h * (p.gap / 100);
  const cx = w / 2;
  const cy = h / 2;
  const progress = t * n * dir; // continuous scroll, one card per 1/n of the loop

  // ---- photo backdrop (locked to the centred story's image) ----
  if (p.backdrop) {
    // Continuous "centre slot": the (fractional) card index sitting at the middle
    // of the feed. i0/i1 bracket it; the focused card flips as `frac` passes 0.5.
    const c = ((progress % n) + n) % n;
    const i0 = Math.floor(c);
    const frac = c - i0;
    const i1 = (i0 + 1) % n;
    const band = 0.22;
    const x = Math.min(1, Math.max(0, (frac - (0.5 - band)) / (2 * band)));
    const wUp = x * x * (3 - 2 * x); // 0 while i0 is centred, →1 as i1 takes centre
    ctx.save();
    coverBleed(ctx, imageAt(i0), w, h, p.blur);
    if (wUp > 0.001) {
      ctx.globalAlpha = wUp;
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

  // ---- feed of story cards ----
  const items = [];
  for (let i = 0; i < n; i++) {
    // centred, wrapped relative slot in [-n/2, n/2)
    let rel = ((((i - progress) + n / 2) % n) + n) % n - n / 2;
    items.push({ rel, dist: Math.abs(rel), idx: i });
  }
  items.sort((a, b) => b.dist - a.dist); // far first, centre last (on top)

  for (const it of items) {
    const s = Math.max(0.34, 1 - it.dist * 0.18);
    const alpha = Math.max(0, 1 - it.dist * 0.42);
    if (alpha <= 0.01) continue;
    const cw = cardW * s;
    const ch = cardH * s;
    const x = cx - cw / 2;
    const y = cy + it.rel * spacing - ch / 2;
    ctx.save();
    ctx.globalAlpha = alpha;
    drawCard(ctx, imageAt(it.idx), x, y, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.05 * s,
      shadowColor: withAlpha('#000000', 0.5 * alpha),
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
