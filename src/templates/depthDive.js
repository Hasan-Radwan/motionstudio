import { drawCard, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'depthDive',
  name: 'Depth Dive',
  category: 'Stack & Scatter',
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Cards', min: 3, max: 12, step: 1, default: 7 },
  { key: 'size', type: 'range', label: 'Near size', min: 34, max: 80, step: 1, default: 56, unit: '%' },
  { key: 'drift', type: 'range', label: 'Drift', min: 0, max: 40, step: 1, default: 20, unit: '%' },
  { key: 'spin', type: 'range', label: 'Twist', min: 0, max: 20, step: 1, default: 7, unit: '°' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
];

// Cards continuously dive out of the depth toward a corner, each one growing,
// twisting slightly and drifting as it nears the viewer. Seamless: a card fades
// out up close exactly as a new one fades in far away.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1.4;
  const cx = w / 2;
  const cy = h / 2;
  const baseW = (w * p.size) / 100;
  const driftMax = (min * p.drift) / 100;
  const spinMax = (p.spin * Math.PI) / 180;

  const items = [];
  for (let i = 0; i < p.count; i++) {
    const z = (t + i / p.count) % 1; // 0 far → 1 near
    items.push({ z, idx: i });
  }
  items.sort((a, b) => a.z - b.z); // far (small) first

  for (const it of items) {
    const grow = 0.1 + 0.9 * it.z * it.z;
    const cw = baseW * grow;
    const ch = cw / imgR;
    // drift toward the upper-right corner as it approaches
    const off = driftMax * it.z;
    const x = cx + off * 0.8;
    const y = cy - off * 0.6;
    const rot = spinMax * (1 - it.z);
    let alpha = 1;
    if (it.z < 0.16) alpha = it.z / 0.16;
    else if (it.z > 0.9) alpha = (1 - it.z) / 0.1;
    ctx.save();
    ctx.globalAlpha = Math.max(0, alpha);
    ctx.translate(x, y);
    ctx.rotate(rot);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.radius, cw, ch),
      shadowBlur: min * 0.05 * grow,
      shadowColor: 'rgba(0,0,0,0.5)',
      shadowY: min * 0.02,
      shine: false,
    });
    ctx.restore();
  }
}
