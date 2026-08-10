// Left-hand template gallery, generated from the registry and grouped by category.
import { TEMPLATES, paintThumb } from '../templates/index.js';
import { t as tr } from '../i18n.js';

export function buildGallery(root, { activeId, onSelect }) {
  root.innerHTML = '';
  const byCat = new Map();
  for (const t of TEMPLATES) {
    if (!byCat.has(t.category)) byCat.set(t.category, []);
    byCat.get(t.category).push(t);
  }

  const cards = new Map();
  for (const [cat, tpls] of byCat) {
    const title = document.createElement('div');
    title.className = 'gallery-group-title';
    title.textContent = tr(cat);
    root.appendChild(title);

    for (const tpl of tpls) {
      const card = document.createElement('button');
      card.className = 'tpl-card' + (tpl.id === activeId ? ' active' : '');
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
      root.appendChild(card);
      cards.set(tpl.id, card);
      // paint after it's in the DOM (needs client size)
      requestAnimationFrame(() => paintThumb(thumb, tpl));
    }
  }

  return {
    setActive(id) {
      for (const [cid, c] of cards) c.classList.toggle('active', cid === id);
    },
    repaintThumbs() {
      for (const t of TEMPLATES) {
        const c = cards.get(t.id);
        if (c) paintThumb(c.querySelector('canvas'), t);
      }
    },
  };
}
