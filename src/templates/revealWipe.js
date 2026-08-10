import { roundedRectPath, drawImageCover, cornerR } from '../engine/canvasUtils.js';
import { triangle, easeInOut } from '../engine/easing.js';

export const meta = {
  id: 'revealWipe',
  name: 'Reveal Wipe',
  category: 'Reveal & Wipe',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Frame size', min: 50, max: 96, step: 1, default: 82, unit: '%' },
  {
    key: 'dir',
    type: 'select',
    label: 'Direction',
    default: 'left',
    options: [
      { value: 'left', label: 'Left → Right' },
      { value: 'right', label: 'Right → Left' },
      { value: 'up', label: 'Bottom → Top' },
      { value: 'down', label: 'Top → Bottom' },
    ],
  },
  { key: 'edge', type: 'range', label: 'Edge glow', min: 0, max: 100, step: 1, default: 60, unit: '%' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 9, unit: '%' },
];

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

  // reveal 0 -> 1 -> 0 so it wipes in then out (seamless loop)
  const prog = easeInOut(triangle(t));

  ctx.save();
  roundedRectPath(ctx, x, y, fw, fh, cornerR(p.radius, fw, fh));
  ctx.clip();

  let rx = x,
    ry = y,
    rw = fw,
    rh = fh,
    edge; // edge line position {x1,y1,x2,y2}
  if (p.dir === 'left') {
    rw = fw * prog;
    edge = { x1: x + rw, y1: y, x2: x + rw, y2: y + fh };
  } else if (p.dir === 'right') {
    rw = fw * prog;
    rx = x + fw - rw;
    edge = { x1: rx, y1: y, x2: rx, y2: y + fh };
  } else if (p.dir === 'down') {
    rh = fh * prog;
    edge = { x1: x, y1: y + rh, x2: x + fw, y2: y + rh };
  } else {
    rh = fh * prog;
    ry = y + fh - rh;
    edge = { x1: x, y1: ry, x2: x + fw, y2: ry };
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(rx, ry, rw, rh);
  ctx.clip();
  drawImageCover(ctx, image, x, y, fw, fh);
  ctx.restore();

  // bright edge line at the wipe boundary
  if (p.edge > 0 && prog > 0.001 && prog < 0.999) {
    ctx.strokeStyle = `rgba(255,255,255,${(p.edge / 100) * 0.9})`;
    ctx.lineWidth = Math.max(2, Math.min(fw, fh) * 0.006);
    ctx.shadowColor = 'rgba(255,255,255,0.8)';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(edge.x1, edge.y1);
    ctx.lineTo(edge.x2, edge.y2);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }
  ctx.restore();
}
