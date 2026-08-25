import { roundedRectPath, drawImageCover, cardShadowScale } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'isoTiles',
  name: 'Iso Tiles',
  category: 'Isometric',
  media: { default: 9, min: 1, max: 16 },
};

export const controls = [
  { key: 'cols', type: 'range', label: 'Columns', min: 2, max: 5, step: 1, default: 3 },
  { key: 'rows', type: 'range', label: 'Rows', min: 2, max: 5, step: 1, default: 3 },
  { key: 'size', type: 'range', label: 'Tile size', min: 14, max: 34, step: 1, default: 22, unit: '%' },
  { key: 'flat', type: 'range', label: 'Flatten', min: 35, max: 75, step: 1, default: 55, unit: '%' },
  { key: 'wobble', type: 'range', label: 'Wobble', min: 0, max: 16, step: 1, default: 8, unit: '°' },
];

// A grid of image tiles laid on an isometric plane that gently wobbles and
// floats. The angle oscillates over the loop, so it's seamless.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const first = imageAt(0);
  const imgR = first && first.width ? first.width / first.height : 1;
  const cols = p.cols;
  const rows = p.rows;
  const tileW = (min * p.size) / 100;
  const tileH = tileW / imgR;
  const gap = tileW * 0.14;
  const A = (26 * Math.PI) / 180 + ((p.wobble * Math.PI) / 180) * Math.sin(t * TAU);
  const flat = p.flat / 100;
  const cosA = Math.cos(A);
  const sinA = Math.sin(A);
  const floatY = Math.sin(t * TAU) * min * 0.02;
  const r = tileW * 0.08;

  const applyIso = () => ctx.transform(cosA, sinA * flat, -sinA, cosA * flat, 0, 0);

  // draw back-to-front (smaller row+col is further back)
  const cells = [];
  for (let rr = 0; rr < rows; rr++)
    for (let cc = 0; cc < cols; cc++) cells.push({ rr, cc });
  cells.sort((a, b) => a.rr + a.cc - (b.rr + b.cc));

  for (const { rr, cc } of cells) {
    const u = (cc - (cols - 1) / 2) * (tileW + gap);
    const v = (rr - (rows - 1) / 2) * (tileH + gap);
    ctx.save();
    ctx.translate(w / 2, h / 2 + floatY);
    applyIso();
    // soft base shadow (global strength, 0 = off)
    const sh = cardShadowScale();
    if (sh > 0) {
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.4)';
      ctx.shadowBlur = min * 0.03 * sh;
      ctx.shadowOffsetY = min * 0.015 * sh;
      roundedRectPath(ctx, u - tileW / 2, v - tileH / 2, tileW, tileH, r);
      ctx.fillStyle = '#0e0f13';
      ctx.fill();
      ctx.restore();
    }
    // image face
    ctx.save();
    roundedRectPath(ctx, u - tileW / 2, v - tileH / 2, tileW, tileH, r);
    ctx.clip();
    drawImageCover(ctx, imageAt(rr * cols + cc), u - tileW / 2, v - tileH / 2, tileW, tileH);
    // top sheen
    const g = ctx.createLinearGradient(0, v - tileH / 2, 0, v + tileH / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.12)');
    g.addColorStop(0.5, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(u - tileW / 2, v - tileH / 2, tileW, tileH);
    ctx.restore();
    ctx.restore();
  }
}
