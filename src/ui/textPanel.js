// Text-overlay editor. Supports MULTIPLE text layers: each layer has its own
// content, font, weight, size, colour, alignment, position (X/Y) and a seamless
// entrance animation. A "+ Add text" button appends a new layer; each layer
// past the first can be removed. Partial edits report via onChange(index, patch)
// and never rebuild the panel, so the textarea keeps focus while typing.

import { getAllFonts } from '../assets/fonts.js';
import { t } from '../i18n.js';

const WEIGHTS = [
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'Semibold' },
  { value: 700, label: 'Bold' },
  { value: 900, label: 'Black' },
];
const ALIGNS = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];
const DIRS = [
  { value: 'auto', label: 'Auto (detects Arabic)' },
  { value: 'rtl', label: 'RTL · عربي' },
  { value: 'ltr', label: 'LTR' },
];
const ANIMS = [
  { value: 'none', label: 'None' },
  { value: 'fade', label: 'Fade in/out' },
  { value: 'rise', label: 'Rise' },
  { value: 'float', label: 'Float' },
  { value: 'pop', label: 'Pop' },
  { value: 'type', label: 'Typewriter' },
];

function sectionTitle(text) {
  const el = document.createElement('div');
  el.className = 'section-title with-count';
  el.textContent = text;
  return el;
}

function selectField(label, options, value, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const head = document.createElement('div');
  head.className = 'control-head';
  head.innerHTML = `<span class="control-label">${label}</span>`;
  const sel = document.createElement('select');
  for (const o of options) {
    const opt = document.createElement('option');
    opt.value = o.value;
    opt.textContent = t(o.label);
    if (String(o.value) === String(value)) opt.selected = true;
    sel.appendChild(opt);
  }
  sel.addEventListener('change', () => onInput(sel.value));
  wrap.append(head, sel);
  return wrap;
}

function rangeField(label, min, max, step, value, unit, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const head = document.createElement('div');
  head.className = 'control-head';
  const val = document.createElement('span');
  val.className = 'control-value';
  val.textContent = `${value}${unit || ''}`;
  head.innerHTML = `<span class="control-label">${label}</span>`;
  head.appendChild(val);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = min;
  input.max = max;
  input.step = step;
  input.value = value;
  input.addEventListener('input', () => {
    val.textContent = `${input.value}${unit || ''}`;
    onInput(parseFloat(input.value));
  });
  wrap.append(head, input);
  return wrap;
}

// One text layer's editor. `patch` updates the layer at `index`.
function buildLayer(index, text, { onChange, onRemove, removable }) {
  const layer = document.createElement('div');
  layer.className = 'text-layer';

  const header = document.createElement('div');
  header.className = 'text-layer-head';
  const title = document.createElement('span');
  title.className = 'text-layer-title';
  title.textContent = `${t('Text')} ${index + 1}`;
  header.appendChild(title);
  if (removable) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'text-layer-remove';
    del.title = t('Remove this text');
    del.setAttribute('aria-label', t('Remove this text'));
    del.textContent = '✕';
    del.addEventListener('click', () => onRemove(index));
    header.appendChild(del);
  }
  layer.appendChild(header);

  const patch = (p) => onChange(index, p);

  // content
  const ta = document.createElement('textarea');
  ta.className = 'text-input';
  ta.rows = 2;
  ta.placeholder = t('Add text (optional)…');
  ta.value = text.content || '';
  ta.addEventListener('input', () => patch({ content: ta.value }));
  layer.appendChild(ta);

  // fields shown only when this layer has text, to keep the panel tidy
  const fields = document.createElement('div');
  fields.className = 'text-fields' + (text.content ? '' : ' hidden');
  layer.appendChild(fields);
  ta.addEventListener('input', () => fields.classList.toggle('hidden', !ta.value));

  fields.appendChild(
    selectField(t('Font'), getAllFonts().map((f) => ({ value: f.id, label: f.name })), text.font, (v) =>
      patch({ font: v })
    )
  );
  fields.appendChild(
    selectField(t('Weight'), WEIGHTS, text.weight, (v) => patch({ weight: parseInt(v, 10) }))
  );
  fields.appendChild(rangeField(t('Size'), 2, 20, 0.5, text.size, '%', (v) => patch({ size: v })));

  // colour + alignment on one row
  const row = document.createElement('div');
  row.className = 'text-row';
  const colorWrap = document.createElement('label');
  colorWrap.className = 'bg-field';
  colorWrap.innerHTML = `<span>${t('Colour')}</span>`;
  const color = document.createElement('input');
  color.type = 'color';
  color.className = 'color-input';
  color.value = text.color || '#ffffff';
  color.addEventListener('input', () => patch({ color: color.value }));
  colorWrap.appendChild(color);
  row.appendChild(colorWrap);
  fields.appendChild(row);

  fields.appendChild(selectField(t('Align'), ALIGNS, text.align, (v) => patch({ align: v })));
  fields.appendChild(
    selectField(t('Direction'), DIRS, text.dir || 'auto', (v) => patch({ dir: v }))
  );
  fields.appendChild(rangeField(t('Position X'), 0, 100, 1, text.x, '%', (v) => patch({ x: v })));
  fields.appendChild(rangeField(t('Position Y'), 0, 100, 1, text.y, '%', (v) => patch({ y: v })));
  fields.appendChild(selectField(t('Animation'), ANIMS, text.anim, (v) => patch({ anim: v })));

  return layer;
}

export function buildTextPanel(root, { texts, onChange, onAdd, onRemove, onUploadFont }) {
  root.innerHTML = '';
  root.appendChild(sectionTitle(t('Text')));

  const list = Array.isArray(texts) ? texts : [];
  list.forEach((text, i) => {
    root.appendChild(
      buildLayer(i, text, { onChange, onRemove, removable: list.length > 1 })
    );
  });

  // "Add text" action — appends another independent text layer.
  const add = document.createElement('button');
  add.type = 'button';
  add.className = 'text-add-btn';
  add.innerHTML = `<span class="text-add-icon">＋</span><span>${t('Add text')}</span>`;
  add.addEventListener('click', () => onAdd());
  root.appendChild(add);

  // "Upload font" — register a user font file for use on any text layer.
  const font = document.createElement('button');
  font.type = 'button';
  font.className = 'text-add-btn text-font-btn';
  font.innerHTML = `<span class="text-add-icon">⬆</span><span>${t('Upload font')}</span>`;
  font.addEventListener('click', () => onUploadFont && onUploadFont());
  root.appendChild(font);
}
