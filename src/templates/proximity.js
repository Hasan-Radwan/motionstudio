import { drawCard, cornerR, withAlpha } from '../engine/canvasUtils.js';
import { TAU, seeded, clamp } from '../engine/easing.js';

export const meta = {
  id: 'proximity',
  name: 'Proximity Field',
  category: 'Stack & Scatter',
  media: { default: 24, min: 1, max: 60 },
};

export const controls = [
  { key: 'count', type: 'range', label: 'Count', min: 6, max: 60, step: 1, default: 26 },
  { key: 'size', type: 'range', label: 'Card size', min: 6, max: 22, step: 1, default: 12, unit: '%' },
  { key: 'panRange', type: 'range', label: 'Pan range', min: 10, max: 90, step: 1, default: 55, unit: '%' },
  { key: 'speed', type: 'range', label: 'Speed', min: 1, max: 4, step: 1, default: 1 },
  { key: 'radius', type: 'range', label: 'Proximity radius', min: 10, max: 60, step: 1, default: 30, unit: '%' },
  { key: 'attraction', type: 'range', label: 'Attraction', min: 0, max: 100, step: 1, default: 40, unit: '%' },
  { key: 'repulsion', type: 'range', label: 'Repulsion', min: 0, max: 100, step: 1, default: 0, unit: '%' },
  { key: 'scaleBoost', type: 'range', label: 'Scale', min: 0, max: 120, step: 1, default: 45, unit: '%' },
  { key: 'rotation', type: 'range', label: 'Rotation', min: 0, max: 90, step: 1, default: 20, unit: '°' },
  { key: 'sizeMix', type: 'range', label: 'Size mix', min: 0, max: 100, step: 1, default: 40, unit: '%' },
  { key: 'fade', type: 'range', label: 'Fade', min: 0, max: 100, step: 1, default: 35, unit: '%' },
  { key: 'corners', type: 'range', label: 'Corners', min: 0, max: 40, step: 1, default: 10, unit: '%' },
];

// Proximity / magnetic field: a drifting cloud of cards that react to HOW CLOSE
// they are to one another. For every pair, influence = 1 - clamp(d/radius): near
// neighbours pull together (or push apart), grow, rotate and brighten — so the
// group reads as a magnetic interaction rather than independent motion.
//
//   d          = distance(A, B)
//   influence  = 1 - clamp(d / radius, 0, 1)
//   scale      = baseScale + Σ influence · scaleBoost
//   rotation   =            Σ influence · rotationAmount
//   offset     =            Σ influence · (attraction − repulsion) · direction
//
// Base positions ride seamless looping (integer-frequency) paths, and every
// reaction is a pure function of those positions, so the whole thing loops.
export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);
  const n = Math.round(p.count);
  const cardW = (w * p.size) / 100;
  const cx = w / 2;
  const cy = h / 2;
  const panX = (w * p.panRange) / 100 / 2;
  const panY = (h * p.panRange) / 100 / 2;
  const speed = Math.max(1, Math.round(p.speed));
  const radius = min * (p.radius / 100);
  const attraction = p.attraction / 100;
  const repulsion = p.repulsion / 100;
  const scaleBoost = p.scaleBoost / 100;
  const rotAmt = (p.rotation || 0) * (Math.PI / 180);
  const sizeMix = p.sizeMix / 100;
  const fade = p.fade / 100;

  // --- seamless drifting base positions (Lissajous with integer frequencies) ---
  const rnd = seeded(1337);
  const base = [];
  for (let i = 0; i < n; i++) {
    const fx = (1 + Math.floor(rnd() * 3)) * speed; // integer freq → loops at t=1
    const fy = (1 + Math.floor(rnd() * 3)) * speed;
    const px = rnd() * TAU;
    const py = rnd() * TAU;
    const sz = 1 - sizeMix * rnd(); // per-card base size variety (Size mix)
    base.push({
      x: cx + panX * Math.sin(fx * t * TAU + px),
      y: cy + panY * Math.sin(fy * t * TAU + py),
      sz,
    });
  }

  // --- pairwise proximity reactions (O(n²); n capped at 60) ---
  const out = [];
  for (let i = 0; i < n; i++) {
    const bi = base[i];
    let ox = 0;
    let oy = 0;
    let infl = 0;
    let rot = 0;
    for (let j = 0; j < n; j++) {
      if (j === i) continue;
      const bj = base[j];
      const dx = bj.x - bi.x;
      const dy = bj.y - bi.y;
      const d = Math.hypot(dx, dy);
      if (d >= radius) continue;
      const w0 = 1 - clamp(d / radius, 0, 1); // influence
      infl += w0;
      const inv = d > 0.001 ? 1 / d : 0;
      const ux = dx * inv;
      const uy = dy * inv;
      // attraction pulls toward the neighbour, repulsion pushes away
      const pull = w0 * (attraction - repulsion) * radius * 0.5;
      ox += ux * pull;
      oy += uy * pull;
      // signed rotation from the neighbour's side
      rot += w0 * rotAmt * Math.sign(dx || 1);
    }
    const scale = bi.sz * (1 + infl * scaleBoost);
    // fade idles: cards with no nearby neighbour dim by `fade`, active ones pop
    const opacity = 1 - fade * (1 - clamp(infl, 0, 1));
    out.push({ x: bi.x + ox, y: bi.y + oy, scale, rot, opacity, infl, idx: i });
  }
  out.sort((a, b) => a.infl - b.infl); // most-influenced (biggest) painted on top

  for (const it of out) {
    const cw = cardW * it.scale;
    const ch = cw / ((imageAt(it.idx) && imageAt(it.idx).width ? imageAt(it.idx).width / imageAt(it.idx).height : 1));
    if (cw < 1 || it.opacity <= 0.01) continue;
    ctx.save();
    ctx.globalAlpha = clamp(it.opacity, 0, 1);
    ctx.translate(it.x, it.y);
    ctx.rotate(it.rot);
    drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
      r: cornerR(p.corners, cw, ch),
      shadowBlur: min * 0.03 * it.scale,
      shadowColor: withAlpha('#000000', 0.4 * clamp(it.opacity, 0, 1)),
      shadowY: min * 0.01,
      shine: false,
    });
    ctx.restore();
  }
}
