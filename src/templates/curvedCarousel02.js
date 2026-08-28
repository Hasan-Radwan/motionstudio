import { drawCard, drawImageContain, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'curvedCarousel02',
  name: 'Curved Carousel 02',
  category: 'Carousel & Flow',
  pro: true,
  aspect: '4:5',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Poster size', min: 18, max: 55, step: 1, default: 26, unit: '%' },
  { key: 'speed', type: 'range', label: 'Speed', min: 1, max: 4, step: 1, default: 2 },
  { key: 'spacing', type: 'range', label: 'Spacing', min: 40, max: 160, step: 1, default: 85, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 22, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -50, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -50, max: 50, step: 1, default: -6, unit: '%' },
  // Foreground subject (static PNG cut-out, first image, pinned in front).
  { key: 'fgSize', type: 'range', label: 'Foreground size', min: 30, max: 100, step: 1, default: 44, unit: '%' },
  { key: 'fgX', type: 'range', label: 'Foreground X', min: 0, max: 100, step: 1, default: 51, unit: '%' },
  { key: 'fgY', type: 'range', label: 'Foreground Y', min: 40, max: 100, step: 1, default: 92, unit: '%' },
];

const smooth = (x) => x * x * (3 - 2 * x);

// A straight horizontal strip: uniform poster cards stream left → right in a flat
// line behind a pinned foreground subject (PNG cut-out). Seamless because each
// card's track phase is periodic in t and `speed` is an integer passes/loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);

  const fgSlot = p.fg == null ? 1 : p.fg;
  const fgIndex = fgSlot > 0 ? (fgSlot - 1) % count : -1;
  const posters = [];
  for (let i = 0; i < count; i++) if (i !== fgIndex) posters.push(i);
  const pc = posters.length;

  if (pc > 0) {
    const ref = imageAt(posters[0]);
    const imgR = ref && ref.width ? ref.width / ref.height : 0.72;
    const cardW = (w * p.size) / 100;
    const cardH = cardW / imgR;
    const cy = h * 0.5 + ((p.posY || 0) / 100) * h;
    const offX = ((p.posX || 0) / 100) * w;
    const r = cornerR(p.radius, cardW, cardH);
    const pad = cardW * (0.4 + p.spacing / 100); // off-screen runway / spread
    const track = w + 2 * pad;

    for (let k = 0; k < pc; k++) {
      const u = (((k / pc + t * p.speed) % 1) + 1) % 1; // 0..1 track phase (L→R)
      const x = -pad + u * track;
      const fx = x / w;
      let alpha = 1;
      if (fx < 0.06) alpha = smooth(Math.max(0, fx / 0.06));
      else if (fx > 0.94) alpha = smooth(Math.max(0, (1 - fx) / 0.06));
      if (alpha <= 0.01) continue;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(x + offX, cy);
      drawCard(ctx, imageAt(posters[k]), -cardW / 2, -cardH / 2, cardW, cardH, {
        r,
        shadowBlur: min * 0.05,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowY: min * 0.02,
        shine: false,
      });
      ctx.restore();
    }
  }

  // ---- static foreground subject (sharp, pinned in front of everything) ----
  if (fgIndex >= 0) {
    const fg = imageAt(fgIndex);
    if (fg && fg.width) {
      const fw = (w * p.fgSize) / 100;
      const fh = fw / (fg.width / fg.height);
      const cxFg = w * ((p.fgX ?? 50) / 100);
      const bottom = h * (p.fgY / 100);
      drawImageContain(ctx, fg, cxFg - fw / 2, bottom - fh, fw, fh);
    }
  }
}
