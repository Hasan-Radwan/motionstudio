import { drawImageCover } from '../engine/canvasUtils.js';
import { TAU } from '../engine/easing.js';

export const meta = {
  id: 'videoText',
  name: 'Video Text',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'text', type: 'text', label: 'Text', rows: 2, default: 'VIDEO', placeholder: 'your text' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 10, max: 60, step: 1, default: 34, unit: '%' },
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
  { key: 'motion', type: 'range', label: 'Motion', min: 0, max: 100, step: 1, default: 40, unit: '%' },
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
  { key: 'bgColor', type: 'color', label: 'Background color', default: '#0A1622' },
];

// Reusable scratch canvas for the text mask (created once, resized on demand).
let _mask = null;
function getMask(w, h) {
  if (!_mask) {
    _mask = typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : document.createElement('canvas');
  }
  if (_mask.width !== w || _mask.height !== h) {
    _mask.width = w;
    _mask.height = h;
  }
  return _mask;
}

// "Video Text": the uploaded image plays INSIDE the text — the letters act as a
// window onto the media, everything else is a solid colour (or transparent). A
// slow, seamless pan + zoom on the image reads like video showing through the
// text. Adapted from the supplied VideoText component to the image-based engine.
export function render(ctx, t, p, { imageAt, w, h }) {
  const img = imageAt(0);

  // 1) Draw the media full-frame with a gentle, looping Ken-Burns motion.
  const m = (p.motion || 0) / 100;
  const zoom = 1.08 + 0.08 * m + 0.05 * m * Math.sin(t * TAU);
  const panX = Math.sin(t * TAU) * w * 0.035 * m;
  const panY = Math.cos(t * TAU) * h * 0.03 * m;
  ctx.save();
  const dw = w * zoom;
  const dh = h * zoom;
  if (img && img.width) {
    drawImageCover(ctx, img, (w - dw) / 2 + panX, (h - dh) / 2 + panY, dw, dh);
  } else {
    ctx.fillStyle = '#2a2f3a';
    ctx.fillRect(0, 0, w, h);
  }

  // 2) Build the text mask on a scratch canvas, then keep the media only where
  //    the glyphs are (destination-in with the whole mask supports multi-line).
  const size = Math.min(w, h) * (p.fontSize / 100);
  const mask = getMask(w, h);
  const mc = mask.getContext('2d');
  mc.setTransform(1, 0, 0, 1, 0, 0);
  mc.clearRect(0, 0, w, h);
  mc.fillStyle = '#fff';
  mc.textAlign = 'center';
  mc.textBaseline = 'middle';
  mc.font = `${p.weight || 800} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
  const lines = String(p.text || '').split(/\r?\n/).filter((l) => l.length);
  const lineH = size * 1.04;
  const total = lineH * (lines.length - 1);
  lines.forEach((ln, i) => mc.fillText(ln, w / 2, h / 2 + i * lineH - total / 2));
  ctx.globalCompositeOperation = 'destination-in';
  ctx.drawImage(mask, 0, 0);

  // 3) Fill the background behind the masked text (colour, or leave transparent).
  if (p.bg !== 'none') {
    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = p.bgColor || '#0A1622';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.restore();
}
