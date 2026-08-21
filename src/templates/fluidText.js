import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'fluidText',
  name: 'Fluid Text',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 2, default: 'FLUID\nTEXT', placeholder: 'your text' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 8, max: 40, step: 1, default: 24, unit: '%' },
  {
    key: 'weight',
    type: 'select',
    label: 'Weight',
    default: '800',
    options: [
      { value: '600', label: 'Semibold' },
      { value: '700', label: 'Bold' },
      { value: '800', label: 'Extrabold' },
      { value: '900', label: 'Black' },
    ],
  },
  { key: 'baseColor', type: 'color', label: 'Base color', default: '#0A1622' },
  { key: 'c1', type: 'color', label: 'Palette 1', default: '#A855F7' },
  { key: 'c2', type: 'color', label: 'Palette 2', default: '#EC4899' },
  { key: 'c3', type: 'color', label: 'Palette 3', default: '#3B82F6' },
  { key: 'c4', type: 'color', label: 'Palette 4', default: '#AFFF00' },
  { key: 'c5', type: 'color', label: 'Palette 5', default: '#00FFF5' },
  { key: 'blobs', type: 'range', label: 'Blobs', min: 3, max: 14, step: 1, default: 8 },
  { key: 'flow', type: 'range', label: 'Flow', min: 1, max: 4, step: 1, default: 1 },
  { key: 'blobSize', type: 'range', label: 'Blob size', min: 20, max: 120, step: 1, default: 62, unit: '%' },
  { key: 'softness', type: 'range', label: 'Softness', min: 0, max: 100, step: 1, default: 55, unit: '%' },
  {
    key: 'bg',
    type: 'select',
    label: 'Background',
    default: 'color',
    options: [
      { value: 'color', label: 'Color' },
      { value: 'none', label: 'Transparent' },
    ],
  },
  { key: 'bgColor', type: 'color', label: 'Background color', default: '#05070D' },
];

// Reusable scratch canvas for the text mask.
let _mask = null;
function getMask(w, h) {
  if (!_mask) _mask = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
  if (_mask.width !== w || _mask.height !== h) {
    _mask.width = w;
    _mask.height = h;
  }
  return _mask;
}

function hexToRgb(hex) {
  let s = String(hex || '#000').replace('#', '');
  if (s.length === 3) s = s.split('').map((c) => c + c).join('');
  const n = parseInt(s.slice(0, 6), 16) || 0;
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Cyclic palette lookup with linear interpolation, returns an rgb triple.
function paletteAt(pal, u) {
  const n = pal.length;
  const x = ((u % 1) + 1) % 1;
  const scaled = x * n;
  const i = Math.floor(scaled) % n;
  const f = scaled - Math.floor(scaled);
  const a = pal[i];
  const b = pal[(i + 1) % n];
  return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f];
}

// A Canvas2D homage to the WebGL "Fluid Text" fluid simulation: soft palette-
// coloured dye blobs drift and glow (additively, heavily blurred) INSIDE the text.
// Not a real fluid solver — the engine renders each frame as a pure function of
// loop time t and exports offline, so the blobs ride seamless looping paths
// instead, evoking the flowing-dye look while staying deterministic + seamless.
export function render(ctx, t, p, { w, h }) {
  const min = Math.min(w, h);
  const size = min * (p.fontSize / 100);
  const lines = String(p.text || '').split(/\r?\n/).filter((l) => l.length);
  if (!lines.length) {
    if (p.bg !== 'none') {
      ctx.fillStyle = p.bgColor || '#05070D';
      ctx.fillRect(0, 0, w, h);
    }
    return;
  }

  // ---- text mask (offscreen, supports multi-line) ----
  const mask = getMask(w, h);
  const mc = mask.getContext('2d');
  mc.setTransform(1, 0, 0, 1, 0, 0);
  mc.clearRect(0, 0, w, h);
  mc.fillStyle = '#fff';
  mc.textAlign = 'center';
  mc.textBaseline = 'middle';
  mc.font = `${p.weight || 800} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
  const lineH = size * 1.08;
  const total = lineH * (lines.length - 1);
  let maxW = 0;
  for (const ln of lines) maxW = Math.max(maxW, mc.measureText(ln).width);
  lines.forEach((ln, i) => mc.fillText(ln, w / 2, h / 2 + i * lineH - total / 2));

  // ---- flowing dye inside the text ----
  const pal = [p.c1, p.c2, p.c3, p.c4, p.c5].filter(Boolean).map(hexToRgb);
  if (!pal.length) pal.push([255, 255, 255]);
  const n = Math.round(p.blobs);
  const flow = Math.round(p.flow);
  const ampX = Math.max(maxW, size) * 0.5;
  const ampY = (total + lineH) * 0.55;
  const cx = w / 2;
  const cy = h / 2;
  const r0 = min * (p.blobSize / 100) * 0.5;
  const blurPx = min * (p.softness / 100) * 0.09;

  ctx.save();
  // base fill (dark) under the dye
  ctx.fillStyle = p.baseColor || '#0A1622';
  ctx.fillRect(0, 0, w, h);

  // dye blobs, additively blended and blurred → flowing glow
  ctx.globalCompositeOperation = 'lighter';
  if (blurPx > 0.2) ctx.filter = `blur(${blurPx.toFixed(1)}px)`;
  for (let i = 0; i < n; i++) {
    const fx = 1 + (i % 3); // integer freqs → seamless loop
    const fy = 1 + ((i + 1) % 3);
    const phx = (i / n) * TAU;
    const phy = (i * 1.7) % TAU;
    const bx = cx + ampX * Math.sin(fx * t * TAU + phx);
    const by = cy + ampY * Math.sin(fy * t * TAU + phy);
    const rr = r0 * (0.7 + 0.3 * Math.sin(t * TAU * flow + i)); // gentle breathing
    const col = paletteAt(pal, i / n + t * flow);
    const g = ctx.createRadialGradient(bx, by, 0, bx, by, rr);
    g.addColorStop(0, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0.9)`);
    g.addColorStop(1, `rgba(${col[0] | 0},${col[1] | 0},${col[2] | 0},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(bx - rr, by - rr, rr * 2, rr * 2);
  }
  ctx.filter = 'none';

  // keep only the text-shaped region, then drop the background behind it
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);
  if (p.bg !== 'none') {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = p.bgColor || '#05070D';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
