// Playback timeline shown under the preview stage: a play/pause button, a
// scrubbable progress track, and a seconds readout driven by the renderer's
// current loop time and the active template's loop duration.

const PLAY_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M8 5.14v13.72a1 1 0 0 0 1.53.85l10.79-6.86a1 1 0 0 0 0-1.7L9.53 4.29A1 1 0 0 0 8 5.14z"/></svg>';
const PAUSE_ICON =
  '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path fill="currentColor" d="M7 4h4v16H7zM13 4h4v16h-4z"/></svg>';

const fmt = (s) => `${s.toFixed(1)}s`;

export function buildTimeline(root, renderer) {
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

  root.append(play, track, time);

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
