// Text-overlay editor. Supports MULTIPLE text layers: each layer has its own
// content, font, weight, size, colour, alignment, position (X/Y) and a seamless
// entrance animation. A "+ Add text" button appends a new layer; each layer
// past the first can be removed. Partial edits report via onChange(index, patch)
// and never rebuild the panel, so the textarea keeps focus while typing.

import { getAllFonts } from '../assets/fonts.js';
import { fontsAllowed } from '../account/account.js';
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

// A label + on/off toggle (matches the controls-panel toggle styling).
function toggleField(label, value, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const tg = document.createElement('div');
  tg.className = 'toggle' + (value ? ' on' : '');
  const lab = document.createElement('span');
  lab.className = 'control-label';
  lab.textContent = label;
  const track = document.createElement('span');
  track.className = 'toggle-track';
  tg.append(lab, track);
  tg.addEventListener('click', () => {
    const v = !tg.classList.contains('on');
    tg.classList.toggle('on', v);
    onInput(v);
  });
  wrap.appendChild(tg);
  return wrap;
}

// One text layer's editor, rendered as a collapsible "folder". `patch` updates
// the layer at `index`. The fold state lives on the text object (in-session; not
// persisted) so it survives panel rebuilds on add/remove.
function buildLayer(index, text, { onChange, onRemove, removable }) {
  const layer = document.createElement('div');
  layer.className = 'text-layer' + (text.collapsed ? ' collapsed' : '');

  const header = document.createElement('div');
  header.className = 'text-layer-head';

  const caret = document.createElement('span');
  caret.className = 'text-layer-caret';
  caret.textContent = text.collapsed ? '▸' : '▾';

  const title = document.createElement('span');
  title.className = 'text-layer-title';
  const titleText = () => {
    const c = (text.content || '').trim().replace(/\s+/g, ' ');
    return c ? c.slice(0, 26) + (c.length > 26 ? '…' : '') : `${t('Text')} ${index + 1}`;
  };
  title.textContent = titleText();

  header.append(caret, title);
  if (removable) {
    const del = document.createElement('button');
    del.type = 'button';
    del.className = 'text-layer-remove';
    del.title = t('Remove this text');
    del.setAttribute('aria-label', t('Remove this text'));
    del.textContent = '✕';
    del.addEventListener('click', (e) => {
      e.stopPropagation();
      onRemove(index);
    });
    header.appendChild(del);
  }
  // fold / unfold on header click
  header.addEventListener('click', () => {
    const collapsed = !layer.classList.contains('collapsed');
    layer.classList.toggle('collapsed', collapsed);
    text.collapsed = collapsed;
    caret.textContent = collapsed ? '▸' : '▾';
  });
  layer.appendChild(header);

  const body = document.createElement('div');
  body.className = 'text-layer-body';
  layer.appendChild(body);

  const patch = (p) => onChange(index, p);

  // content
  const ta = document.createElement('textarea');
  ta.className = 'text-input';
  ta.rows = 2;
  ta.placeholder = t('Add text (optional)…');
  ta.value = text.content || '';

  // fields shown only when this layer has text, to keep the panel tidy
  const fields = document.createElement('div');
  fields.className = 'text-fields' + (text.content ? '' : ' hidden');
  body.append(ta, fields);
  ta.addEventListener('input', () => {
    patch({ content: ta.value });
    title.textContent = titleText();
    fields.classList.toggle('hidden', !ta.value);
  });

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

  fields.appendChild(toggleField(t('Text shadow'), !!text.shadow, (v) => patch({ shadow: v })));
  fields.appendChild(selectField(t('Align'), ALIGNS, text.align, (v) => patch({ align: v })));
  fields.appendChild(
    selectField(t('Direction'), DIRS, text.dir || 'auto', (v) => patch({ dir: v }))
  );
  fields.appendChild(rangeField(t('Position X'), 0, 100, 1, text.x, '%', (v) => patch({ x: v })));
  fields.appendChild(rangeField(t('Position Y'), 0, 100, 1, text.y, '%', (v) => patch({ y: v })));
  fields.appendChild(
    selectField(
      t('Text layer'),
      [
        { value: 'front', label: t('In front') },
        { value: 'back', label: t('Behind cards') },
      ],
      text.layer || 'front',
      (v) => patch({ layer: v })
    )
  );
  fields.appendChild(selectField(t('Animation'), ANIMS, text.anim, (v) => patch({ anim: v })));

  return layer;
}

export function buildTextPanel(root, { texts, onChange, onAdd, onRemove, onUploadFont, onUpgrade }) {
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

  // "Upload font" — register a user font file for use on any text layer. Custom
  // fonts are a Pro feature: free users see a lock that opens the upgrade prompt.
  const font = document.createElement('button');
  font.type = 'button';
  if (fontsAllowed()) {
    font.className = 'text-add-btn text-font-btn';
    font.innerHTML = `<span class="text-add-icon">⬆</span><span>${t('Upload font')}</span>`;
    font.addEventListener('click', () => onUploadFont && onUploadFont());
  } else {
    font.className = 'text-add-btn text-font-btn text-font-locked';
    font.innerHTML = `🔒 <span>${t('Upgrade to Pro to add fonts')}</span>`;
    font.addEventListener('click', () => onUpgrade && onUpgrade());
  }
  root.appendChild(font);
}
