// Local project persistence via IndexedDB (idb-keyval). Nothing leaves the device.
// A project stores: template id, params, background id, mockup id, aspect, duration,
// and the source image as a Blob (so it survives reloads).

import { get, set, del, keys } from 'idb-keyval';

const PREFIX = 'project:';
const AUTOSAVE_KEY = 'autosave';

// Saved projects are namespaced by signed-in user so each account sees only its
// own. Guests use the empty scope (and still see legacy un-namespaced projects).
let scope = '';
export function setProjectScope(userId) {
  scope = userId ? `${userId}:` : '';
}

function id() {
  return PREFIX + scope + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// blob for the current image (from the original File if available, else from canvas)
export async function imageToBlob(imageEl, originalFile) {
  if (originalFile instanceof Blob) return originalFile;
  if (!imageEl) return null;
  // draw onto a canvas and export png
  const c = document.createElement('canvas');
  c.width = imageEl.width || imageEl.naturalWidth;
  c.height = imageEl.height || imageEl.naturalHeight;
  c.getContext('2d').drawImage(imageEl, 0, 0);
  return await new Promise((r) => c.toBlob(r, 'image/png'));
}

export async function saveProject(state, existingKey) {
  const key = existingKey || id();
  const imageBlobs = state.imageBlobs || (state.imageBlob ? [state.imageBlob] : []);
  const record = {
    key,
    name: state.name || 'Untitled',
    templateId: state.templateId,
    params: state.params,
    background: state.background || null,
    backgroundId: state.background?.id || state.backgroundId || null,
    backgroundImageBlob: state.backgroundImageBlob || null,
    mockupId: state.mockupId,
    aspect: state.aspect,
    duration: state.duration,
    slotCount: state.slotCount || imageBlobs.length || 1,
    cardShape: state.cardShape || 'original',
    texts: state.texts || (state.text ? [state.text] : null),
    watermark: state.watermark || null,
    watermarkBlob: state.watermarkBlob || null,
    imageBlobs,
    updatedAt: Date.now(),
  };
  await set(key, record);
  return key;
}

export async function autosave(state) {
  await set(PREFIX + AUTOSAVE_KEY, { ...state, key: PREFIX + AUTOSAVE_KEY, updatedAt: Date.now() });
}

export async function loadAutosave() {
  return (await get(PREFIX + AUTOSAVE_KEY)) || null;
}

export async function listProjects() {
  const all = await keys();
  const base = PREFIX + scope;
  const projectKeys = all.filter((k) => {
    if (typeof k !== 'string' || !k.startsWith(base) || k === PREFIX + AUTOSAVE_KEY) return false;
    // Guests must not see user-namespaced keys (which carry an extra ":segment").
    if (scope === '') return !/^project:[^:]+:/.test(k);
    return true;
  });
  const records = await Promise.all(projectKeys.map((k) => get(k)));
  return records.filter(Boolean).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteProject(key) {
  await del(key);
}

export function thumbURL(record) {
  const first =
    (record?.imageBlobs && record.imageBlobs.find(Boolean)) || record?.imageBlob;
  return first ? URL.createObjectURL(first) : null;
}
