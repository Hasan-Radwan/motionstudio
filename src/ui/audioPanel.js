// Audio / music panel. Uploading and using audio is a Pro-only feature; free
// users see an upgrade prompt. When audio is present the panel shows the track
// name, a volume slider, and a play/pause preview toggle.

import { t } from '../i18n.js';
import { audioAllowed } from '../account/account.js';

function section(text) {
  const el = document.createElement('div');
  el.className = 'section-title';
  el.textContent = text;
  return el;
}

export function buildAudioPanel(root, { audio, playing, onPick, onClear, onChange, onTogglePlay, onUpgrade }) {
  root.innerHTML = '';
  root.appendChild(section(t('Audio') + ' · موسيقى'));

  // ---- Pro gate ----
  if (!audioAllowed()) {
    const lock = document.createElement('button');
    lock.type = 'button';
    lock.className = 'audio-lock';
    lock.innerHTML = `🔒 <span>${t('Upgrade to Pro to add audio')}</span>`;
    lock.addEventListener('click', () => onUpgrade && onUpgrade());
    root.appendChild(lock);
    return;
  }

  const has = !!(audio && audio.url);

  if (!has) {
    const add = document.createElement('button');
    add.type = 'button';
    add.className = 'audio-add-btn';
    add.innerHTML = `<span class="audio-add-icon">＋</span><span>${t('Upload audio')}</span>`;
    add.addEventListener('click', () => onPick && onPick());
    root.appendChild(add);
    const note = document.createElement('p');
    note.className = 'muted audio-note';
    note.textContent = t('No audio yet. Click Upload audio above.');
    root.appendChild(note);
    return;
  }

  // ---- track row: play toggle · name · remove ----
  const row = document.createElement('div');
  row.className = 'audio-row';
  const play = document.createElement('button');
  play.type = 'button';
  play.className = 'audio-play';
  play.textContent = playing ? '❚❚' : '▶';
  play.title = playing ? t('Pause') : t('Play');
  play.addEventListener('click', () => onTogglePlay && onTogglePlay());
  const name = document.createElement('div');
  name.className = 'audio-name';
  name.textContent = audio.name || 'audio';
  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'slot-clear';
  remove.title = t('Remove audio');
  remove.textContent = '×';
  remove.addEventListener('click', () => onClear && onClear());
  row.append(play, name, remove);
  root.appendChild(row);

  // ---- volume ----
  const vol = document.createElement('div');
  vol.className = 'control';
  const head = document.createElement('div');
  head.className = 'control-head';
  const val = document.createElement('span');
  val.className = 'control-value';
  val.textContent = `${audio.volume ?? 100}%`;
  head.innerHTML = `<span class="control-label">🔊 ${t('Volume')}</span>`;
  head.appendChild(val);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0;
  input.max = 100;
  input.step = 1;
  input.value = audio.volume ?? 100;
  input.addEventListener('input', () => {
    val.textContent = `${input.value}%`;
    onChange && onChange({ volume: parseInt(input.value, 10) });
  });
  vol.append(head, input);
  root.appendChild(vol);

  // ---- fade in / out (as a % of the loop duration, so they scale with it) ----
  root.appendChild(
    fadeControl(`↗ ${t('Fade in')}`, audio.fadeIn ?? 0, (v) => onChange && onChange({ fadeIn: v }))
  );
  root.appendChild(
    fadeControl(`↘ ${t('Fade out')}`, audio.fadeOut ?? 0, (v) => onChange && onChange({ fadeOut: v }))
  );

  const note = document.createElement('p');
  note.className = 'muted audio-note';
  note.textContent = t('Plays in preview and is included in the export.');
  root.appendChild(note);
}

// A 0–50% slider used for fade in / fade out (percentage of the loop duration).
function fadeControl(label, value, onInput) {
  const wrap = document.createElement('div');
  wrap.className = 'control';
  const head = document.createElement('div');
  head.className = 'control-head';
  const val = document.createElement('span');
  val.className = 'control-value';
  val.textContent = `${value ?? 0}%`;
  head.innerHTML = `<span class="control-label">${label}</span>`;
  head.appendChild(val);
  const input = document.createElement('input');
  input.type = 'range';
  input.min = 0;
  input.max = 50;
  input.step = 1;
  input.value = value ?? 0;
  input.addEventListener('input', () => {
    val.textContent = `${input.value}%`;
    onInput(parseInt(input.value, 10));
  });
  wrap.append(head, input);
  return wrap;
}
