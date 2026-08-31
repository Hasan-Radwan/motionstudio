import { TAU } from '../engine/easing.js';

const DEG = Math.PI / 180;
const FOV = 50; // vertical field of view, matching the source component

export const meta = {
  id: 'rotundaCarousel01',
  name: 'Rotunda Carousel 01',
  category: 'Carousel & Flow',
  aspect: '16:9',
  media: { default: 8, min: 1, max: 16 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Panels', min: 4, max: 16, step: 1, default: 8 },
  { key: 'panelWidth', type: 'range', label: 'Width', min: 600, max: 3000, step: 10, default: 2000 },
  { key: 'panelHeight', type: 'range', label: 'Height', min: 400, max: 2400, step: 10, default: 1340 },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 600, step: 5, default: 0 },
  { key: 'distance', type: 'range', label: 'Distance', min: 0, max: 90, step: 1, default: 90, unit: '%' },
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
];

// A rotunda: pictures hung on a cylinder wall, seen from INSIDE. The camera sits
// near the back of the ring (Distance) and looks across it, so the panel dead
// ahead is FARTHEST (smaller) and the ones to the sides are nearer (taller) —
// the wall bows toward you. Ported from the WebGL Rotunda Carousel, the pointer
// drag replaced by a steady auto-spin (default right→left). Each panel is warped
// onto the curved wall with perspective vertical strips. Seamless: `turns` is an
// integer number of revolutions per loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const n = count;
  if (n < 1) return;
  const R = 1;
  const dist = Math.min(0.9, Math.max(0, p.distance / 100)) * R;
  const pw = Math.max(1, p.panelWidth);
  const ph = Math.max(1, p.panelHeight);
  const gp = Math.max(0, p.gap);
  const circum = Math.max(1, n * (pw + gp));
  const itemArc = TAU / n;
  const span = Math.min(itemArc, (TAU * pw) / circum); // arc the picture covers
  const worldH = (TAU * ph) / circum;
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

  // camera at (0,0,dist), looking down -z; returns clip-w and screen point.
  const project = (x, y, z) => {
    const rz = z - dist;
    const qy = y * cP - rz * sP;
    const qz = y * sP + rz * cP;
    const wc = -qz; // >0 = in front of the camera
    if (wc <= 0.01) return null;
    return [cx + ((x * focal) / aspect / wc) * hw, cy - ((y === 0 ? qy : qy) * focal) / wc * hh, wc];
  };

  const S = 22; // perspective strips per panel

  for (let i = 0; i < n; i++) {
    const im = imageAt(i);
    const arc0 = i * itemArc + yaw + (itemArc - span) / 2;
    for (let s = 0; s < S; s++) {
      const thL = arc0 + (s / S) * span;
      const thR = arc0 + ((s + 1) / S) * span;
      const sinL = Math.sin(thL);
      const cosL = Math.cos(thL);
      const sinR = Math.sin(thR);
      const cosR = Math.cos(thR);
      const TL = project(R * sinL, halfH, R * cosL);
      const TR = project(R * sinR, halfH, R * cosR);
      const BL = project(R * sinL, -halfH, R * cosL);
      const BR = project(R * sinR, -halfH, R * cosR);
      if (!TL || !TR || !BL || !BR) continue; // strip crosses behind the camera
      // Near the camera plane the wall shoots off to the periphery and stretches
      // to near-infinite height (far outside the frame). Drop those grazing strips.
      if (Math.min(TL[2], TR[2], BL[2], BR[2]) < 0.5) continue;

      const xA = (TL[0] + BL[0]) / 2; // screen x at thL edge
      const xB = (TR[0] + BR[0]) / 2; // screen x at thR edge
      // On the back wall, screen-x runs OPPOSITE to θ, so the strip can be wound
      // either way. Normalise to a left→right rect and, when reversed, read the
      // mirror-image source column so the picture stays upright (not flipped).
      const rev = xB < xA;
      const xL = rev ? xB : xA;
      const bw = Math.abs(xB - xA);
      if (bw <= 0.05) continue; // edge-on / degenerate
      const topY = (TL[1] + TR[1]) / 2;
      const botY = (BL[1] + BR[1]) / 2;
      const bh = botY - topY;
      if (bh <= 0.2) continue;

      const dw = bw + 0.7; // slight overdraw hides the seams between strips
      ctx.save();
      ctx.beginPath();
      ctx.rect(xL, topY, dw, bh);
      ctx.clip();
      if (im && im.width) {
        const srcW = im.width / S;
        const col = rev ? S - 1 - s : s;
        ctx.drawImage(im, srcW * col, 0, srcW, im.height, xL, topY, dw, bh);
      } else {
        ctx.fillStyle = `hsl(${(i * 40 + 210) % 360}, 32%, 44%)`;
        ctx.fillRect(xL, topY, dw, bh);
      }

      // grazing shade — dim the wall as it turns edge-on to the eye
      const thM = (thL + thR) / 2;
      const px = R * Math.sin(thM);
      const pz = R * Math.cos(thM);
      let tx = -px;
      let tz = dist - pz;
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
