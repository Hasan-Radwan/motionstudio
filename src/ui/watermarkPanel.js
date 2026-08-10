// Watermark editor: the user adds their own logo image, then controls its size,
// which corner it sits in, opacity and margin. Fully optional — no logo, no
// watermark. Slider/toggle edits report via onChange(patch) without rebuilding
// the panel (so dragging isn't interrupted); adding/removing the logo rebuilds.

import { drawImageCover } from '../engine/canvasUtils.js';
import { t } from '../i18n.js';

const CORNERS = [
  { value: 'tl', label: '↖', title: 'Top-left' },
  { value: 'tr', label: '↗', title: 'Top-right' },
  { value: 'bl', label: '↙', title: 'Bottom-left' },
  { value: 'br', label: '↘', title: 'Bottom-right' },
  { value: 'center', label: '◎', title: 'Center' },
];

function section(text) {
  const el = document.createElement('div');
  el.className = 'section-title';
  el.textContent = text;
  return el;
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

export function buildWatermarkPanel(root, { watermark, onChange, onPickLogo, onClearLogo }) {
  root.innerHTML = '';
  root.appendChild(section(t('Watermark')));

  const wm = watermark || {};
  const hasLogo = !!(wm.img && wm.img.width);

  if (!hasLogo) {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'wm-add-btn';
    add.innerHTML = `<span class="wm-add-icon">＋</span><span>${t('Add logo')}</span>`;
    add.addEventListener('click', () => onPickLogo());
    root.appendChild(add);
    return;
  }

  // ---- logo preview row + enable toggle + remove ----
  const head = document.createElement('div');
  head.className = 'wm-logo-row';

  const thumb = document.createElement('div');
  thumb.className = 'wm-logo-thumb';
  const cv = document.createElement('canvas');
  cv.width = 96;
  cv.height = 60;
  drawImageCover(cv.getContext('2d'), wm.img, 0, 0, 96, 60);
  thumb.appendChild(cv);
  thumb.title = t('Replace');
  thumb.addEventListener('click', () => onPickLogo());

  const meta = document.createElement('div');
  meta.className = 'wm-logo-meta';
  const toggle = document.createElement('label');
  toggle.className = 'wm-toggle';
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = wm.enabled !== false;
  cb.addEventListener('change', () => onChange({ enabled: cb.checked }));
  const tlabel = document.createElement('span');
  tlabel.textContent = t('Show watermark');
  toggle.append(cb, tlabel);
  const replace = document.createElement('button');
  replace.type = 'button';
  replace.className = 'wm-link-btn';
  replace.textContent = t('Replace');
  replace.addEventListener('click', () => onPickLogo());
  meta.append(toggle, replace);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'slot-clear';
  remove.title = t('Remove logo');
  remove.textContent = '×';
  remove.addEventListener('click', () => onClearLogo());

  head.append(thumb, meta, remove);
  root.appendChild(head);

  // ---- corner selector ----
  const cwrap = document.createElement('div');
  cwrap.className = 'control';
  cwrap.innerHTML = `<div class="control-head"><span class="control-label">${t('Position')}</span></div>`;
  const grid = document.createElement('div');
  grid.className = 'wm-corner-grid';
  for (const c of CORNERS) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'wm-corner-btn' + ((wm.corner || 'br') === c.value ? ' active' : '');
    b.textContent = c.label;
    b.title = t(c.title);
    b.addEventListener('click', () => {
      grid.querySelectorAll('.wm-corner-btn').forEach((el) => el.classList.remove('active'));
      b.classList.add('active');
      onChange({ corner: c.value });
    });
    grid.appendChild(b);
  }
  cwrap.appendChild(grid);
  root.appendChild(cwrap);

  // ---- sliders ----
  root.appendChild(
    rangeField(t('Size'), 5, 40, 1, wm.size ?? 14, '%', (v) => onChange({ size: v }))
  );
  root.appendChild(
    rangeField(t('Opacity'), 10, 100, 1, wm.opacity ?? 90, '%', (v) => onChange({ opacity: v }))
  );
  root.appendChild(
    rangeField(t('Margin'), 0, 12, 0.5, wm.margin ?? 4, '%', (v) => onChange({ margin: v }))
  );
}
