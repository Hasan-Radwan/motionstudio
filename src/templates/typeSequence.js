import { roundedRectPath } from '../engine/canvasUtils.js';
import { clamp } from '../engine/easing.js';

export const meta = {
  id: 'typeSequence',
  name: 'Type Sequence',
  category: 'Text',
  media: { default: 1, min: 1, max: 1 },
};

export const controls = [
  { key: 'prefix', type: 'text', label: 'Prefix', rows: 1, default: '', placeholder: 'optional label' },
  { key: 'texts', type: 'text', label: 'Texts', rows: 3, default: 'TYPE SEQUENCE', placeholder: 'one phrase per line' },
  { key: 'fontSize', type: 'range', label: 'Font size', min: 6, max: 30, step: 1, default: 13, unit: '%' },
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
  { key: 'prefixColor', type: 'color', label: 'Prefix color', default: '#FFFFFF' },
  { key: 'color', type: 'color', label: 'Text color', default: '#FFFFFF' },
  { key: 'cursorColor', type: 'color', label: 'Cursor fill', default: '#FF8D00' },
  { key: 'cursorBorder', type: 'color', label: 'Cursor border', default: '#404040' },
  { key: 'cursorWidth', type: 'range', label: 'Cursor width', min: 3, max: 30, step: 1, default: 11, unit: '%' },
  { key: 'cursorHeight', type: 'range', label: 'Cursor height', min: 30, max: 110, step: 1, default: 62, unit: '%' },
  { key: 'hold', type: 'range', label: 'Hold', min: 0, max: 100, step: 1, default: 40, unit: '%' },
  { key: 'deleteSpeed', type: 'range', label: 'Delete speed', min: 20, max: 200, step: 5, default: 60, unit: '%' },
];

// Typewriter sequence: types each phrase out char-by-char, holds it (with a
// blinking cursor), deletes it, then moves to the next — adapted from the supplied
// Type Sequence component. The whole sequence is driven by loop time `t` so it
// runs seamlessly: the last phrase finishes deleting exactly as t wraps to 0.
export function render(ctx, t, p, { w, h }) {
  const min = Math.min(w, h);
  const size = min * (p.fontSize / 100);

  const words = String(p.texts || '')
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  if (!words.length) words.push('TYPE SEQUENCE');

  const holdUnits = 2 + (p.hold / 100) * 34; // chars-equivalent the phrase holds
  const delFactor = clamp(p.deleteSpeed / 100, 0.1, 3); // units per char when deleting

  // Build the timeline (in "char units") and locate the current moment.
  const segs = words.map((word) => {
    const len = word.length;
    const tType = len;
    const tDel = len * delFactor;
    return { word, len, tType, tHold: holdUnits, tDel, tot: tType + holdUnits + tDel };
  });
  const total = segs.reduce((s, x) => s + x.tot, 0) || 1;

  let gp = (((t % 1) + 1) % 1) * total;
  let seg = segs[0];
  for (const s of segs) {
    if (gp < s.tot) {
      seg = s;
      break;
    }
    gp -= s.tot;
  }

  let chars;
  let cursorOn = true;
  if (gp < seg.tType) {
    chars = clamp(Math.round(gp), 0, seg.len); // typing in
  } else if (gp < seg.tType + seg.tHold) {
    chars = seg.len; // holding — cursor blinks
    const hp = gp - seg.tType;
    cursorOn = Math.floor(hp / Math.max(1, seg.tHold / 6)) % 2 === 0;
  } else {
    const dp = (gp - seg.tType - seg.tHold) / delFactor; // deleting
    chars = clamp(seg.len - Math.floor(dp), 0, seg.len);
  }

  const disp = seg.word.slice(0, chars);
  const prefix = String(p.prefix || '').replace(/\r?\n/g, ' ');

  ctx.save();
  ctx.textBaseline = 'middle';
  ctx.textAlign = 'left';
  ctx.font = `${p.weight || 700} ${size}px "Cairo", "Tajawal", Inter, system-ui, -apple-system, "Segoe UI", sans-serif`;

  const gap = size * 0.09;
  const cw = size * (p.cursorWidth / 100);
  const chh = size * (p.cursorHeight / 100);
  const pfxW = prefix ? ctx.measureText(prefix).width : 0;
  const dispW = ctx.measureText(disp).width;
  const totalW = pfxW + dispW + gap + cw;

  const cx = w / 2;
  const cy = h / 2;
  let x = cx - totalW / 2; // centred composition

  if (prefix) {
    ctx.fillStyle = p.prefixColor || '#FFFFFF';
    ctx.fillText(prefix, x, cy);
    x += pfxW;
  }
  ctx.fillStyle = p.color || '#FFFFFF';
  ctx.fillText(disp, x, cy);
  x += dispW + gap;

  if (cursorOn) {
    const r = Math.min(cw, chh) * 0.18;
    roundedRectPath(ctx, x, cy - chh / 2, cw, chh, r);
    ctx.fillStyle = p.cursorColor || '#FF8D00';
    ctx.fill();
    ctx.lineWidth = Math.max(1, size * 0.02);
    ctx.strokeStyle = p.cursorBorder || '#404040';
    ctx.stroke();
  }
  ctx.restore();
}
