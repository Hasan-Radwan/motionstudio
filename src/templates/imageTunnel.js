import { drawImageCover } from '../engine/canvasUtils.js';
import { clamp } from '../engine/easing.js';

export const meta = {
  id: 'imageTunnel',
  name: 'Image Tunnel',
  category: '3D & Perspective',
  media: { default: 5, min: 1, max: 12 },
};

export const controls = [
  { key: 'grid', type: 'range', label: 'Grid', min: 2, max: 8, step: 1, default: 4 },
  { key: 'speed', type: 'range', label: 'Speed', min: 2, max: 12, step: 1, default: 6 },
  { key: 'density', type: 'range', label: 'Fill density', min: 0, max: 100, step: 1, default: 45, unit: '%' },
  { key: 'imageChance', type: 'range', label: 'Image mix', min: 0, max: 100, step: 1, default: 45, unit: '%' },
  { key: 'fade', type: 'range', label: 'Fog', min: 0, max: 100, step: 1, default: 80, unit: '%' },
  { key: 'lineOpacity', type: 'range', label: 'Grid lines', min: 0, max: 100, step: 1, default: 45, unit: '%' },
  { key: 'lineColor', type: 'color', label: 'Line color', default: '#B0B0B0' },
  { key: 'bgColor', type: 'color', label: 'Background', default: '#000000' },
  { key: 'c1', type: 'color', label: 'Palette 1', default: '#FF6A00' },
  { key: 'c2', type: 'color', label: 'Palette 2', default: '#AB54F7' },
  { key: 'c3', type: 'color', label: 'Palette 3', default: '#EA3737' },
  { key: 'c4', type: 'color', label: 'Palette 4', default: '#0072E3' },
  { key: 'c5', type: 'color', label: 'Palette 5', default: '#00AA3C' },
  { key: 'c6', type: 'color', label: 'Palette 6', default: '#FFB200' },
];

const NEAR = 0.5; // nearest visible depth
const FAR = 15; // farthest depth (segments)

// deterministic 0..1 hash from an integer
function hash(n) {
  n = (n ^ 61) ^ (n >>> 16);
  n = (n + (n << 3)) | 0;
  n ^= n >>> 4;
  n = Math.imul(n, 0x27d4eb2d);
  n ^= n >>> 15;
  return (n >>> 0) / 4294967295;
}

// An endless fly-through a wireframe tunnel: coloured / image slabs sit on the
// four walls of a rectangular corridor and stream toward the camera, with grid
// lines and distance fog. The cursor-driven original is replaced by automatic
// forward motion; content is a deterministic function of the absolute segment
// index (periodic in `speed`), so the flight loops seamlessly.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  ctx.fillStyle = p.bgColor || '#000000';
  ctx.fillRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const f = w * 0.5; // focal (px)
  const HW = 1;
  const HH = h / w; // aspect-correct corridor cross-section
  const cols = Math.round(p.grid);
  const rows = Math.round(p.grid);
  const colW = (2 * HW) / cols;
  const rowH = (2 * HH) / rows;
  const period = Math.round(p.speed); // segments the loop flies through
  const camPos = t * period; // advances 0 → period over the loop
  const pal = [p.c1, p.c2, p.c3, p.c4, p.c5, p.c6].filter(Boolean);
  const nImgs = Math.max(1, count);
  const density = p.density / 100;
  const imgChance = p.imageChance / 100;
  const fog = (p.fade / 100) * 1.15;
  const lineA = p.lineOpacity / 100;

  const project = (x, y, z) => {
    const s = f / z;
    return [cx + x * s, cy + y * s];
  };
  const quad = (a, b, c, d) => {
    ctx.beginPath();
    ctx.moveTo(a[0], a[1]);
    ctx.lineTo(b[0], b[1]);
    ctx.lineTo(c[0], c[1]);
    ctx.lineTo(d[0], d[1]);
    ctx.closePath();
  };
  const imgQuad = (img, a, b, c, d) => {
    ctx.save();
    quad(a, b, c, d);
    ctx.clip();
    const xs = [a[0], b[0], c[0], d[0]];
    const ys = [a[1], b[1], c[1], d[1]];
    const minx = Math.min(...xs);
    const maxx = Math.max(...xs);
    const miny = Math.min(...ys);
    const maxy = Math.max(...ys);
    drawImageCover(ctx, img, minx, miny, maxx - minx, maxy - miny);
    ctx.restore();
  };

  const mMin = Math.floor(camPos + NEAR) + 1;
  const mMax = Math.floor(camPos + FAR);

  // far → near so nearer segments paint on top
  for (let m = mMax; m >= mMin; m--) {
    const zF = m - camPos; // far ring depth
    let zN = m - 1 - camPos; // near ring depth
    if (zF <= NEAR) continue;
    zN = Math.max(zN, NEAR);
    const midZ = (zN + zF) / 2;
    const alpha = clamp(1 - ((midZ - NEAR) / (FAR - NEAR)) * fog, 0, 1);
    if (alpha <= 0.02) continue;
    const k = ((m % period) + period) % period; // periodic seed → seamless

    ctx.globalAlpha = alpha;

    // ---- slabs on the four walls ----
    const drawWall = (wall, ax) => {
      const n = wall < 2 ? cols : rows;
      for (let i = 0; i < n; i++) {
        if (hash((k * 131 + wall * 17 + i * 7) | 0) >= density) continue;
        let A, B, C, D;
        if (wall === 0 || wall === 1) {
          const y = wall === 0 ? -HH : HH; // floor / ceiling
          const x0 = -HW + i * colW;
          const x1 = x0 + colW;
          A = project(x0, y, zN);
          B = project(x1, y, zN);
          C = project(x1, y, zF);
          D = project(x0, y, zF);
        } else {
          const x = ax; // left / right wall
          const y0 = -HH + i * rowH;
          const y1 = y0 + rowH;
          A = project(x, y0, zN);
          B = project(x, y1, zN);
          C = project(x, y1, zF);
          D = project(x, y0, zF);
        }
        const isImg = hash((k * 977 + wall * 53 + i * 29 + 3) | 0) < imgChance;
        if (isImg) {
          const idx = Math.floor(hash((k * 401 + wall * 89 + i * 13 + 7) | 0) * nImgs) % nImgs;
          const im = imageAt(idx);
          if (im && im.width) imgQuad(im, A, B, C, D);
          else {
            ctx.fillStyle = pal[Math.floor(hash((k + i) | 0) * pal.length) % pal.length] || '#333';
            quad(A, B, C, D);
            ctx.fill();
          }
        } else {
          ctx.fillStyle = pal[Math.floor(hash((k * 311 + wall * 7 + i * 101) | 0) * pal.length) % pal.length] || '#333';
          quad(A, B, C, D);
          ctx.fill();
        }
      }
    };
    drawWall(0);
    drawWall(1);
    drawWall(2, -HW);
    drawWall(3, HW);

    // ---- wireframe: far ring + longitudinal lines of this segment ----
    if (lineA > 0.01) {
      ctx.strokeStyle = p.lineColor || '#B0B0B0';
      ctx.globalAlpha = alpha * lineA;
      ctx.lineWidth = Math.max(0.5, (f / zF) * 0.004);
      // far ring rectangle
      const r0 = project(-HW, -HH, zF);
      const r1 = project(HW, -HH, zF);
      const r2 = project(HW, HH, zF);
      const r3 = project(-HW, HH, zF);
      quad(r0, r1, r2, r3);
      ctx.stroke();
      // longitudinal lines (near → far) at grid nodes
      ctx.beginPath();
      for (let i = 0; i <= cols; i++) {
        const x = -HW + i * colW;
        let a = project(x, -HH, zN);
        let b = project(x, -HH, zF);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        a = project(x, HH, zN);
        b = project(x, HH, zF);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      for (let j = 0; j <= rows; j++) {
        const y = -HH + j * rowH;
        let a = project(-HW, y, zN);
        let b = project(-HW, y, zF);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
        a = project(HW, y, zN);
        b = project(HW, y, zF);
        ctx.moveTo(a[0], a[1]);
        ctx.lineTo(b[0], b[1]);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
}
