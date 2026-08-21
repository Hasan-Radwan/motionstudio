// Left/right template gallery. Templates are grouped by category into collapsible
// "folders" with a live search box on top — generated entirely from the registry.
import { TEMPLATES, paintThumb } from '../templates/index.js';
import { t as tr } from '../i18n.js';

// Module-level so a rebuild (language switch) doesn't stack duplicate ⌘K listeners.
let _keyHandler = null;

// ---- animated thumbnails ----
// Painted thumbs animate on a shared, throttled rAF loop; only on-screen thumbs
// repaint (IntersectionObserver), and the loop idles while the tab is hidden.
const THUMB_LOOP_MS = 5000; // preview loop length
let _animThumbs = []; // { thumb, tpl, visible }
let _animRaf = null;
let _animLast = 0;
let _thumbIO = null;

function stopThumbAnimator() {
  if (_animRaf) cancelAnimationFrame(_animRaf);
  _animRaf = null;
  if (_thumbIO) _thumbIO.disconnect();
  _thumbIO = null;
  _animThumbs = [];
}

function startThumbAnimator() {
  if (_animRaf) return;
  const tick = (now) => {
    _animRaf = requestAnimationFrame(tick);
    if (typeof document !== 'undefined' && document.hidden) return;
    if (now - _animLast < 42) return; // ~24fps is plenty for previews
    _animLast = now;
    const t = (now % THUMB_LOOP_MS) / THUMB_LOOP_MS;
    for (const e of _animThumbs) {
      if (e.visible) paintThumb(e.thumb, e.tpl, t);
    }
  };
  _animRaf = requestAnimationFrame(tick);
}

export function buildGallery(root, { activeId, onSelect }) {
  root.innerHTML = '';
  stopThumbAnimator(); // reset on rebuild (language switch) to avoid leaks
  _thumbIO = new IntersectionObserver((entries) => {
    for (const en of entries) {
      const a = en.target.__anim;
      if (a) a.visible = en.isIntersecting;
    }
  });
  if (_keyHandler) {
    document.removeEventListener('keydown', _keyHandler);
    _keyHandler = null;
  }

  // Group templates by category, preserving registry order.
  const byCat = new Map();
  for (const t of TEMPLATES) {
    if (!byCat.has(t.category)) byCat.set(t.category, []);
    byCat.get(t.category).push(t);
  }

  // ---- search bar ----
  const search = document.createElement('div');
  search.className = 'gallery-search';
  const input = document.createElement('input');
  input.className = 'gallery-search-input';
  input.type = 'search';
  input.placeholder = `${tr('Search')} ${TEMPLATES.length} ${tr('templates')}`;
  input.setAttribute('aria-label', tr('Search templates'));
  const kbd = document.createElement('span');
  kbd.className = 'gallery-search-kbd';
  const isMac = typeof navigator !== 'undefined' && /Mac|iP(hone|ad|od)/.test(navigator.platform || '');
  kbd.textContent = isMac ? '⌘K' : 'Ctrl K';
  search.append(input, kbd);
  root.appendChild(search);

  const groups = document.createElement('div');
  groups.className = 'gallery-groups';
  root.appendChild(groups);

  const cards = new Map(); // id -> card element
  const painted = new Set(); // ids whose thumb has been painted (lazy, on first open)
  const folders = [];

  const activeCat = (TEMPLATES.find((t) => t.id === activeId) || {}).category;

  for (const [cat, tpls] of byCat) {
    const folder = document.createElement('div');
    folder.className = 'gallery-folder';

    const head = document.createElement('button');
    head.className = 'gallery-folder-head';
    head.type = 'button';
    head.innerHTML =
      `<span class="gallery-folder-name">${tr(cat)}</span>` +
      `<span class="gallery-folder-count">${tpls.length}</span>` +
      `<span class="gallery-folder-chev" aria-hidden="true">›</span>`;
    folder.appendChild(head);

    const body = document.createElement('div');
    body.className = 'gallery-folder-body';
    folder.appendChild(body);

    const entries = [];
    for (const tpl of tpls) {
      const card = document.createElement('button');
      card.className = 'tpl-card' + (tpl.id === activeId ? ' active' : '');
      card.type = 'button';
      card.dataset.id = tpl.id;

      const thumb = document.createElement('canvas');
      thumb.className = 'tpl-thumb';
      card.appendChild(thumb);

      const name = document.createElement('span');
      name.className = 'tpl-name';
      name.textContent = tpl.name;
      card.appendChild(name);

      card.addEventListener('click', () => {
        for (const c of cards.values()) c.classList.remove('active');
        card.classList.add('active');
        onSelect(tpl);
      });
      body.appendChild(card);
      cards.set(tpl.id, card);
      entries.push({ tpl, card, thumb });
    }

    // Paint a folder's thumbs the first time it opens (cheaper than painting all
    // ~50 templates up front, and canvases need to be visible to size correctly),
    // then register each for the shared animation loop so previews play live.
    const paintFolder = () => {
      for (const e of entries) {
        if (painted.has(e.tpl.id)) continue;
        painted.add(e.tpl.id);
        const anim = { thumb: e.thumb, tpl: e.tpl, visible: true };
        e.thumb.__anim = anim;
        _animThumbs.push(anim);
        _thumbIO?.observe(e.thumb);
        requestAnimationFrame(() => paintThumb(e.thumb, e.tpl, 0.2));
      }
      startThumbAnimator();
    };
    const setOpen = (open) => {
      folder.classList.toggle('open', open);
      head.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (open) paintFolder();
    };
    head.addEventListener('click', () => setOpen(!folder.classList.contains('open')));

    groups.appendChild(folder);
    folders.push({ cat, folder, entries, setOpen });
  }

  // Open the folder holding the active template (fallback: the first folder).
  const initial = folders.find((f) => f.cat === activeCat) || folders[0];
  initial?.setOpen(true);

  // ---- live search: filter cards, auto-expand matching folders, hide empties ----
  const applyFilter = (raw) => {
    const q = raw.trim().toLowerCase();
    if (!q) {
      for (const f of folders) {
        f.folder.style.display = '';
        for (const e of f.entries) e.card.classList.remove('hidden');
        f.setOpen(f === initial); // restore the default collapse state
      }
      return;
    }
    for (const f of folders) {
      const catHit = tr(f.cat).toLowerCase().includes(q) || f.cat.toLowerCase().includes(q);
      let any = false;
      for (const e of f.entries) {
        const hit = catHit || e.tpl.name.toLowerCase().includes(q);
        e.card.classList.toggle('hidden', !hit);
        if (hit) any = true;
      }
      f.folder.style.display = any ? '' : 'none';
      if (any) f.setOpen(true);
    }
  };
  input.addEventListener('input', () => applyFilter(input.value));

  // ⌘K / Ctrl-K focuses the search box.
  _keyHandler = (ev) => {
    if ((ev.metaKey || ev.ctrlKey) && (ev.key === 'k' || ev.key === 'K')) {
      ev.preventDefault();
      input.focus();
      input.select();
    }
  };
  document.addEventListener('keydown', _keyHandler);

  return {
    setActive(id) {
      for (const [cid, c] of cards) c.classList.toggle('active', cid === id);
      const tpl = TEMPLATES.find((t) => t.id === id);
      if (tpl) folders.find((f) => f.cat === tpl.category)?.setOpen(true);
    },
    repaintThumbs() {
      for (const id of painted) {
        const c = cards.get(id);
        if (c) paintThumb(c.querySelector('canvas'), TEMPLATES.find((t) => t.id === id));
      }
    },
  };
}
