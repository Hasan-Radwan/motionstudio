// Inline background editor: preset swatches plus a custom Solid / Gradient
// builder. Reports the chosen background object via onChange. Built once (per
// boot / project restore) so the native colour pickers keep focus while dragging.

import { BACKGROUNDS, paintSwatch } from '../assets/backgrounds.js';
import { drawImageCover } from '../engine/canvasUtils.js';
import { t } from '../i18n.js';

function section(title) {
  const el = document.createElement('div');
  el.className = 'section-title with-count';
  el.textContent = title;
  return el;
}

function normHex(c) {
  return c && /^#/.test(c) ? c : '#101014';
}

export function buildBackgroundPanel(root, { background, onChange, onPickImage, onClearImage }) {
  root.innerHTML = '';
  root.appendChild(section(t('Background')));

  // ---- initial custom values, seeded from the current background ----
  const isImage = background && background.type === 'image';
  let mode = isImage ? 'image' : background && background.type === 'linear' ? 'gradient' : 'solid';
  // image-mode state (the logo/photo lives on the background object)
  const bgImg = isImage ? background.img : null;
  const bgBlob = isImage ? background.blob : null;
  let fit = isImage ? background.fit || 'cover' : 'cover';
  let dim = isImage ? background.dim ?? 0 : 0;
  let solid = background && background.type === 'solid' ? normHex(background.color) : '#101014';
  let gradA =
    background && background.type === 'linear' ? normHex(background.stops?.[0]) : '#6c5cff';
  let gradB =
    background && background.type === 'linear'
      ? normHex(background.stops?.[background.stops.length - 1])
      : '#ff5c9d';
  let angle = background && background.type === 'linear' ? background.angle ?? 135 : 135;

  // ---------- preset swatches ----------
  const presetGrid = document.createElement('div');
  presetGrid.className = 'bg-presets';
  const presetBtns = new Map();
  for (const bg of BACKGROUNDS) {
    const btn = document.createElement('button');
    btn.className = 'bg-swatch' + (bg.id === background?.id ? ' active' : '');
    btn.title = bg.name;
    const cv = document.createElement('canvas');
    btn.appendChild(cv);
    presetGrid.appendChild(btn);
    presetBtns.set(bg.id, btn);
    requestAnimationFrame(() => paintSwatch(cv, bg));
    btn.addEventListener('click', () => {
      clearActive();
      btn.classList.add('active');
      onChange(bg);
    });
  }
  root.appendChild(presetGrid);

  function clearActive() {
    for (const b of presetBtns.values()) b.classList.remove('active');
  }

  // ---------- custom Solid / Gradient ----------
  const modeSeg = document.createElement('div');
  modeSeg.className = 'segmented bg-mode';
  const mkMode = (id, label) => {
    const b = document.createElement('button');
    b.className = 'seg-btn' + (mode === id ? ' active' : '');
    b.textContent = label;
    b.dataset.mode = id;
    b.addEventListener('click', () => {
      mode = id;
      [...modeSeg.children].forEach((c) => c.classList.toggle('active', c.dataset.mode === id));
      solidRow.classList.toggle('hidden', id !== 'solid');
      gradWrap.classList.toggle('hidden', id !== 'gradient');
      imageWrap.classList.toggle('hidden', id !== 'image');
      // Switching to Image without an uploaded picture yet shouldn't change the
      // background — wait for the upload. Otherwise emit the chosen custom mode.
      if (id === 'image' && !bgImg) return;
      emitCustom();
    });
    return b;
  };
  modeSeg.append(mkMode('solid', t('Solid')), mkMode('gradient', t('Gradient')), mkMode('image', t('Image')));
  root.appendChild(modeSeg);

  // solid row
  const solidRow = document.createElement('label');
  solidRow.className = 'bg-field' + (mode !== 'solid' ? ' hidden' : '');
  solidRow.innerHTML = `<span>${t('Colour')}</span>`;
  const solidInput = document.createElement('input');
  solidInput.type = 'color';
  solidInput.className = 'color-input';
  solidInput.value = solid;
  solidInput.addEventListener('input', () => {
    solid = solidInput.value;
    emitCustom();
  });
  solidRow.appendChild(solidInput);
  root.appendChild(solidRow);

  // gradient block
  const gradWrap = document.createElement('div');
  gradWrap.className = 'bg-grad' + (mode !== 'gradient' ? ' hidden' : '');

  const gradRow = document.createElement('div');
  gradRow.className = 'bg-field';
  gradRow.innerHTML = `<span>${t('From / To')}</span>`;
  const swatches = document.createElement('div');
  swatches.className = 'bg-grad-swatches';
  const inA = document.createElement('input');
  inA.type = 'color';
  inA.className = 'color-input';
  inA.value = gradA;
  const inB = document.createElement('input');
  inB.type = 'color';
  inB.className = 'color-input';
  inB.value = gradB;
  inA.addEventListener('input', () => {
    gradA = inA.value;
    emitCustom();
  });
  inB.addEventListener('input', () => {
    gradB = inB.value;
    emitCustom();
  });
  swatches.append(inA, inB);
  gradRow.appendChild(swatches);
  gradWrap.appendChild(gradRow);

  const angleWrap = document.createElement('div');
  angleWrap.className = 'control';
  const angleHead = document.createElement('div');
  angleHead.className = 'control-head';
  angleHead.innerHTML = `<span class="control-label">${t('Angle')}</span>`;
  const angleVal = document.createElement('span');
  angleVal.className = 'control-value';
  angleVal.textContent = `${angle}°`;
  angleHead.appendChild(angleVal);
  const angleInput = document.createElement('input');
  angleInput.type = 'range';
  angleInput.min = 0;
  angleInput.max = 360;
  angleInput.step = 1;
  angleInput.value = angle;
  angleInput.addEventListener('input', () => {
    angle = parseInt(angleInput.value, 10);
    angleVal.textContent = `${angle}°`;
    emitCustom();
  });
  angleWrap.append(angleHead, angleInput);
  gradWrap.appendChild(angleWrap);
  root.appendChild(gradWrap);

  // ---------- custom Image ----------
  const imageWrap = document.createElement('div');
  imageWrap.className = 'bg-image' + (mode !== 'image' ? ' hidden' : '');

  if (!bgImg) {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'bg-add-btn';
    add.innerHTML = `<span class="bg-add-icon">＋</span><span>${t('Upload image')}</span>`;
    add.addEventListener('click', () => onPickImage && onPickImage());
    imageWrap.appendChild(add);
  } else {
    // preview + replace/remove
    const row = document.createElement('div');
    row.className = 'wm-logo-row';
    const thumb = document.createElement('div');
    thumb.className = 'wm-logo-thumb';
    const cv = document.createElement('canvas');
    cv.width = 96;
    cv.height = 60;
    drawImageCover(cv.getContext('2d'), bgImg, 0, 0, 96, 60);
    thumb.appendChild(cv);
    thumb.title = 'Replace image';
    thumb.addEventListener('click', () => onPickImage && onPickImage());
    const meta = document.createElement('div');
    meta.className = 'wm-logo-meta';
    const replace = document.createElement('button');
    replace.type = 'button';
    replace.className = 'wm-link-btn';
    replace.textContent = t('Replace');
    replace.addEventListener('click', () => onPickImage && onPickImage());
    meta.appendChild(replace);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'slot-clear';
    remove.title = t('Remove image');
    remove.textContent = '×';
    remove.addEventListener('click', () => onClearImage && onClearImage());
    row.append(thumb, meta, remove);
    imageWrap.appendChild(row);

    // Fit (Cover / Contain)
    const fitSeg = document.createElement('div');
    fitSeg.className = 'segmented';
    for (const f of [
      ['cover', 'Cover'],
      ['contain', 'Contain'],
    ]) {
      const b = document.createElement('button');
      b.className = 'seg-btn' + (fit === f[0] ? ' active' : '');
      b.textContent = t(f[1]);
      b.dataset.fit = f[0];
      b.addEventListener('click', () => {
        fit = f[0];
        [...fitSeg.children].forEach((c) => c.classList.toggle('active', c.dataset.fit === f[0]));
        emitCustom();
      });
      fitSeg.appendChild(b);
    }
    imageWrap.appendChild(fitSeg);

    // Dim overlay slider
    const dimWrap = document.createElement('div');
    dimWrap.className = 'control';
    const dimHead = document.createElement('div');
    dimHead.className = 'control-head';
    dimHead.innerHTML = `<span class="control-label">${t('Dim')}</span>`;
    const dimVal = document.createElement('span');
    dimVal.className = 'control-value';
    dimVal.textContent = `${dim}%`;
    dimHead.appendChild(dimVal);
    const dimInput = document.createElement('input');
    dimInput.type = 'range';
    dimInput.min = 0;
    dimInput.max = 80;
    dimInput.step = 1;
    dimInput.value = dim;
    dimInput.addEventListener('input', () => {
      dim = parseInt(dimInput.value, 10);
      dimVal.textContent = `${dim}%`;
      emitCustom();
    });
    dimWrap.append(dimHead, dimInput);
    imageWrap.appendChild(dimWrap);
  }
  root.appendChild(imageWrap);

  // Building a custom background deselects any active preset.
  function emitCustom() {
    clearActive();
    if (mode === 'solid') {
      onChange({ id: 'custom-solid', name: 'Custom', type: 'solid', color: solid });
    } else if (mode === 'gradient') {
      onChange({
        id: 'custom-grad',
        name: 'Custom',
        type: 'linear',
        angle,
        stops: [gradA, gradB],
      });
    } else if (mode === 'image' && bgImg) {
      onChange({
        id: 'custom-image',
        name: 'Image',
        type: 'image',
        img: bgImg,
        blob: bgBlob,
        fit,
        dim,
      });
    }
  }
}
