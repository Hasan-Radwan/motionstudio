// Playback timeline shown under the preview stage: a play/pause button, a
// scrubbable progress track, a seconds readout, and a duration stepper (change
// the loop/video length in seconds) — all driven by the renderer.

import { t as tr } from '../i18n.js';

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z"/></svg>';
const PAUSE_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 4h4v16H7zM13 4h4v16h-4z"/></svg>';

const fmt = (s) => `${s.toFixed(1)}s`;

export function buildTimeline(root, renderer, onDurationChange) {
  root.innerHTML = '';
  root.classList.add('timeline');

  const play = document.createElement('button');
  play.className = 'tl-btn';
  play.type = 'button';
  play.setAttribute('aria-label', 'Play / Pause');

  const track = document.createElement('div');
  track.className = 'tl-track';
  track.setAttribute('role', 'slider');
  track.setAttribute('aria-label', 'Timeline');
  const fill = document.createElement('div');
  fill.className = 'tl-fill';
  const handle = document.createElement('div');
  handle.className = 'tl-handle';
  track.append(fill, handle);

  const time = document.createElement('span');
  time.className = 'tl-time';

  // Duration stepper — change the video/loop length in seconds.
  const durWrap = document.createElement('div');
  durWrap.className = 'tl-dur';
  const durLabel = document.createElement('span');
  durLabel.className = 'tl-dur-label';
  durLabel.textContent = tr('Duration');
  const minus = document.createElement('button');
  minus.type = 'button';
  minus.className = 'tl-dur-btn';
  minus.textContent = '−';
  minus.setAttribute('aria-label', '-1s');
  const durInput = document.createElement('input');
  durInput.className = 'tl-dur-input';
  durInput.type = 'number';
  durInput.min = '0.5';
  durInput.max = '60';
  durInput.step = '0.5';
  durInput.setAttribute('aria-label', tr('Duration'));
  const durUnit = document.createElement('span');
  durUnit.className = 'tl-dur-unit';
  durUnit.textContent = 's';
  const plus = document.createElement('button');
  plus.type = 'button';
  plus.className = 'tl-dur-btn';
  plus.textContent = '+';
  plus.setAttribute('aria-label', '+1s');
  durWrap.append(durLabel, minus, durInput, durUnit, plus);

  root.append(play, track, time, durWrap);

  const clampDur = (v) => Math.min(60, Math.max(0.5, Math.round(v * 2) / 2));
  const applyDur = (v, fromInput) => {
    const d = clampDur(v);
    renderer.setDuration(d);
    if (!fromInput || document.activeElement !== durInput) durInput.value = d.toFixed(1);
    if (onDurationChange) onDurationChange(d);
  };
  minus.addEventListener('click', () => applyDur((renderer.duration || 4) - 1));
  plus.addEventListener('click', () => applyDur((renderer.duration || 4) + 1));
  durInput.addEventListener('change', () => {
    const raw = parseFloat(durInput.value);
    applyDur(Number.isFinite(raw) ? raw : renderer.duration || 4, true);
  });

  const setIcon = (playing) => {
    play.innerHTML = playing ? PAUSE_ICON : PLAY_ICON;
  };

  // Called every frame by the renderer with the current loop time.
  const onFrame = (t, playing) => {
    const pct = Math.max(0, Math.min(1, t)) * 100;
    fill.style.width = pct + '%';
    handle.style.left = pct + '%';
    const dur = renderer.duration || 1;
    time.textContent = `${fmt(t * dur)} / ${fmt(dur)}`;
    track.setAttribute('aria-valuenow', (t * dur).toFixed(1));
    // Keep the stepper in sync with the renderer (e.g. a template's default
    // duration, or the export dialog) unless the user is editing it.
    if (document.activeElement !== durInput) durInput.value = dur.toFixed(1);
    setIcon(playing);
  };
  renderer.onFrame(onFrame);

  play.addEventListener('click', () => renderer.toggle());

  // --- scrubbing (pointer drag to seek; resume prior play state on release) ---
  let dragging = false;
  let wasPlaying = false;
  const ratioAt = (clientX) => {
    const r = track.getBoundingClientRect();
    return r.width ? Math.max(0, Math.min(1, (clientX - r.left) / r.width)) : 0;
  };
  track.addEventListener('pointerdown', (e) => {
    dragging = true;
    wasPlaying = renderer.isPlaying();
    renderer.pause();
    try {
      track.setPointerCapture(e.pointerId);
    } catch {
      /* older browsers */
    }
    renderer.seek(ratioAt(e.clientX));
    e.preventDefault();
  });
  track.addEventListener('pointermove', (e) => {
    if (dragging) renderer.seek(ratioAt(e.clientX));
  });
  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    if (wasPlaying) renderer.play();
  };
  track.addEventListener('pointerup', endDrag);
  track.addEventListener('pointercancel', endDrag);

  // Spacebar toggles play/pause (unless typing in a field).
  const onKey = (e) => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    const el = document.activeElement;
    const tag = el && el.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (el && el.isContentEditable)) return;
    e.preventDefault();
    renderer.toggle();
  };
  document.addEventListener('keydown', onKey);

  // Initial paint.
  onFrame(renderer.getTime ? renderer.getTime() : 0, renderer.isPlaying ? renderer.isPlaying() : true);
}
