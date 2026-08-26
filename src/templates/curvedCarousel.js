import { drawCard, drawImageContain, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'curvedCarousel',
  name: 'Curved Carousel',
  category: 'Carousel & Flow',
  pro: true, // Pro-only template (gated on selection; badged in the gallery)
  media: { default: 6, min: 1, max: 12 },
};

export const controls = [
  { key: 'size', type: 'range', label: 'Poster size', min: 18, max: 55, step: 1, default: 30, unit: '%' },
  { key: 'speed', type: 'range', label: 'Speed', min: 1, max: 4, step: 1, default: 1 },
  // Signed curve: + bends backward (peak at the centre, ∩), − bends forward
  // (dip at the centre, ∪), 0 is a flat line.
  { key: 'arc', type: 'range', label: 'Arc depth (in/out)', min: -100, max: 100, step: 1, default: 45, unit: '%' },
  { key: 'centerScale', type: 'range', label: 'Center zoom', min: 100, max: 150, step: 1, default: 122, unit: '%' },
  { key: 'dof', type: 'range', label: 'Edge blur (depth)', min: 0, max: 100, step: 1, default: 55, unit: '%' },
  { key: 'tilt', type: 'range', label: 'Side tilt', min: 0, max: 60, step: 1, default: 28, unit: '°' },
  { key: 'radius', type: 'range', label: 'Corners', min: 0, max: 50, step: 1, default: 12, unit: '%' },
  // Shift the whole carousel row (posters only; the foreground subject stays put).
  { key: 'posX', type: 'range', label: 'Position X', min: -50, max: 50, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -50, max: 50, step: 1, default: 0, unit: '%' },
  // Foreground subject (a static PNG cutout drawn in front — the first image is
  // pulled out of the carousel and pinned). Its slot is fixed to 1, so there is
  // no visible "slot" control; position it with size / X / Y.
  { key: 'fgSize', type: 'range', label: 'Foreground size', min: 30, max: 100, step: 1, default: 72, unit: '%' },
  { key: 'fgX', type: 'range', label: 'Foreground X', min: 0, max: 100, step: 1, default: 50, unit: '%' },
  { key: 'fgY', type: 'range', label: 'Foreground Y', min: 40, max: 100, step: 1, default: 100, unit: '%' },
];

const smooth = (x) => x * x * (3 - 2 * x); // smoothstep 0..1

// A 3D-curved poster carousel: posters ride a convex arc and stream left → right
// in a seamless loop. The poster crossing the centre scales up and is sharp,
// while posters toward the edges shrink, tilt away, blur (depth of field) and
// fade out — then a static foreground subject (a cut-out PNG) is pinned on top.
// Seamless because each poster's track phase is periodic in t and `speed` is an
// integer number of full passes per loop.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const min = Math.min(w, h);

  // Split slots into the pinned foreground and the carousel posters. The
  // foreground slot is fixed to the first image (the "slot" control is hidden);
  // p.fg is still honoured if an older project saved a value.
  const fgSlot = p.fg == null ? 1 : p.fg;
  const fgIndex = fgSlot > 0 ? (fgSlot - 1) % count : -1;
  const posters = [];
  for (let i = 0; i < count; i++) if (i !== fgIndex) posters.push(i);
  const pc = posters.length;

  if (pc > 0) {
    const ref = imageAt(posters[0]);
    const imgR = ref && ref.width ? ref.width / ref.height : 0.72; // posters skew portrait
    const cardW = (w * p.size) / 100;
    const cardH = cardW / imgR;
    const pad = cardW * 0.85; // off-screen runway so posters enter/exit fully
    const cy = h * 0.52;
    const curve = p.arc / 100; // −1..1 — signed depth of the arc (see below)
    const depthK = 0.55; // how strongly the arc's depth scales the posters
    const centerZoom = p.centerScale / 100;
    const tiltMax = (p.tilt * Math.PI) / 180;
    const maxBlur = (p.dof / 100) * min * 0.022;
    const r = cornerR(p.radius, cardW, cardH);
    const offX = ((p.posX || 0) / 100) * w; // whole-carousel offset (posters only)
    const offY = ((p.posY || 0) / 100) * h;

    const items = [];
    for (let k = 0; k < pc; k++) {
      const u = (((k / pc + t * p.speed) % 1) + 1) % 1; // 0..1 track phase (L→R)
      const x = -pad + u * (w + 2 * pad);
      const fx = x / w; // 0..1 across the visible frame
      const d = (fx - 0.5) * 2; // -1 (left) .. +1 (right), 0 at centre
      const dd = d * d;
      const centerness = Math.max(0, 1 - Math.abs(d));
      const eased = smooth(centerness);
      // Arc depth. +curve pushes the edge posters BACK (convex — the row bows
      // toward the viewer at the centre, edges wrapping away, like the reference);
      // −curve pulls the edges FORWARD (concave — the row cups around the subject).
      const z = curve * dd; // −1 (near) .. +1 (far), 0 at the centre
      const persp = Math.max(0.45, Math.min(1.7, 1 / (1 + z * depthK)));
      let scale = (0.72 + 0.28 * eased) * persp;
      scale *= 1 + (centerZoom - 1) * eased; // extra emphasis on the centred poster
      const y = cy - z * min * 0.05; // posters further along the arc ride a touch higher
      // rotate toward the centre; the deeper the arc, the harder the edges turn in
      const ang = -d * (tiltMax + Math.abs(curve) * 0.5);
      const blur = maxBlur * (1 - eased);
      let alpha = 1;
      if (fx < 0.08) alpha = smooth(Math.max(0, fx / 0.08));
      else if (fx > 0.92) alpha = smooth(Math.max(0, (1 - fx) / 0.08));
      items.push({ x, y, z, scale, ang, blur, alpha, eased, idx: posters[k] });
    }
    // draw the farthest posters first so nearer (bigger) ones land on top
    items.sort((a, b) => b.z - a.z || a.eased - b.eased);

    for (const it of items) {
      if (it.alpha <= 0.01) continue;
      const cw = cardW * it.scale;
      const ch = cardH * it.scale;
      ctx.save();
      ctx.globalAlpha = it.alpha;
      ctx.translate(it.x + offX, it.y + offY);
      ctx.transform(Math.cos(it.ang), Math.sin(it.ang) * 0.14, 0, 1, 0, 0);
      if (it.blur > 0.15) ctx.filter = `blur(${it.blur.toFixed(2)}px)`;
      drawCard(ctx, imageAt(it.idx), -cw / 2, -ch / 2, cw, ch, {
        r,
        shadowBlur: min * 0.05 * it.scale,
        shadowColor: 'rgba(0,0,0,0.5)',
        shadowY: min * 0.02,
        shine: false,
      });
      ctx.restore();
    }
  }

  // ---- static foreground subject (sharp, pinned in front of everything) ----
  if (fgIndex >= 0) {
    const fg = imageAt(fgIndex);
    if (fg && fg.width) {
      const fw = (w * p.fgSize) / 100;
      const fh = fw / (fg.width / fg.height);
      const cxFg = w * ((p.fgX ?? 50) / 100);
      const bottom = h * (p.fgY / 100);
      drawImageContain(ctx, fg, cxFg - fw / 2, bottom - fh, fw, fh);
    }
  }
}
