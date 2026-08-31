import { drawImageContain } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

const DEG = Math.PI / 180;
const FOV = 50; // vertical field of view

export const meta = {
  id: 'curvedCarousel04',
  name: 'Curved Carousel 04',
  category: 'Carousel & Flow',
  pro: true,
  aspect: '4:5',
  media: { default: 8, min: 2, max: 16 },
};

export const controls = [
  { key: 'panelWidth', type: 'range', label: 'Width', min: 400, max: 2400, step: 10, default: 1200 },
  { key: 'panelHeight', type: 'range', label: 'Height', min: 400, max: 2400, step: 10, default: 1600 },
  { key: 'size', type: 'range', label: 'Card size', min: 20, max: 150, step: 1, default: 100, unit: '%' },
  { key: 'gap', type: 'range', label: 'Gap', min: -600, max: 600, step: 5, default: 180 },
  { key: 'distance', type: 'range', label: 'Distance', min: 0, max: 90, step: 1, default: 72, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Tilt', min: -30, max: 30, step: 1, default: 0, unit: '°' },
  { key: 'turns', type: 'range', label: 'Turns', min: 1, max: 3, step: 1, default: 1 },
  {
    key: 'direction',
    type: 'select',
    label: 'Direction',
    default: 'rtl',
    options: [
      { value: 'rtl', label: 'Right to left' },
      { value: 'ltr', label: 'Left to right' },
    ],
  },
  { key: 'graze', type: 'range', label: 'Edge shade', min: 0, max: 100, step: 1, default: 42, unit: '%' },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  // Foreground subject (static PNG cut-out, first image) pinned in front — the
  // curved wall of cards sweeps BEHIND it.
  { key: 'fgSize', type: 'range', label: 'Foreground size', min: 30, max: 100, step: 1, default: 52, unit: '%' },
  { key: 'fgX', type: 'range', label: 'Foreground X', min: 0, max: 100, step: 1, default: 50, unit: '%' },
  { key: 'fgY', type: 'range', label: 'Foreground Y', min: 40, max: 100, step: 1, default: 96, unit: '%' },
];

// Curved Carousel 04 — the cards ride the inside of a rotunda cylinder (the same
// motion as Rotunda Carousel 01: the wall bows toward the eye, the card ahead is
// farthest/smaller, the sides nearer/taller) and sweep steadily behind a pinned
// foreground PNG cut-out (the first image). Each card is warped onto the curved
// wall with perspective vertical strips; the subject is drawn last, on top.
// Seamless because `turns` is an integer number of revolutions per loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  // First image is the pinned foreground subject; the rest are the wall cards.
  const fgIndex = 0;
  const posters = [];
  for (let i = 0; i < count; i++) if (i !== fgIndex) posters.push(i);
  const n = posters.length;

  if (n > 0) drawWall();
  drawSubject();

  function drawWall() {
    const R = 1;
    const dist = Math.min(0.9, Math.max(0, p.distance / 100)) * R;
    const pw = Math.max(1, p.panelWidth);
    const ph = Math.max(1, p.panelHeight);
    const gp = p.gap; // may be negative to overlap → glue cards edge-to-edge
    const circum = Math.max(1, n * (pw + gp));
    const itemArc = TAU / n;
    // `size` scales every card uniformly on the wall. The arc a card covers is
    // capped at itemArc so cards never overlap past touching (negative Gap just
    // pulls them together). Height follows the CAPPED width to keep the card
    // aspect fixed — which also prevents tall blow-ups at very negative Gap.
    const sz = Math.max(0.1, (p.size ?? 100) / 100);
    const span = Math.min(itemArc, ((TAU * pw) / circum) * sz); // arc the card covers
    const worldH = span * (ph / pw);
    const halfH = worldH / 2;
    const focal = 1 / Math.tan((FOV / 2) * DEG);
    const aspect = w / h;
    const pitch = (p.tilt || 0) * DEG;
    const dir = p.direction === 'rtl' ? -1 : 1;
    const yaw = t * TAU * Math.max(1, Math.round(p.turns)) * dir;
    const cx = w / 2 + (w * (p.posX || 0)) / 100;
    const cy = h / 2 + (h * (p.posY || 0)) / 100;
    const cP = Math.cos(pitch);
    const sP = Math.sin(pitch);
    const graze = p.graze / 100;
    const hw = w / 2;
    const hh = h / 2;

    const project = (x, y, z) => {
      const rz = z - dist;
      const qy = y * cP - rz * sP;
      const qz = y * sP + rz * cP;
      const wc = -qz; // >0 = in front of the camera
      if (wc <= 0.01) return null;
      return [cx + ((x * focal) / aspect / wc) * hw, cy - (qy * focal) / wc * hh, wc];
    };

    const S = 22; // perspective strips per card

    for (let j = 0; j < n; j++) {
      const im = imageAt(posters[j]);
      const arc0 = j * itemArc + yaw + (itemArc - span) / 2;
      for (let s = 0; s < S; s++) {
        const thL = arc0 + (s / S) * span;
        const thR = arc0 + ((s + 1) / S) * span;
        const TL = project(Math.sin(thL), halfH, Math.cos(thL));
        const TR = project(Math.sin(thR), halfH, Math.cos(thR));
        const BL = project(Math.sin(thL), -halfH, Math.cos(thL));
        const BR = project(Math.sin(thR), -halfH, Math.cos(thR));
        if (!TL || !TR || !BL || !BR) continue; // strip crosses behind the camera
        if (Math.min(TL[2], TR[2], BL[2], BR[2]) < 0.5) continue; // grazing blow-up

        const xA = (TL[0] + BL[0]) / 2;
        const xB = (TR[0] + BR[0]) / 2;
        const rev = xB < xA; // back-wall winding runs opposite to θ
        const xL = rev ? xB : xA;
        const bw = Math.abs(xB - xA);
        if (bw <= 0.05) continue;
        const topY = (TL[1] + TR[1]) / 2;
        const botY = (BL[1] + BR[1]) / 2;
        const bh = botY - topY;
        if (bh <= 0.2) continue;

        const dw = bw + 0.7;
        ctx.save();
        ctx.beginPath();
        ctx.rect(xL, topY, dw, bh);
        ctx.clip();
        if (im && im.width) {
          const srcW = im.width / S;
          const col = rev ? S - 1 - s : s;
          ctx.drawImage(im, srcW * col, 0, srcW, im.height, xL, topY, dw, bh);
        } else {
          ctx.fillStyle = `hsl(${(j * 40 + 210) % 360}, 32%, 44%)`;
          ctx.fillRect(xL, topY, dw, bh);
        }

        const thM = (thL + thR) / 2;
        let tx = -Math.sin(thM);
        let tz = dist - Math.cos(thM);
        const tl = Math.hypot(tx, tz) || 1;
        tx /= tl;
        tz /= tl;
        const face = Math.max(0, -Math.sin(thM) * tx + -Math.cos(thM) * tz);
        const shade = graze + (1 - graze) * face;
        if (shade < 0.999) {
          ctx.fillStyle = `rgba(0,0,0,${(1 - shade).toFixed(3)})`;
          ctx.fillRect(xL, topY, dw, bh);
        }
        ctx.restore();
      }
    }
  }

  // The pinned foreground subject (PNG cut-out), drawn last so the wall passes
  // behind it. Anchored by its bottom edge like the other Curved Carousels.
  function drawSubject() {
    const fg = imageAt(fgIndex);
    if (!fg || !fg.width) return;
    const fw = (w * p.fgSize) / 100;
    const fh = fw / (fg.width / fg.height);
    const cxFg = w * ((p.fgX ?? 50) / 100);
    const bottom = h * (p.fgY / 100);
    drawImageContain(ctx, fg, cxFg - fw / 2, bottom - fh, fw, fh);
  }
}
