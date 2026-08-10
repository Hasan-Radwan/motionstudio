import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { seeded } from '../engine/easing.js';

export const meta = {
  id: 'cardTunnel',
  name: 'Card Tunnel',
  category: '3D & Perspective',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 3, max: 12, step: 1, default: 7 },
  { key: 'size', type: 'range', label: 'Near size', min: 40, max: 90, step: 1, default: 62, unit: '%' },
  { key: 'spread', type: 'range', label: 'Spread', min: 0, max: 40, step: 1, default: 18, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 11, unit: '%' },
];

// Cards fly out of the depth toward the camera, growing and fading in, then
// passing the viewer. Seamless: as a near card leaves, a far one appears.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.5;
  const cx = w / 2;
  const cy = h / 2;
  const baseW = (w * p.size) / 100;
  const rnd = seeded(p.count * 13 + 5);

  // fixed drift direction per card so they streak past consistently
  const dirs = [];
  for (let i = 0; i < p.count; i++) {
    const a = rnd() * Math.PI * 2;
    dirs.push([Math.cos(a), Math.sin(a)]);
  }

  const items = [];
  for (let i = 0; i < p.count; i++) {
    const z = (t + i / p.count) % 1; // 0 far → 1 near
    items.push({ z, idx: i });
  }
  items.sort((a, b) => a.z - b.z); // far (small) first

  for (const it of items) {
    const grow = 0.08 + 0.92 * it.z * it.z; // non-linear for depth feel
    const cw = baseW * grow;
    const ch = cw / imgR;
    const off = ((w * p.spread) / 100) * it.z;
    const [dx, dy] = dirs[it.idx];
    // fade in when far, fade out as it passes
    let alpha = 1;
    if (it.z < 0.18) alpha = it.z / 0.18;
    else if (it.z > 0.88) alpha = (1 - it.z) / 0.12;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    drawCard(ctx, imageAt(it.idx), cx + dx * off - cw / 2, cy + dy * off - ch / 2, cw, ch, {
      r: cornerR(p.radius, cw, ch),
      shadowBlur: min * 0.05 * grow,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
