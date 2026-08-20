import './styles/app.css';
import './assets/webfonts.js';
import { preloadWebFonts } from './assets/webfonts.js';
import { Renderer } from './engine/renderer.js';
import {
  TEMPLATES,
  getTemplate,
  defaultParams,
  getPlaceholder,
  mediaConfig,
} from './templates/index.js';
import { buildGallery } from './ui/templateGallery.js';
import { buildTimeline } from './ui/timeline.js';
import { buildPanel } from './ui/controlsPanel.js';
import { buildMediaPanel } from './ui/mediaPanel.js';
import { buildBackgroundPanel } from './ui/backgroundPanel.js';
import { buildTextPanel } from './ui/textPanel.js';
import { buildWatermarkPanel } from './ui/watermarkPanel.js';
import { buildAudioPanel } from './ui/audioPanel.js';
import { audioAllowed, fontsAllowed } from './account/account.js';
import { DEFAULT_FONT } from './assets/fonts.js';
import { loadFontFromBlob } from './assets/fontLoader.js';
import { initDropzone, loadImageFromBlob } from './ui/dropzone.js';
import { setCardShape } from './engine/canvasUtils.js';
import { initLanding } from './landing/landing.js';
import { t, isRTL, toggleLang, onLang, setLang } from './i18n.js';
import { onAuth, currentUser, signOut, isSignedIn } from './auth/auth.js';
import { currentPlan, onPlan, syncEntitlement } from './account/account.js';
import { openAuthModal } from './ui/authModal.js';
import { openPlansModal } from './ui/plansModal.js';
import { setProjectScope } from './store/projects.js';
import { openExportDialog } from './ui/exportDialog.js';
import { openModal } from './ui/modal.js';
import { BACKGROUNDS, DEFAULT_BACKGROUND } from './assets/backgrounds.js';
import { MOCKUPS, DEFAULT_MOCKUP, paintMockupPreview } from './assets/mockups.js';
import {
  autosave,
  loadAutosave,
  saveProject,
  listProjects,
  deleteProject,
  imageToBlob,
  thumbURL,
} from './store/projects.js';

// ---------- DOM ----------
const $ = (id) => document.getElementById(id);
const canvas = $('preview-canvas');
const stageWrapEl = $('stage-canvas-wrap');
const galleryEl = $('gallery');
const controlsEl = $('panel-controls');
const mediaEl = $('panel-media');
const bgEl = $('panel-background');
const textEl = $('panel-text');
const wmEl = $('panel-watermark');
const wmInput = $('wm-input');
const bgInput = $('bg-input');
const fontInput = $('font-input');
const audioEl = $('panel-audio');
const audioInput = $('audio-input');
const previewAudio = $('preview-audio');
const stageEl = $('stage');
const hintEl = $('stage-hint');
const metaEl = $('stage-meta');
const slotInput = $('slot-input');

// ---------- State ----------
const renderer = new Renderer(canvas);
const state = {
  templateId: TEMPLATES[0].id,
  params: defaultParams(TEMPLATES[0]),
  background: DEFAULT_BACKGROUND,
  mockupId: DEFAULT_MOCKUP.id,
  // image slots: each null or { img: HTMLImageElement, blob: Blob }
  slots: [],
  slotCount: 1,
  // global card shape applied by card-based templates
  cardShape: 'original',
  // user-uploaded fonts: { id, name, family, blob }
  customFonts: [],
  // optional audio track (Pro): { blob, name, volume, url }
  audio: { blob: null, name: '', volume: 100, url: null },
  // optional text overlays (one or more independent layers)
  texts: [makeText()],
  // optional logo watermark (img/blob filled when the user adds a logo)
  watermark: makeWatermark(),
};

// A fresh watermark config (no logo yet).
function makeWatermark() {
  return {
    enabled: true,
    size: 14,
    corner: 'br',
    opacity: 90,
    margin: 4,
    img: null,
    blob: null,
  };
}

// A fresh text layer with sensible defaults.
function makeText() {
  return {
    content: '',
    font: DEFAULT_FONT.id,
    weight: 700,
    size: 7,
    color: '#ffffff',
    align: 'center',
    dir: 'auto',
    x: 50,
    y: 82,
    anim: 'none',
  };
}

let gallery;
let pendingSlot = 0; // which slot a file-picker result should fill

function currentTemplate() {
  return getTemplate(state.templateId);
}

function hasAnyImage() {
  return state.slots.some((s) => s && s.img);
}

// Filled images in slot order, for the renderer.
function filledImages() {
  return state.slots.filter((s) => s && s.img).map((s) => s.img);
}

// ---------- Autosave (debounced) ----------
let saveTimer = null;
function scheduleAutosave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    autosave({
      templateId: state.templateId,
      params: state.params,
      background: serializeBackground(state.background),
      backgroundImageBlob: state.background?.type === 'image' ? state.background.blob : null,
      mockupId: state.mockupId,
      aspect: renderer.aspect,
      duration: renderer.duration,
      slotCount: state.slotCount,
      cardShape: state.cardShape,
      customFonts: state.customFonts.map((f) => ({ id: f.id, name: f.name, family: f.family, blob: f.blob })),
      audio: { name: state.audio.name, volume: state.audio.volume, blob: state.audio.blob },
      texts: state.texts,
      watermark: serializeWatermark(state.watermark),
      watermarkBlob: state.watermark.blob || null,
      imageBlobs: state.slots.map((s) => (s && s.blob) || null),
    });
  }, 400);
}

// Watermark config without the runtime image/blob (persisted separately as a Blob).
function serializeWatermark(wm) {
  const { enabled, size, corner, opacity, margin } = wm || {};
  return { enabled, size, corner, opacity, margin };
}

// Background without any runtime image (an HTMLImageElement can't be structured-
// cloned into IndexedDB); the image bytes persist separately as backgroundImageBlob.
function serializeBackground(bg) {
  if (bg && bg.type === 'image') {
    const { img, blob, ...rest } = bg;
    return rest;
  }
  return bg;
}

// Size the canvas element to fill its container while preserving the current
// aspect ratio — grows and shrinks so the preview always "fits" the stage,
// including right after an aspect-ratio change or a window/panel resize.
function fitCanvas() {
  const cs = getComputedStyle(stageWrapEl);
  const padX = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
  const padY = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const availW = stageWrapEl.clientWidth - padX;
  const availH = stageWrapEl.clientHeight - padY;
  if (availW <= 0 || availH <= 0) return;
  const r = renderer.aspectRatio();
  let dw = availW;
  let dh = dw / r;
  if (dh > availH) {
    dh = availH;
    dw = dh * r;
  }
  canvas.style.width = Math.round(dw) + 'px';
  canvas.style.height = Math.round(dh) + 'px';
}

function updateMeta() {
  const tpl = currentTemplate();
  const n = filledImages().length;
  const imgNote = n
    ? ` · ${n} ${n === 1 ? t('image') : t('images')}`
    : ` · ${t('demo image')}`;
  metaEl.textContent = `${tpl.name} · ${renderer.aspect} · ${renderer.duration.toFixed(
    1
  )}s ${t('loop')}${imgNote}`;
}

// ---------- Template selection ----------
function selectTemplate(tpl, keepParams = false, keepSlots = false) {
  state.templateId = tpl.id;
  if (!keepParams) state.params = defaultParams(tpl);
  renderer.setTemplate(tpl).setParams(state.params);
  buildPanel(controlsEl, tpl, state.params, (key, value) => {
    state.params = { ...state.params, [key]: value };
    renderer.setParams(state.params);
    scheduleAutosave();
  });
  const mc = mediaConfig(tpl);
  // On template switch, adopt the new template's default slot count; when
  // restoring a saved project we keep the stored count (clamped to limits).
  const target = keepSlots
    ? Math.min(mc.max, Math.max(mc.min, state.slotCount))
    : mc.default;
  resizeSlots(target);
  gallery?.setActive(tpl.id);
  applyImages();
  renderMedia();
  updateMeta();
  scheduleAutosave();
}

// ---------- Image slots ----------
function resizeSlots(n) {
  state.slotCount = n;
  const next = new Array(n).fill(null);
  for (let i = 0; i < n; i++) next[i] = state.slots[i] || null;
  state.slots = next;
}

// Push the filled images into the renderer and toggle the empty-stage hint.
function applyImages() {
  renderer.setImages(filledImages());
  hintEl.classList.toggle('hidden', hasAnyImage());
}

function setSlotImage(index, img, file) {
  if (index < 0 || index >= state.slotCount) return;
  const entry = { img, blob: null };
  state.slots[index] = entry;
  imageToBlob(img, file).then((blob) => {
    if (state.slots[index] === entry) {
      entry.blob = blob;
      scheduleAutosave();
    }
  });
  applyImages();
  renderMedia();
  updateMeta();
  scheduleAutosave();
}

function clearSlot(index) {
  state.slots[index] = null;
  applyImages();
  renderMedia();
  updateMeta();
  scheduleAutosave();
}

function setSlotCount(n) {
  const mc = mediaConfig(currentTemplate());
  resizeSlots(Math.min(mc.max, Math.max(mc.min, n)));
  applyImages();
  renderMedia();
  updateMeta();
  scheduleAutosave();
}

function setAspect(a) {
  renderer.setAspect(a);
  fitCanvas();
  renderMedia();
  updateMeta();
  scheduleAutosave();
}

function firstEmptySlot() {
  const i = state.slots.findIndex((s) => !s || !s.img);
  return i >= 0 ? i : 0;
}

// Route a picked/dropped/pasted file to a slot (default: first empty).
async function receiveFile(file, index = firstEmptySlot()) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = await loadImageFromBlob(file);
  setSlotImage(index, img, file);
}

// ---------- Media panel ----------
function renderMedia() {
  const mc = mediaConfig(currentTemplate());
  buildMediaPanel(
    mediaEl,
    {
      aspect: renderer.aspect,
      count: state.slotCount,
      min: mc.min,
      max: mc.max,
      slots: state.slots,
      cardShape: state.cardShape,
    },
    {
      onAspect: setAspect,
      onCount: setSlotCount,
      onPick: (i) => {
        pendingSlot = i;
        slotInput.click();
      },
      onClear: clearSlot,
      onDropFile: (i, file) => receiveFile(file, i),
      onCardShape: setCardShapeChoice,
    }
  );
}

// Change the global card shape (applies live to every card-based template).
function setCardShapeChoice(shape) {
  state.cardShape = shape;
  setCardShape(shape);
  renderMedia(); // refresh the active button
  scheduleAutosave();
}

// ---------- Background editor (inline, under the settings) ----------
function renderBackground() {
  buildBackgroundPanel(bgEl, {
    background: state.background,
    onChange: (bg) => {
      state.background = bg;
      renderer.setBackground(bg);
      scheduleAutosave();
    },
    onPickImage: () => bgInput.click(),
    onClearImage: () => {
      state.background = DEFAULT_BACKGROUND;
      renderer.setBackground(state.background);
      renderBackground();
      scheduleAutosave();
    },
  });
}

// Receive a picked image file to use as the background.
async function receiveBackgroundImage(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = await loadImageFromBlob(file);
  const blob = await imageToBlob(img, file);
  const prev = state.background;
  state.background = {
    id: 'custom-image',
    name: 'Image',
    type: 'image',
    img,
    blob,
    fit: prev?.type === 'image' ? prev.fit || 'cover' : 'cover',
    dim: prev?.type === 'image' ? prev.dim ?? 0 : 0,
  };
  renderer.setBackground(state.background);
  renderBackground();
  scheduleAutosave();
}

// ---------- Text overlay editor ----------
function renderText() {
  buildTextPanel(textEl, {
    texts: state.texts,
    // Editing an existing layer: update in place, do NOT rebuild the panel so the
    // textarea keeps focus while typing.
    onChange: (index, patch) => {
      state.texts = state.texts.map((tx, i) => (i === index ? { ...tx, ...patch } : tx));
      renderer.setTexts(state.texts);
      scheduleAutosave();
    },
    onAdd: () => {
      state.texts = [...state.texts, makeText()];
      renderer.setTexts(state.texts);
      renderText(); // rebuild so the new layer's fields appear
      scheduleAutosave();
    },
    onRemove: (index) => {
      state.texts = state.texts.filter((_, i) => i !== index);
      if (!state.texts.length) state.texts = [makeText()];
      renderer.setTexts(state.texts);
      renderText();
      scheduleAutosave();
    },
    onUploadFont: () => {
      if (!fontsAllowed()) return openPlansModal();
      fontInput.click();
    },
    onUpgrade: openPlansModal,
  });
}

// Register an uploaded font file, then make the new font available in the picker.
async function receiveFont(file) {
  if (!file) return;
  if (!fontsAllowed()) {
    openPlansModal();
    return;
  }
  try {
    const { id, name, family } = await loadFontFromBlob(file, file.name);
    state.customFonts.push({ id, name, family, blob: file });
    renderText(); // rebuild so the Font picker shows it
    scheduleAutosave();
  } catch (e) {
    console.error('Font load failed', e);
  }
}

// ---------- Watermark (logo) editor ----------
function renderWatermark() {
  buildWatermarkPanel(wmEl, {
    watermark: state.watermark,
    // Slider/toggle/corner edits: persist + push to renderer, no rebuild (the RAF
    // loop repaints automatically). Corner buttons manage their own active state.
    onChange: (patch) => {
      state.watermark = { ...state.watermark, ...patch };
      renderer.setWatermark(state.watermark);
      scheduleAutosave();
    },
    onPickLogo: () => wmInput.click(),
    onClearLogo: () => {
      state.watermark = { ...state.watermark, img: null, blob: null };
      renderer.setWatermark(state.watermark);
      renderWatermark();
      scheduleAutosave();
    },
  });
}

// Receive a picked logo file for the watermark.
async function receiveWatermarkLogo(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = await loadImageFromBlob(file);
  const blob = await imageToBlob(img, file);
  state.watermark = { ...state.watermark, img, blob, enabled: true };
  renderer.setWatermark(state.watermark);
  renderWatermark();
  scheduleAutosave();
}

// ---------- Audio (Pro) ----------
let audioPlaying = false;

function renderAudio() {
  buildAudioPanel(audioEl, {
    audio: state.audio,
    playing: audioPlaying,
    onPick: () => audioInput.click(),
    onClear: clearAudio,
    onChange: (patch) => {
      state.audio = { ...state.audio, ...patch };
      applyAudioVolume();
      scheduleAutosave();
    },
    onTogglePlay: () => {
      if (audioPlaying) previewAudio.pause();
      else previewAudio.play().catch(() => {});
    },
    onUpgrade: openPlansModal,
  });
}

function applyAudioVolume() {
  previewAudio.volume = Math.max(0, Math.min(1, (state.audio.volume ?? 100) / 100));
}

// Point the preview <audio> at the current track (or clear it).
function applyAudioSource() {
  if (state.audio.url) {
    if (previewAudio.src !== state.audio.url) previewAudio.src = state.audio.url;
    applyAudioVolume();
  } else {
    previewAudio.removeAttribute('src');
    previewAudio.load();
  }
}

async function receiveAudio(file) {
  if (!file || !file.type.startsWith('audio/')) return;
  if (!audioAllowed()) {
    openPlansModal();
    return;
  }
  if (state.audio.url) URL.revokeObjectURL(state.audio.url);
  const url = URL.createObjectURL(file);
  state.audio = { blob: file, name: file.name, volume: state.audio.volume ?? 100, url };
  applyAudioSource();
  previewAudio.play().catch(() => {});
  renderAudio();
  scheduleAutosave();
}

function clearAudio() {
  previewAudio.pause();
  if (state.audio.url) URL.revokeObjectURL(state.audio.url);
  state.audio = { blob: null, name: '', volume: state.audio.volume ?? 100, url: null };
  applyAudioSource();
  renderAudio();
  scheduleAutosave();
}

previewAudioBindings();
function previewAudioBindings() {
  // keep the panel play/pause button in sync with actual playback state
  previewAudio.addEventListener('play', () => {
    audioPlaying = true;
    renderAudio();
  });
  previewAudio.addEventListener('pause', () => {
    audioPlaying = false;
    renderAudio();
  });
}

// ---------- Mockup picker ----------
function openMockupPicker() {
  openModal({
    title: t('Device mockup'),
    render(body) {
      const grid = document.createElement('div');
      grid.className = 'grid-choices';
      for (const m of MOCKUPS) {
        const btn = document.createElement('button');
        btn.className = 'choice' + (m.id === state.mockupId ? ' active' : '');
        const cv = document.createElement('canvas');
        cv.className = 'choice-preview';
        const label = document.createElement('span');
        label.className = 'choice-label';
        label.textContent = t(m.name);
        btn.append(cv, label);
        grid.appendChild(btn);
        requestAnimationFrame(() => paintMockupPreview(cv, m));
        btn.addEventListener('click', () => {
          state.mockupId = m.id;
          renderer.setMockup(m);
          [...grid.children].forEach((c) => c.classList.remove('active'));
          btn.classList.add('active');
          scheduleAutosave();
        });
      }
      body.appendChild(grid);
    },
  });
}

// ---------- Projects ----------
function openProjects() {
  openModal({
    title: t('My projects'),
    async render(body, close) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'btn btn-primary';
      saveBtn.style.width = '100%';
      saveBtn.style.marginBottom = '14px';
      saveBtn.textContent = t('Save current project');
      saveBtn.addEventListener('click', async () => {
        await saveProject({
          name: currentTemplate().name,
          templateId: state.templateId,
          params: state.params,
          background: serializeBackground(state.background),
          backgroundImageBlob: state.background?.type === 'image' ? state.background.blob : null,
          mockupId: state.mockupId,
          aspect: renderer.aspect,
          duration: renderer.duration,
          slotCount: state.slotCount,
          cardShape: state.cardShape,
          customFonts: state.customFonts.map((f) => ({ id: f.id, name: f.name, family: f.family, blob: f.blob })),
          audio: { name: state.audio.name, volume: state.audio.volume, blob: state.audio.blob },
          texts: state.texts,
          watermark: serializeWatermark(state.watermark),
          watermarkBlob: state.watermark.blob || null,
          imageBlobs: state.slots.map((s) => (s && s.blob) || null),
        });
        close();
        openProjects();
      });
      body.appendChild(saveBtn);

      const listWrap = document.createElement('div');
      body.appendChild(listWrap);
      const projects = await listProjects();
      if (!projects.length) {
        const empty = document.createElement('div');
        empty.className = 'empty';
        empty.textContent = t('No saved projects yet. Save one to reopen it later.');
        listWrap.appendChild(empty);
        return;
      }
      for (const rec of projects) {
        const item = document.createElement('div');
        item.className = 'project-item';
        const url = thumbURL(rec);
        if (url) {
          const img = document.createElement('img');
          img.src = url;
          item.appendChild(img);
        }
        const meta = document.createElement('div');
        meta.className = 'p-meta';
        const name = document.createElement('div');
        name.className = 'p-name';
        name.textContent = rec.name || 'Untitled';
        const sub = document.createElement('div');
        sub.className = 'p-sub';
        sub.textContent = `${rec.aspect} · ${new Date(
          rec.updatedAt
        ).toLocaleString()}`;
        meta.append(name, sub);
        item.appendChild(meta);

        const openBtn = document.createElement('button');
        openBtn.className = 'link-btn';
        openBtn.textContent = t('Open');
        openBtn.addEventListener('click', async () => {
          await restoreState(rec);
          close();
        });
        const delBtn = document.createElement('button');
        delBtn.className = 'link-btn danger';
        delBtn.textContent = t('Delete');
        delBtn.addEventListener('click', async () => {
          await deleteProject(rec.key);
          item.remove();
        });
        item.append(openBtn, delBtn);
        listWrap.appendChild(item);
      }
    },
  });
}

// ---------- Restore ----------
async function restoreState(rec) {
  // New saves store the full background object; old saves stored just an id.
  let bg =
    rec.background ||
    BACKGROUNDS.find((b) => b.id === rec.backgroundId) ||
    DEFAULT_BACKGROUND;
  // Re-decode a custom image background from its saved Blob (falls back if lost).
  if (bg.type === 'image') {
    if (rec.backgroundImageBlob) {
      const img = await loadImageFromBlob(rec.backgroundImageBlob);
      bg = { ...bg, img, blob: rec.backgroundImageBlob };
    } else {
      bg = DEFAULT_BACKGROUND;
    }
  }
  const mock = MOCKUPS.find((m) => m.id === rec.mockupId) || DEFAULT_MOCKUP;
  state.background = bg;
  state.mockupId = mock.id;
  renderer.setBackground(bg).setMockup(mock);
  renderBackground();
  // New saves store texts[]; old saves stored a single text object.
  const restoredTexts = Array.isArray(rec.texts)
    ? rec.texts
    : rec.text
      ? [rec.text]
      : null;
  if (restoredTexts && restoredTexts.length) {
    state.texts = restoredTexts.map((tx) => ({ ...makeText(), ...tx }));
    renderer.setTexts(state.texts);
    renderText();
  }

  // Restore the watermark config, then re-decode its logo blob if present.
  state.watermark = { ...makeWatermark(), ...(rec.watermark || {}), img: null, blob: null };
  if (rec.watermarkBlob) {
    const img = await loadImageFromBlob(rec.watermarkBlob);
    state.watermark = { ...state.watermark, img, blob: rec.watermarkBlob };
  }
  renderer.setWatermark(state.watermark);
  renderWatermark();

  // Restore the audio track (recreate its object URL from the saved blob).
  if (state.audio.url) URL.revokeObjectURL(state.audio.url);
  const ra = rec.audio;
  state.audio =
    ra && ra.blob
      ? { blob: ra.blob, name: ra.name || 'audio', volume: ra.volume ?? 100, url: URL.createObjectURL(ra.blob) }
      : { blob: null, name: '', volume: ra?.volume ?? 100, url: null };
  applyAudioSource();
  renderAudio();

  // Restore the global card shape.
  state.cardShape = rec.cardShape || 'original';
  setCardShape(state.cardShape);

  // Re-register any uploaded fonts (keeping their stable family names) so text
  // layers referencing them render again.
  state.customFonts = [];
  for (const f of rec.customFonts || []) {
    if (!f?.blob) continue;
    try {
      await loadFontFromBlob(f.blob, f.name, f.family);
      state.customFonts.push({ id: f.id, name: f.name, family: f.family, blob: f.blob });
    } catch (e) {
      console.warn('Could not restore font', f.name, e);
    }
  }

  if (rec.aspect) renderer.setAspect(rec.aspect);
  if (rec.duration) renderer.setDuration(rec.duration);

  const tpl = getTemplate(rec.templateId);
  state.params = { ...defaultParams(tpl), ...(rec.params || {}) };

  // New saves store imageBlobs[]; old saves stored a single imageBlob.
  const blobs = rec.imageBlobs || (rec.imageBlob ? [rec.imageBlob] : []);
  const mc = mediaConfig(tpl);
  const count = Math.min(
    mc.max,
    Math.max(mc.min, rec.slotCount || blobs.length || mc.default)
  );
  state.slotCount = count;
  state.slots = new Array(count).fill(null);
  await Promise.all(
    blobs.slice(0, count).map(async (blob, i) => {
      if (!blob) return;
      const img = await loadImageFromBlob(blob);
      state.slots[i] = { img, blob };
    })
  );

  selectTemplate(tpl, true, true); // keep params + restored slots
  fitCanvas();
}

// ---------- Account ----------
// Record the signed-in user in the server directory (for the admin dashboard).
function trackUser(user) {
  if (!user?.email) return;
  fetch('/api/user/track', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email: user.email, name: user.name, provider: user.provider || 'local' }),
  }).catch(() => {});
}

function updateAccountButton() {
  const btn = $('btn-account');
  if (!btn) return;
  const u = currentUser();
  btn.textContent = u ? `${u.name} · ${u ? currentPlan().name : ''}` : t('Sign in');
}

function openAccountMenu() {
  const u = currentUser();
  openModal({
    title: t('Account'),
    render(body, close) {
      const info = document.createElement('div');
      info.className = 'account-info';
      info.innerHTML = `
        <div class="account-row"><span>${t('Signed in as')}</span><b>${u.email}</b></div>
        <div class="account-row"><span>${t('Plan')}</span><b>${currentPlan().name}</b></div>`;
      const upgrade = document.createElement('button');
      upgrade.className = 'btn btn-primary';
      upgrade.style.width = '100%';
      upgrade.textContent = t('Choose your plan');
      upgrade.addEventListener('click', () => {
        close();
        openPlansModal();
      });
      const out = document.createElement('button');
      out.className = 'btn';
      out.style.width = '100%';
      out.textContent = t('Sign out');
      out.addEventListener('click', () => {
        signOut();
        close();
      });
      body.append(info, upgrade, out);
    },
  });
}

function onAccountClick() {
  if (isSignedIn()) openAccountMenu();
  else openAuthModal({ onDone: () => {} });
}

// ---------- Localization ----------
// Re-apply the current language across the studio chrome + data-driven panels,
// and flip the layout direction (RTL for Arabic). Called on boot and whenever
// the language changes.
function relocalizeStudio() {
  appEl.dir = isRTL() ? 'rtl' : 'ltr';
  $('btn-projects').textContent = t('My projects');
  $('btn-export').textContent = t('Export');
  $('btn-home').textContent = t('Home');
  $('btn-lang').textContent = isRTL() ? 'EN' : 'ع';
  updateAccountButton();
  hintEl.innerHTML = `<p>${t('Drop an image anywhere to start.')}</p>`;
  // Rebuild the gallery (category titles) and the data-driven panels.
  gallery = buildGallery(galleryEl, {
    activeId: state.templateId,
    onSelect: (tpl) => selectTemplate(tpl),
  });
  selectTemplate(currentTemplate(), true, true); // rebuild controls + media, keep params/slots
  renderText();
  renderWatermark();
  renderBackground();
  renderAudio();
  updateMeta();
}

// ---------- Boot ----------
async function boot() {
  gallery = buildGallery(galleryEl, {
    activeId: state.templateId,
    onSelect: (tpl) => selectTemplate(tpl),
  });

  // Stage drop / paste fill the first empty slot (per-slot upload lives in the
  // media panel). No topbar upload button any more.
  initDropzone({
    stage: stageEl,
    fileInput: $('file-input'),
    uploadBtn: null,
    onImage: (img, file) => setSlotImage(firstEmptySlot(), img, file),
  });

  // Per-slot picker (the "+" / thumbnail click in the media panel).
  slotInput.addEventListener('change', () => {
    const file = slotInput.files?.[0];
    if (file) receiveFile(file, pendingSlot);
    slotInput.value = '';
  });

  // Watermark logo picker.
  wmInput.addEventListener('change', () => {
    const file = wmInput.files?.[0];
    if (file) receiveWatermarkLogo(file);
    wmInput.value = '';
  });

  // Background image picker.
  bgInput.addEventListener('change', () => {
    const file = bgInput.files?.[0];
    if (file) receiveBackgroundImage(file);
    bgInput.value = '';
  });

  // Custom font picker.
  fontInput.addEventListener('change', () => {
    const file = fontInput.files?.[0];
    if (file) receiveFont(file);
    fontInput.value = '';
  });

  // Audio picker.
  audioInput.addEventListener('change', () => {
    const file = audioInput.files?.[0];
    if (file) receiveAudio(file);
    audioInput.value = '';
  });

  $('btn-projects').addEventListener('click', openProjects);
  $('btn-export').addEventListener('click', () =>
    openExportDialog(renderer, currentTemplate().name, {
      audio: audioAllowed() && state.audio.blob ? { blob: state.audio.blob, volume: state.audio.volume } : null,
    })
  );
  $('btn-home').addEventListener('click', goHome);
  $('brand-home').addEventListener('click', goHome);
  $('btn-lang').addEventListener('click', () => toggleLang());
  $('btn-account').addEventListener('click', onAccountClick);
  // Keep the account button + project scope in sync with auth/plan changes.
  onAuth((user) => {
    setProjectScope(user?.id || '');
    updateAccountButton();
    if (user?.email) {
      syncEntitlement(user.email); // adopt server-confirmed plan
      trackUser(user); // add to the admin user directory
    }
  });
  onPlan(() => {
    updateAccountButton();
    renderAudio(); // audio panel gate depends on the plan
  });
  setProjectScope(currentUser()?.id || '');
  if (currentUser()?.email) {
    syncEntitlement(currentUser().email);
    trackUser(currentUser());
  }
  // Re-check entitlement when the tab regains focus, so a cancellation (made
  // elsewhere) drops Pro in this open session without needing a full reload.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && currentUser()?.email) {
      syncEntitlement(currentUser().email);
    }
  });
  // Language changes (from here or the landing) re-localize the studio if booted.
  onLang(() => {
    if (studioBooted) relocalizeStudio();
  });

  // defaults
  renderer
    .setBackground(state.background)
    .setMockup(DEFAULT_MOCKUP)
    .setPlaceholder(getPlaceholder())
    .setTexts(state.texts)
    .setWatermark(state.watermark);
  setCardShape(state.cardShape);
  selectTemplate(currentTemplate());
  renderBackground();
  renderText();
  renderWatermark();
  renderAudio();
  fitCanvas();
  // Keep the preview fitted as the stage area changes (window resize, panels).
  new ResizeObserver(fitCanvas).observe(stageWrapEl);
  buildTimeline($('stage-timeline'), renderer); // play/pause + scrubber under the stage
  renderer.start();

  // Apply the current language to the studio chrome + layout direction. The
  // panels/gallery already built in the current language (they call t()), so this
  // mainly fixes the static topbar/hint and flips RTL.
  appEl.dir = isRTL() ? 'rtl' : 'ltr';
  $('btn-projects').textContent = t('My projects');
  $('btn-export').textContent = t('Export');
  $('btn-home').textContent = t('Home');
  $('btn-lang').textContent = isRTL() ? 'EN' : 'ع';
  updateAccountButton();
  hintEl.innerHTML = `<p>${t('Drop an image anywhere to start.')}</p>`;

  // Fetch Arabic web-font glyphs in the background; the RAF preview loop adopts
  // them on font-swap, so Arabic text sharpens up as soon as they arrive.
  preloadWebFonts();

  // restore last session if present
  const saved = await loadAutosave();
  if (saved && saved.templateId) {
    await restoreState(saved);
  }
}

// ---------- Landing ↔ Studio routing ----------
// Three real, bookmarkable URLs on one Worker/one JS bundle:
//   /     — English marketing (pre-rendered, primary/default language)
//   /ar   — Arabic marketing (pre-rendered)
//   /app  — the studio (client-rendered SPA, not indexed)
// Landing→studio is a soft transition (pushState, no reload) for speed; studio→
// home is also soft, rebuilding the landing markup only if its language no
// longer matches the studio's current language (e.g. user switched language
// while inside the studio).
const landingEl = $('landing');
const appEl = $('app');
let studioBooted = false;
let landingLang = location.pathname.startsWith('/ar') ? 'ar' : 'en';

function showStudio() {
  landingEl.classList.add('hidden');
  appEl.classList.remove('hidden');
  window.scrollTo(0, 0);
  if (!studioBooted) {
    studioBooted = true;
    boot();
  } else {
    renderer.start();
    fitCanvas();
  }
}

function showLanding(lang) {
  appEl.classList.add('hidden');
  landingEl.classList.remove('hidden');
  renderer.stop();
  previewAudio.pause();
  window.scrollTo(0, 0);
  if (lang !== landingLang) {
    landingLang = lang;
    initLanding(landingEl, landingLang, { onLaunch: enterStudio });
  }
}

// Called by the landing page's CTA buttons.
function enterStudio() {
  setLang(landingLang); // carry the marketing page's language into the studio
  if (location.pathname !== '/app') history.pushState({ view: 'app' }, '', '/app');
  showStudio();
  window.trackPageView?.('/app'); // GA4 page_view for the soft route change
}

// Called by the studio's Home button.
function goHome() {
  const target = isRTL() ? '/ar' : '/';
  if (location.pathname !== target) history.pushState({ view: 'landing' }, '', target);
  showLanding(isRTL() ? 'ar' : 'en');
  window.trackPageView?.(target);
}

window.addEventListener('popstate', () => {
  if (location.pathname === '/app') showStudio();
  else showLanding(location.pathname.startsWith('/ar') ? 'ar' : 'en');
  window.trackPageView?.(location.pathname);
});

initLanding(landingEl, landingLang, { onLaunch: enterStudio });
if (location.pathname === '/app') showStudio();
