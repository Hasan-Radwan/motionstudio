import { openModal } from './modal.js';
import { exportVideo, webCodecsAvailable } from '../engine/exporter.js';
import { t } from '../i18n.js';
import { currentPlan } from '../account/account.js';
import { openPlansModal } from './plansModal.js';

const ASPECTS = ['16:9', '1:1', '9:16', '4:5', '4:3'];
const QUALITIES = [
  { label: '720p', value: 720 },
  { label: '1080p', value: 1080 },
  { label: '2K', value: 1440 },
  { label: '4K', value: 2160 },
  { label: '8K', value: 4320 },
];
const FPS_OPTS = [24, 30, 60];

function aspectRatio(a) {
  const [w, h] = a.split(':').map(Number);
  return w / h;
}

// shorter side = quality; compute even dimensions
function dims(aspect, quality) {
  const r = aspectRatio(aspect);
  let w, h;
  if (r >= 1) {
    h = quality;
    w = Math.round(h * r);
  } else {
    w = quality;
    h = Math.round(w / r);
  }
  return { w: Math.round(w / 2) * 2, h: Math.round(h / 2) * 2 };
}

export function openExportDialog(renderer, templateName, { audio = null } = {}) {
  openModal({
    title: t('Export video'),
    render(body, close) {
      const state = {
        aspect: renderer.aspect,
        quality: 1080,
        fps: 30,
        duration: renderer.duration,
        format: 'mp4',
      };

      const select = (label, opts, value, onChange) => {
        const wrap = document.createElement('label');
        const s = document.createElement('span');
        s.textContent = label;
        const sel = document.createElement('select');
        for (const o of opts) {
          const opt = document.createElement('option');
          opt.value = o.value;
          opt.textContent = o.label;
          if (o.disabled) opt.disabled = true;
          if (String(o.value) === String(value)) opt.selected = true;
          sel.appendChild(opt);
        }
        sel.addEventListener('change', () => onChange(sel.value));
        wrap.append(s, sel);
        return wrap;
      };

      const row1 = document.createElement('div');
      row1.className = 'modal-row';
      row1.append(
        select(
          t('Format'),
          [
            { value: 'mp4', label: 'MP4 (H.264)' },
            { value: 'webm', label: 'WebM (VP9 / alpha)' },
          ],
          state.format,
          (v) => (state.format = v)
        ),
        select(
          t('Aspect'),
          ASPECTS.map((a) => ({ value: a, label: a })),
          state.aspect,
          (v) => {
            state.aspect = v;
            renderer.setAspect(v); // reflect in live preview
          }
        )
      );

      const row2 = document.createElement('div');
      row2.className = 'modal-row';
      // Gate resolution by plan: options above the plan cap are locked, and the
      // default is clamped down so a Free user can't select 4K.
      const maxQ = currentPlan().maxQuality;
      if (state.quality > maxQ) state.quality = maxQ;
      const qualityOpts = QUALITIES.map((q) => ({
        value: q.value,
        label: q.value > maxQ ? `${q.label} 🔒` : q.label,
        disabled: q.value > maxQ,
      }));
      row2.append(
        select(t('Resolution'), qualityOpts, state.quality, (v) => (state.quality = Number(v))),
        select(
          t('FPS'),
          FPS_OPTS.map((f) => ({ value: f, label: f + ' fps' })),
          state.fps,
          (v) => (state.fps = Number(v))
        )
      );

      // Upgrade prompt when the plan caps resolution below 4K.
      let upgradeRow = null;
      if (maxQ < 2160) {
        upgradeRow = document.createElement('button');
        upgradeRow.className = 'btn export-upgrade';
        upgradeRow.style.width = '100%';
        upgradeRow.textContent = `🔒 ${t('Upgrade to export in higher quality')}`;
        upgradeRow.addEventListener('click', () => {
          close();
          openPlansModal();
        });
      }

      const row3 = document.createElement('div');
      row3.className = 'modal-row';
      const durWrap = document.createElement('label');
      const durSpan = document.createElement('span');
      const setDurLabel = () =>
        (durSpan.textContent = `${t('Loop duration')} — ${state.duration.toFixed(1)}s`);
      setDurLabel();
      const dur = document.createElement('input');
      dur.type = 'range';
      dur.min = 1;
      dur.max = 10;
      dur.step = 0.5;
      dur.value = state.duration;
      dur.addEventListener('input', () => {
        state.duration = parseFloat(dur.value);
        renderer.setDuration(state.duration);
        setDurLabel();
      });
      durWrap.append(durSpan, dur);
      row3.appendChild(durWrap);

      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = webCodecsAvailable()
        ? t('Renders offline frame-by-frame — usually faster than the clip length.')
        : t('WebCodecs not available: exporting in realtime as WebM.');

      const progressWrap = document.createElement('div');
      progressWrap.style.display = 'none';
      const bar = document.createElement('div');
      bar.className = 'progress';
      const fill = document.createElement('div');
      fill.className = 'progress-bar';
      bar.appendChild(fill);
      const pct = document.createElement('div');
      pct.className = 'muted';
      progressWrap.append(bar, pct);

      const go = document.createElement('button');
      go.className = 'btn btn-primary';
      go.style.width = '100%';
      go.style.height = '40px';
      go.textContent = t('Render & download');

      go.addEventListener('click', async () => {
        const { w, h } = dims(state.aspect, state.quality);
        const transparent = state.format === 'webm' && renderer.isTransparent();
        go.disabled = true;
        go.textContent = t('Rendering…');
        progressWrap.style.display = 'block';
        try {
          const blob = await exportVideo({
            drawScene: (ctx, W, H, t) => renderer.drawScene(ctx, W, H, t),
            width: w,
            height: h,
            fps: state.fps,
            duration: state.duration,
            format: state.format,
            transparent,
            audio,
            onProgress: (p) => {
              fill.style.width = `${Math.round(p * 100)}%`;
              pct.textContent = `${Math.round(p * 100)}%`;
            },
          });
          downloadBlob(
            blob,
            `motion-${(templateName || 'clip')
              .toLowerCase()
              .replace(/\s+/g, '-')}-${w}x${h}.${state.format}`
          );
          go.textContent = t('Done ✓ — download again');
          go.disabled = false;
        } catch (err) {
          console.error(err);
          pct.textContent = t('Export failed: ') + (err?.message || err);
          go.textContent = t('Retry');
          go.disabled = false;
        }
      });

      body.append(row1, row2, row3, note, progressWrap, go);
      if (upgradeRow) body.insertBefore(upgradeRow, row3);
    },
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
