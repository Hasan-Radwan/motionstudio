import { drawCard, cornerR } from '../engine/canvasUtils.js';
import { seeded } from '../engine/easing.js';

export const meta = {
  id: 'driftTiles',
  name: 'Drift Tiles',
  category: 'Grid',
  media: { default: 10, min: 1, max: 16 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Tiles', min: 6, max: 22, step: 1, default: 14 },
  { key: 'size', type: 'range', label: 'Tile size', min: 12, max: 34, step: 1, default: 22, unit: '%' },
  { key: 'depth', type: 'range', label: 'Parallax', min: 10, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

// Tiles sit on several depth layers and drift sideways; near tiles are larger,
// brighter and move faster than far ones. Each tile wraps across the frame, so
// the pan loops seamlessly regardless of loop time.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const n = Math.round(p.count);
  const rnd = seeded(n * 31 + 7);
  const span = w * 1.4; // wrap width, wider than the frame for clean re-entry

  const items = [];
  for (let i = 0; i < n; i++) {
    const layer = rnd(); // 0 far .. 1 near
    const baseX = rnd() * span;
    const y = (0.1 + rnd() * 0.8) * h;
    const speed = (p.depth / 100) * (0.25 + layer * 0.9);
    let x = ((baseX - t * speed * span) % span + span) % span - span * 0.2;
    items.push({ x, y, layer, idx: i });
  }
  items.sort((a, b) => a.layer - b.layer); // far first

  for (const it of items) {
    const s = 0.4 + it.layer * 1.0;
    const cw = ((w * p.size) / 100) * s;
    const ch = cw / imgR;
    ctx.save();
    ctx.globalAlpha = 0.3 + it.layer * 0.7;
    drawCard(ctx, imageAt(it.idx), it.x - cw / 2, it.y - ch / 2, cw, ch, {
      r: cornerR(p.radius, cw, ch),
      shadowBlur: min * 0.04 * s,
      shadowColor: 'rgba(0,0,0,0.45)',
      shadowY: min * 0.02 * s,
      shine: false,
    });
    ctx.restore();
  }
}
