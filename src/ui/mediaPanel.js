// Frame (aspect ratio) + Media (per-slot image upload) panel.
// Rebuilt whenever the template, slot count, or a slot's image changes.
// Slot count adapts to each template's media config; images cycle across the
// template's cards (see Renderer.imageAt).

import { drawImageCover } from '../engine/canvasUtils.js';
import { t } from '../i18n.js';

const ASPECTS = ['16:9', '4:3', '1:1', '4:5', '9:16'];
const CARD_SHAPES = [
  { value: 'original', label: '▭', title: 'Original' },
  { value: 'landscape', label: '▬', title: 'Landscape' },
  { value: 'portrait', label: '▮', title: 'Portrait' },
  { value: 'square', label: '◻', title: 'Square' },
  { value: 'circle', label: '⬤', title: 'Circle' },
  { value: 'triangle', label: '▲', title: 'Triangle' },
];

function section(title) {
  const el = document.createElement('div');
  el.className = 'section-title';
  el.textContent = title;
  return el;
}

// Paint a small thumbnail of an image into a fixed-size canvas.
function paintThumb(canvas, img) {
  const W = (canvas.width = 96);
  const H = (canvas.height = 72);
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, W, H);
  if (img && img.width) {
    drawImageCover(ctx, img, 0, 0, W, H);
  }
}

export function buildMediaPanel(root, model, handlers) {
  root.innerHTML = '';
  const { count, min, max, slots, slotLabels } = model;
  const { onCount, onPick, onClear, onDropFile } = handlers;

  // ---------- MEDIA ----------
  const head = document.createElement('div');
  head.className = 'section-title with-count';
  head.innerHTML = `${t('Media')} <span class="count-badge">${count} ${
    count === 1 ? t('image') : t('images')
  }</span>`;
  root.appendChild(head);

  // stepper — only meaningful when the template supports more than one image
  if (max > min) {
    const stepper = document.createElement('div');
    stepper.className = 'stepper-row';
    const label = document.createElement('span');
    label.className = 'stepper-label';
    label.textContent = t('Number of images');
    const controls = document.createElement('div');
    controls.className = 'stepper';
    const minus = document.createElement('button');
    minus.className = 'step-btn';
    minus.textContent = '−';
    minus.disabled = count <= min;
    minus.addEventListener('click', () => onCount(count - 1));
    const num = document.createElement('span');
    num.className = 'step-num';
    num.textContent = count;
    const plus = document.createElement('button');
    plus.className = 'step-btn';
    plus.textContent = '+';
    plus.disabled = count >= max;
    plus.addEventListener('click', () => onCount(count + 1));
    controls.append(minus, num, plus);
    stepper.append(label, controls);
    root.appendChild(stepper);
  }

  // ---------- SLOTS ----------
  const list = document.createElement('div');
  list.className = 'slot-list';
  for (let i = 0; i < count; i++) {
    const entry = slots[i];
    const filled = !!(entry && entry.img);

    const row = document.createElement('div');
    row.className = 'slot' + (filled ? ' filled' : '');

    const thumb = document.createElement('div');
    thumb.className = 'slot-thumb';
    if (filled) {
      const cv = document.createElement('canvas');
      paintThumb(cv, entry.img);
      thumb.appendChild(cv);
    } else {
      thumb.innerHTML = '<span class="slot-plus">+</span>';
    }
    // click thumb (or empty row) to upload into this slot
    thumb.addEventListener('click', () => onPick(i));

    const meta = document.createElement('div');
    meta.className = 'slot-meta';
    const name = document.createElement('div');
    name.className = 'slot-name';
    // Templates may name specific slots (e.g. "Logo"); otherwise "Image N".
    name.textContent = slotLabels && slotLabels[i] ? t(slotLabels[i]) : `${t('Image')} ${i + 1}`;
    const sub = document.createElement('div');
    sub.className = 'slot-sub';
    sub.textContent = filled ? t('Click to replace') : t('Drop or click to add');
    meta.append(name, sub);
    meta.addEventListener('click', () => onPick(i));

    row.append(thumb, meta);

    if (filled) {
      const clear = document.createElement('button');
      clear.className = 'slot-clear';
      clear.title = t('Remove image');
      clear.textContent = '×';
      clear.addEventListener('click', (e) => {
        e.stopPropagation();
        onClear(i);
      });
      row.appendChild(clear);
    }

    // drag & drop onto the individual slot
    ['dragenter', 'dragover'].forEach((ev) =>
      row.addEventListener(ev, (e) => {
        e.preventDefault();
        row.classList.add('drop-hot');
      })
    );
    ['dragleave', 'drop'].forEach((ev) =>
      row.addEventListener(ev, (e) => {
        e.preventDefault();
        if (ev === 'dragleave' && row.contains(e.relatedTarget)) return;
        row.classList.remove('drop-hot');
      })
    );
    row.addEventListener('drop', (e) => {
      const file = e.dataTransfer?.files?.[0];
      if (file) onDropFile(i, file);
    });

    list.appendChild(row);
  }
  root.appendChild(list);
}

// Frame (aspect-ratio) selector + Card shape — its own panel, above Motion Curve.
export function buildFramePanel(root, { aspect, cardShape, onAspect, onCardShape }) {
  root.innerHTML = '';
  root.appendChild(section(t('Frame')));
  const seg = document.createElement('div');
  seg.className = 'segmented';
  for (const a of ASPECTS) {
    const b = document.createElement('button');
    b.className = 'seg-btn' + (a === aspect ? ' active' : '');
    b.textContent = a;
    b.addEventListener('click', () => onAspect(a));
    seg.appendChild(b);
  }
  root.appendChild(seg);

  // ---------- CARD SHAPE (directly under Frame) ----------
  root.appendChild(section(t('Card shape')));
  const shapeSeg = document.createElement('div');
  shapeSeg.className = 'segmented card-shapes';
  for (const s of CARD_SHAPES) {
    const b = document.createElement('button');
    b.className = 'seg-btn' + ((cardShape || 'original') === s.value ? ' active' : '');
    b.textContent = s.label;
    b.title = t(s.title);
    b.setAttribute('aria-label', t(s.title));
    b.addEventListener('click', () => onCardShape && onCardShape(s.value));
    shapeSeg.appendChild(b);
  }
  root.appendChild(shapeSeg);
}

// Global card-shadow slider (0–100%). Returned as an element so it can be
// appended into the Properties panel.
export function buildShadowControl({ cardShadow, onCardShadow }) {
  const val = Math.round((cardShadow ?? 0) * 100);
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const head = document.createElement('div');
  head.className = 'control-head';
  const label = document.createElement('span');
  label.className = 'control-label';
  label.textContent = t('Shadow');
  const valEl = document.createElement('span');
  valEl.className = 'control-value';
  valEl.textContent = `${val}%`;
  head.append(label, valEl);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = '0';
  input.max = '100';
  input.step = '1';
  input.value = String(val);
  input.addEventListener('input', () => {
    valEl.textContent = `${input.value}%`;
    onCardShadow && onCardShadow(Number(input.value) / 100);
  });
  wrap.append(head, input);
  return wrap;
}
