// Global "Easing" panel: a cubic-bezier timing curve (with draggable handles,
// numeric inputs, and named presets) that reshapes the pacing of every template's
// loop. Visible to everyone, but editing is a Pro feature — a free user's first
// interaction opens the upgrade prompt instead of changing anything.

import { t } from '../i18n.js';
import { EASING_PRESETS, DEFAULT_EASING } from '../engine/easing.js';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clampY = (v) => Math.min(1.4, Math.max(-0.4, v)); // allow gentle overshoot

// Mini SVG of a bezier curve for the preset rows / thumbnails.
function curveIcon(pts, cls = 'ez-mini') {
  const [x1, y1, x2, y2] = pts;
  const Y = (y) => 28 - y * 24;
  const X = (x) => 2 + x * 24;
  return (
    `<svg class="${cls}" viewBox="0 0 28 30" fill="none" aria-hidden="true">` +
    `<path d="M ${X(0)} ${Y(0)} C ${X(x1)} ${Y(y1)} ${X(x2)} ${Y(y2)} ${X(1)} ${Y(1)}" ` +
    `stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`
  );
}

export function buildEasingPanel(root, { easing, allowed, onChange, onUpgrade }) {
  root.innerHTML = '';
  const cur = { preset: easing?.preset || 'linear', pts: (easing?.pts || DEFAULT_EASING.pts).slice() };

  const title = document.createElement('div');
  title.className = 'section-title';
  title.textContent = t('Motion Curve');
  root.appendChild(title);

  // If a free user touches anything, upsell instead of editing. Returns true when
  // the action was blocked.
  const gate = () => {
    if (allowed) return false;
    onUpgrade && onUpgrade();
    return true;
  };

  // ---- curve editor (SVG, 0..1 space; y flipped so up = larger) ----
  const W = 240;
  const H = 200;
  const PX = (x) => x * W;
  const PY = (y) => H - y * H;
  const box = document.createElement('div');
  box.className = 'ez-box' + (allowed ? '' : ' ez-locked');
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
  svg.classList.add('ez-svg');
  box.appendChild(svg);
  root.appendChild(box);

  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs) => {
    const n = document.createElementNS(NS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  };

  // dotted grid
  for (let i = 1; i < 6; i++) {
    for (let j = 1; j < 6; j++) {
      svg.appendChild(mk('circle', { cx: (W / 6) * i, cy: (H / 6) * j, r: 1, class: 'ez-dot' }));
    }
  }
  const diag = mk('line', { x1: PX(0), y1: PY(0), x2: PX(1), y2: PY(1), class: 'ez-diag' });
  svg.appendChild(diag);
  const h1line = mk('line', { class: 'ez-hline' });
  const h2line = mk('line', { class: 'ez-hline' });
  const curve = mk('path', { class: 'ez-curve' });
  svg.append(h1line, h2line, curve);
  const h1 = mk('circle', { r: 7, class: 'ez-handle', 'data-i': '0' });
  const h2 = mk('circle', { r: 7, class: 'ez-handle', 'data-i': '1' });
  svg.append(h1, h2);

  // numeric readouts
  const nums = document.createElement('div');
  nums.className = 'ez-nums';
  const inputs = [0, 1, 2, 3].map((i) => {
    const inp = document.createElement('input');
    inp.type = 'text';
    inp.inputMode = 'decimal';
    inp.className = 'ez-num';
    inp.value = cur.pts[i].toFixed(2);
    inp.addEventListener('focus', (e) => {
      if (gate()) inp.blur();
    });
    inp.addEventListener('change', () => {
      if (!allowed) return;
      const v = parseFloat(inp.value);
      if (Number.isFinite(v)) {
        cur.pts[i] = i % 2 === 0 ? clamp01(v) : clampY(v);
        cur.preset = 'custom';
        sync();
        emit();
      } else inp.value = cur.pts[i].toFixed(2);
    });
    nums.appendChild(inp);
    return inp;
  });
  root.appendChild(nums);

  // Defaults / Custom tabs
  const tabs = document.createElement('div');
  tabs.className = 'segmented ez-tabs';
  const tabDef = document.createElement('button');
  const tabCus = document.createElement('button');
  tabDef.className = 'seg-btn';
  tabCus.className = 'seg-btn';
  tabDef.textContent = t('Defaults');
  tabCus.textContent = t('Custom');
  tabs.append(tabDef, tabCus);
  root.appendChild(tabs);

  // preset list
  const list = document.createElement('div');
  list.className = 'ez-presets';
  for (const p of EASING_PRESETS) {
    const b = document.createElement('button');
    b.className = 'ez-preset';
    b.dataset.id = p.id;
    b.innerHTML = `<span class="ez-preset-name">${t(p.name)}</span>${curveIcon(p.pts)}`;
    b.addEventListener('click', () => {
      if (gate()) return;
      cur.preset = p.id;
      cur.pts = p.pts.slice();
      sync();
      emit();
    });
    list.appendChild(b);
  }
  root.appendChild(list);

  // reset
  const reset = document.createElement('button');
  reset.className = 'ez-reset';
  reset.innerHTML = `↺ ${t('Reset all values')}`;
  reset.addEventListener('click', () => {
    if (gate()) return;
    cur.preset = 'linear';
    cur.pts = DEFAULT_EASING.pts.slice();
    sync();
    emit();
  });
  root.appendChild(reset);

  // Pro hint (shown to free users)
  if (!allowed) {
    const hint = document.createElement('button');
    hint.className = 'ez-pro-hint';
    hint.innerHTML = `🔒 <span>${t('Subscribe to Pro to unlock all features')}</span>`;
    hint.addEventListener('click', () => onUpgrade && onUpgrade());
    root.appendChild(hint);
  }

  function emit() {
    onChange && onChange({ preset: cur.preset, pts: cur.pts.slice() });
  }

  function sync() {
    const [x1, y1, x2, y2] = cur.pts;
    h1.setAttribute('cx', PX(x1));
    h1.setAttribute('cy', PY(y1));
    h2.setAttribute('cx', PX(x2));
    h2.setAttribute('cy', PY(y2));
    h1line.setAttribute('x1', PX(0));
    h1line.setAttribute('y1', PY(0));
    h1line.setAttribute('x2', PX(x1));
    h1line.setAttribute('y2', PY(y1));
    h2line.setAttribute('x1', PX(1));
    h2line.setAttribute('y1', PY(1));
    h2line.setAttribute('x2', PX(x2));
    h2line.setAttribute('y2', PY(y2));
    curve.setAttribute(
      'd',
      `M ${PX(0)} ${PY(0)} C ${PX(x1)} ${PY(y1)} ${PX(x2)} ${PY(y2)} ${PX(1)} ${PY(1)}`
    );
    inputs.forEach((inp, i) => (inp.value = cur.pts[i].toFixed(2)));
    const isPreset = EASING_PRESETS.some((p) => p.id === cur.preset);
    list.querySelectorAll('.ez-preset').forEach((el) => el.classList.toggle('active', el.dataset.id === cur.preset));
    tabDef.classList.toggle('active', isPreset);
    tabCus.classList.toggle('active', !isPreset);
    list.classList.toggle('hidden', !isPreset);
  }

  tabDef.addEventListener('click', () => {
    if (gate()) return;
    list.classList.remove('hidden');
  });
  tabCus.addEventListener('click', () => {
    if (gate()) return;
    list.classList.add('hidden');
  });

  // ---- dragging the handles (Pro only) ----
  const startDrag = (handle, e) => {
    if (gate()) return;
    e.preventDefault();
    const i = parseInt(handle.dataset.i, 10);
    const move = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = clamp01((ev.clientX - r.left) / r.width);
      const y = clampY(1 - (ev.clientY - r.top) / r.height);
      cur.pts[i * 2] = x;
      cur.pts[i * 2 + 1] = y;
      cur.preset = 'custom';
      sync();
      emit();
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  h1.addEventListener('pointerdown', (e) => startDrag(h1, e));
  h2.addEventListener('pointerdown', (e) => startDrag(h2, e));

  sync();
}
