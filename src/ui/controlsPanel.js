// Right-hand controls panel. Builds inputs from a template's `controls` schema
// and reports changes via onChange(key, value). No per-template UI code.

import { t } from '../i18n.js';

export function buildPanel(root, tpl, params, onChange) {
  root.innerHTML = '';

  const title = document.createElement('div');
  title.className = 'panel-title';
  title.textContent = tpl.name; // proper name, not translated
  root.appendChild(title);

  const sub = document.createElement('div');
  sub.className = 'panel-sub';
  sub.textContent = t(tpl.category);
  root.appendChild(sub);

  for (const ctrl of tpl.controls) {
    const wrap = document.createElement('div');
    wrap.className = 'control';

    if (ctrl.type === 'range') {
      const head = document.createElement('div');
      head.className = 'control-head';
      const label = document.createElement('span');
      label.className = 'control-label';
      label.textContent = t(ctrl.label);
      const val = document.createElement('span');
      val.className = 'control-value';
      const fmt = (v) => `${v}${ctrl.unit || ''}`;
      val.textContent = fmt(params[ctrl.key]);
      head.append(label, val);

      const input = document.createElement('input');
      input.type = 'range';
      input.min = ctrl.min;
      input.max = ctrl.max;
      input.step = ctrl.step;
      input.value = params[ctrl.key];
      input.addEventListener('input', () => {
        const v = parseFloat(input.value);
        val.textContent = fmt(v);
        onChange(ctrl.key, v);
      });
      wrap.append(head, input);
    } else if (ctrl.type === 'toggle') {
      const tg = document.createElement('div');
      tg.className = 'toggle' + (params[ctrl.key] ? ' on' : '');
      const label = document.createElement('span');
      label.className = 'control-label';
      label.textContent = t(ctrl.label);
      const track = document.createElement('span');
      track.className = 'toggle-track';
      tg.append(label, track);
      tg.addEventListener('click', () => {
        const v = !tg.classList.contains('on');
        tg.classList.toggle('on', v);
        onChange(ctrl.key, v);
      });
      wrap.appendChild(tg);
    } else if (ctrl.type === 'select') {
      const head = document.createElement('div');
      head.className = 'control-head';
      const label = document.createElement('span');
      label.className = 'control-label';
      label.textContent = t(ctrl.label);
      head.appendChild(label);
      const sel = document.createElement('select');
      for (const opt of ctrl.options) {
        const o = document.createElement('option');
        o.value = opt.value;
        o.textContent = t(opt.label);
        if (opt.value === params[ctrl.key]) o.selected = true;
        sel.appendChild(o);
      }
      sel.addEventListener('change', () => onChange(ctrl.key, sel.value));
      wrap.append(head, sel);
    } else if (ctrl.type === 'text') {
      const head = document.createElement('div');
      head.className = 'control-head';
      const label = document.createElement('span');
      label.className = 'control-label';
      label.textContent = t(ctrl.label);
      head.appendChild(label);
      const ta = document.createElement('textarea');
      ta.className = 'control-textarea';
      ta.rows = ctrl.rows || 3;
      ta.placeholder = ctrl.placeholder || '';
      ta.value = params[ctrl.key] ?? '';
      ta.addEventListener('input', () => onChange(ctrl.key, ta.value));
      wrap.append(head, ta);
    } else if (ctrl.type === 'color') {
      const head = document.createElement('div');
      head.className = 'control-head';
      const label = document.createElement('span');
      label.className = 'control-label';
      label.textContent = t(ctrl.label);
      const val = document.createElement('span');
      val.className = 'control-value';
      val.textContent = (params[ctrl.key] || '').toUpperCase();
      head.append(label, val);
      const input = document.createElement('input');
      input.type = 'color';
      input.className = 'control-color';
      input.value = params[ctrl.key] || '#000000';
      input.addEventListener('input', () => {
        val.textContent = input.value.toUpperCase();
        onChange(ctrl.key, input.value);
      });
      wrap.append(head, input);
    }

    root.appendChild(wrap);
  }
}
