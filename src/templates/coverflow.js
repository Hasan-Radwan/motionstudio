import { drawCard, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'coverflow',
  name: 'Coverflow',
  category: 'Carousel & Flow',
  media: { default: 5, min: 1, max: 10 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Card size', min: 24, max: 60, step: 1, default: 40, unit: '%' },
  { key: 'spacing', type: 'range', label: 'Spacing', min: 40, max: 100, step: 1, default: 62, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Side tilt', min: 10, max: 70, step: 1, default: 46, unit: '°' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 11, unit: '%' },
];

// A cover-flow strip: cards scroll horizontally and the ones off-centre rotate
// away in fake 3D. Seamless: the band advances exactly one card per loop.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cardW = (w * p.size) / 100;
  const cardH = cardW / imgR;
  const step = cardW * (p.spacing / 100);
  const cy = h / 2;
  const tiltMax = (p.tilt * Math.PI) / 180;

  const n = Math.ceil(w / step) + 4;
  const scroll = (t % 1) * step;
  const period = n * step;

  const items = [];
  // Exactly `n` cards — one per slot in the wrap period. (Using more than n here
  // makes two indices wrap onto the SAME position: identical-position duplicates
  // whose paint order flips every frame → a visible jitter/flicker.)
  for (let i = 0; i < n; i++) {
    let x = w / 2 + i * step - scroll - ((n - 1) / 2) * step + step / 2;
    x = ((((x - w / 2) % period) + period) % period) - period / 2 + w / 2;
    const dist = (x - w / 2) / step; // signed distance in card-steps
    items.push({ x, dist, idx: i });
  }
  // Paint far cards first so the centre card lands on top; a stable tie-break on
  // `dist` keeps the order from flipping when two cards are equidistant.
  items.sort((a, b) => Math.abs(b.dist) - Math.abs(a.dist) || a.dist - b.dist);

  for (const it of items) {
    const ad = Math.min(1.4, Math.abs(it.dist));
    const angle = Math.max(-1.4, Math.min(1.4, it.dist)) * tiltMax * 0.7;
    const scale = 1 - Math.min(0.28, ad * 0.16);
    const cw = cardW * scale;
    const ch = cardH * scale;
    ctx.save();
    ctx.translate(it.x, cy);
    // fake rotateY: horizontal squash + vertical shear, sign follows the side
    ctx.transform(Math.cos(angle), Math.sin(angle) * 0.16, 0, 1, 0, 0);
    ctx.globalAlpha = 0.4 + 0.6 * Math.max(0, 1 - ad);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.radius, cw, ch),
      shadowBlur: min * 0.05 * scale,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
