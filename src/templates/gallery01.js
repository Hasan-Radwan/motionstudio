import { drawImageCover, roundedRectPath, cornerR } from '../engine/canvasUtils.js';

export const meta = {
  id: 'gallery01',
  name: 'Gallery01',
  category: 'Carousel & Flow',
  pro: true, // Pro template: usable in the preview, gated at export (see main.js)
  duration: 6,
  media: { default: 8, min: 3, max: 16 },
};

export const controls = [
  { key: 'imgSize', type: 'range', label: 'Image size', min: 26, max: 70, step: 1, default: 44, unit: '%' },
  { key: 'imgRadius', type: 'range', label: 'Image corners', min: 0, max: 50, step: 1, default: 10, unit: '%' },
  { key: 'buttonCount', type: 'range', label: 'Buttons', min: 3, max: 12, step: 1, default: 7 },
  { key: 'buttonSize', type: 'range', label: 'Button size', min: 5, max: 16, step: 1, default: 9, unit: '%' },
  { key: 'buttonRadius', type: 'range', label: 'Button roundness', min: 0, max: 100, step: 1, default: 100, unit: '%' },
  { key: 'curve', type: 'range', label: 'Curve', min: 1, max: 10, step: 1, default: 5 },
  { key: 'gap', type: 'range', label: 'Gap', min: 0, max: 10, step: 0.5, default: 3, unit: '%' },
  { key: 'cycles', type: 'range', label: 'Cycles', min: 1, max: 3, step: 1, default: 1 },
  { key: 'posX', type: 'range', label: 'Position X', min: -40, max: 40, step: 1, default: 0, unit: '%' },
  { key: 'posY', type: 'range', label: 'Position Y', min: -40, max: 40, step: 1, default: 0, unit: '%' },
];

const mod = (i, n) => (((i % n) + n) % n);
const easeCubicInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);

// A "button carousel" gallery: a large hero image up top, and a curved strip of
// circular thumbnail buttons along an arc below it — the active thumbnail sits at
// the centre. Ported from the Originkit React component, but the mouse-driven
// selection is replaced by AUTOMATIC motion: the carousel holds on each item then
// eases to the next, cycling through all images. Seamless: over the loop it
// advances an integer number of full item-cycles.
export function render(ctx, t, p, { imageAt, count, w, h }) {
  const M = count;
  if (M < 1) return;
  const min = Math.min(w, h);
  const offX = (w * (p.posX || 0)) / 100;
  const offY = (h * (p.posY || 0)) / 100;

  // --- automatic position: hold on each item, then cubic-ease to the next ---
  const cyc = Math.max(1, Math.round(p.cycles || 1));
  const raw = t * M * cyc;
  const stepIdx = Math.floor(raw);
  const ph = raw - stepIdx;
  const hold = 0.45; // fraction of each step spent resting on the item
  const eph = ph < hold ? 0 : easeCubicInOut((ph - hold) / (1 - hold));
  const pos = stepIdx + eph; // continuous, eased
  const base = Math.floor(pos);
  const frac = pos - base;
  const curIdx = mod(base, M);
  const nextIdx = mod(base + 1, M);

  // ---- hero image (cross-fade swipe between current and next) ----
  const iw = min * (p.imgSize / 100);
  const ih = iw; // square hero, matching the source design
  const cx = w / 2 + offX;
  const heroCy = h * 0.3 + offY;
  const rad = cornerR(p.imgRadius, iw, ih);
  const sweep = iw * 0.85;
  const dip = ih * 0.45;

  const drawHero = (idx, dx, dy, alpha, scale) => {
    const im = imageAt(idx);
    if (!im || !im.width || alpha <= 0.01) return;
    const dw = iw * scale;
    const dh = ih * scale;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(cx + dx, heroCy + dy);
    roundedRectPath(ctx, -dw / 2, -dh / 2, dw, dh, rad * scale);
    ctx.clip();
    drawImageCover(ctx, im, -dw / 2, -dh / 2, dw, dh);
    ctx.restore();
  };
  // current slides out to the left; next slides in from the right (both dip down)
  drawHero(curIdx, -frac * sweep, frac * dip, 1 - frac, 1 - 0.18 * frac);
  drawHero(nextIdx, (1 - frac) * sweep, (1 - frac) * dip, frac, 0.82 + 0.18 * frac);

  // ---- curved button strip ----
  const bs = min * (p.buttonSize / 100);
  const gap = min * (p.gap / 100);
  const tCurve = Math.max(0.0001, Math.min(1, (p.curve || 5) / 10));
  const dPsi = ((Math.PI * 2) / M) * tCurve;
  const step = bs + gap;
  const R = step / (2 * Math.sin(dPsi / 2));
  const half = Math.floor(Math.min(Math.max(1, p.buttonCount), M) / 2);
  const fadeInner = Math.max(0, half - 0.4);
  const fadeEnd = half + 0.6;
  const buffer = half + 1;
  const stripCx = w / 2 + offX;
  const stripTop = h * 0.6 + offY;
  const centerIdx = Math.round(pos);

  const buttons = [];
  for (let s = -buffer; s <= buffer; s++) {
    const idx = mod(centerIdx + s, M);
    let slot = idx - pos;
    slot = mod(slot, M);
    if (slot > M / 2) slot -= M;
    const absSlot = Math.abs(slot);
    if (absSlot >= fadeEnd) continue;
    const angle = slot * dPsi;
    const bx = R * Math.sin(angle);
    const by = R * (1 - Math.cos(angle));
    const depth = Math.max(0, 1 - (0.55 * absSlot) / Math.max(1, half));
    const scale = 0.55 + 0.45 * depth;
    const opacity =
      absSlot <= fadeInner ? 1 : 1 - (absSlot - fadeInner) / (fadeEnd - fadeInner);
    buttons.push({ idx, bx, by, scale, opacity, depth, active: absSlot < 0.5 });
  }
  buttons.sort((a, b) => a.depth - b.depth); // far first, centre last (on top)

  for (const b of buttons) {
    if (b.opacity <= 0.01) continue;
    const d = bs * b.scale;
    const br = cornerR(p.buttonRadius, d, d);
    const im = imageAt(b.idx);
    ctx.save();
    ctx.globalAlpha = b.opacity;
    ctx.translate(stripCx + b.bx, stripTop + b.by);
    ctx.save();
    roundedRectPath(ctx, -d / 2, -d / 2, d, d, br);
    ctx.clip();
    if (im && im.width) drawImageCover(ctx, im, -d / 2, -d / 2, d, d);
    else {
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-d / 2, -d / 2, d, d);
    }
    if (!b.active) {
      ctx.fillStyle = 'rgba(8,10,14,0.32)'; // dim inactive buttons
      ctx.fillRect(-d / 2, -d / 2, d, d);
    }
    ctx.restore();
    if (b.active) {
      roundedRectPath(ctx, -d / 2, -d / 2, d, d, br);
      ctx.lineWidth = Math.max(1, d * 0.05);
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
    }
    ctx.restore();
  }
}
