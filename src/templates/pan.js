import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { pingpong } from '../engine/easing.js';

export const meta = {
  id: 'pan',
  name: 'Ken Burns',
  category: 'Spotlight & Focus',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 100, step: 1, default: 90, unit: '%' },
  { key: 'zoom', type: 'range', label: 'Zoom', min: 4, max: 30, step: 1, default: 16, unit: '%' },
  { key: 'pan', type: 'range', label: 'Pan', min: 0, max: 40, step: 1, default: 22, unit: '%' },
  { key: 'dir', type: 'select', label: 'Direction', default: 'x', options: [
      { value: 'x', label: 'Horizontal' },
      { value: 'y', label: 'Vertical' },
      { value: 'diag', label: 'Diagonal' },
    ] },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 9, unit: '%' },
];

// A slow Ken-Burns move: the image zooms and drifts, easing out and back so the
// loop is seamless.
export function render(ctx, t, p, { image, w, h }) {
  const imgR = image && image.width ? image.width / image.height : 1.6;
  let fw = (w * p.size) / 100;
  let fh = fw / imgR;
  const maxH = (h * p.size) / 100;
  if (fh > maxH) {
    fh = maxH;
    fw = fh * imgR;
  }
  const x = (w - fw) / 2;
  const y = (h - fh) / 2;

  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, cornerR(p.radius, fw, fh));
  ctx.clip();

  const prog = pingpong(t); // 0 -> 1 -> 0
  const z = 1 + (p.zoom / 100) * prog;
  const zw = fw * z;
  const zh = fh * z;
  // available slack from the zoom, plus the pan amount
  const slackX = (zw - fw) / 2 + (fw * p.pan) / 100;
  const slackY = (zh - fh) / 2 + (fh * p.pan) / 100;
  const s = prog - 0.5; // -0.5 .. 0.5
  const dx = p.dir === 'y' ? 0 : s * slackX;
  const dy = p.dir === 'x' ? 0 : s * slackY;

  drawImageCover(
    ctx,
    image,
    x - (zw - fw) / 2 + dx,
    y - (zh - fh) / 2 + dy,
    zw,
    zh
  );
  ctx.restore();
}
