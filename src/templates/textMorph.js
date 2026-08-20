import { drawImageCover } from '../engine/canvasUtils.js';
import { easeInOut, clamp } from '../engine/easing.js';

export const meta = {
  id: 'textMorph',
  name: 'Text Morph',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'words', type: 'text', label: 'Words', rows: 3, default: 'TEXT\nMORPH', placeholder: 'one word per line' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 6, max: 40, step: 1, default: 18, unit: '%' },
  {
    key: 'weight',
    type: 'select',
    label: 'Weight',
    default: '700',
    options: [
      { value: '400', label: 'Regular' },
      { value: '600', label: 'Semibold' },
      { value: '700', label: 'Bold' },
      { value: '800', label: 'Extrabold' },
    ],
  },
  { key: 'color', type: 'color', label: 'Text color', default: '#FFFFFF' },
  { key: 'hold', type: 'range', label: 'Hold', min: 0, max: 90, step: 1, default: 45, unit: '%' },
  {
    key: 'bg',
    type: 'select',
    label: 'Background',
    default: 'color',
    options: [
      { value: 'color', label: 'Color' },
      { value: 'image', label: 'Image' },
    ],
  },
  { key: 'bgColor', type: 'color', label: 'Background color', default: '#0A1622' },
];

// Adapted from the "Text Morph" component: cycle through a list of words, each
// blur-morphing (blur + scale + fade) into the next. Pure Canvas2D so preview and
// export match. Background is a solid COLOUR by default, or the uploaded IMAGE.
// Seamless: word index advances with t and wraps at t=1 back to the first word.
function drawWord(ctx, word, size, opacity, scale, blur) {
  if (opacity <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = clamp(opacity, 0, 1);
  ctx.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : 'none';
  ctx.scale(scale, scale);
  ctx.fillText(word, 0, size * 0.02);
  ctx.restore();
}

export function render(ctx, t, p, { imageAt, w, h }) {
  const min = Math.min(w, h);

  // ---- background: colour (default) or the uploaded image ----
  if (p.bg === 'image') {
    const img = imageAt(0);
    if (img && img.width) drawImageCover(ctx, img, 0, 0, w, h);
    else {
      ctx.fillStyle = p.bgColor || '#0A1622';
      ctx.fillRect(0, 0, w, h);
    }
  } else {
    ctx.fillStyle = p.bgColor || '#0A1622';
    ctx.fillRect(0, 0, w, h);
  }

  const words = String(p.words || '')
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!words.length) return;

  const size = min * (p.fontSize / 100);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${p.weight || 700} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.fillStyle = p.color || '#FFFFFF';
  ctx.translate(w / 2, h / 2);

  const n = words.length;
  if (n === 1) {
    drawWord(ctx, words[0], size, 1, 1, 0);
    ctx.restore();
    return;
  }

  const g = t * n; // 0..n, wraps at t=1
  const cur = Math.floor(g) % n;
  const nxt = (cur + 1) % n;
  const frac = g - Math.floor(g);
  const hold = clamp((p.hold ?? 45) / 100, 0, 0.95);
  // te: held at 0 during the hold window, then eased 0→1 across the morph.
  const te = frac <= hold ? 0 : easeInOut((frac - hold) / (1 - hold));

  // current word morphs OUT (fade + grow + blur); next word morphs IN.
  drawWord(ctx, words[cur], size, 1 - te, 1 + 0.2 * te, 20 * te);
  drawWord(ctx, words[nxt], size, te, 0.8 + 0.2 * te, 20 * (1 - te));

  ctx.restore();
}
