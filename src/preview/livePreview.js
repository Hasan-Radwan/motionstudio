// Shared live template-preview engine. Animates any <canvas data-tpl="Template
// Name"> with the template's real Canvas2D render + default sample images, at the
// template's natural aspect ratio. One shared rAF loop + IntersectionObserver keep
// it cheap (offscreen canvases pause). Used by the /templates category pages
// (template-preview.js entry) AND the homepage popular-templates slider.

import { TEMPLATES, defaultParams, getPlaceholder } from '../templates/index.js';
import { sampleCardsSync, loadSampleCards } from '../assets/samples.js';

const ASPECTS = { '16:9': [16, 9], '1:1': [1, 1], '9:16': [9, 16], '4:5': [4, 5], '4:3': [4, 3] };
const LONG = 460; // backing-store long side (CSS scales it to the card width)

const items = [];
let io = null;
let raf = null;

function findTpl(name) {
  return TEMPLATES.find((t) => t.name === name);
}

function mount(cv) {
  if (!cv || cv.dataset.tpvMounted) return;
  const tpl = findTpl(cv.dataset.tpl);
  if (!tpl) return;
  cv.dataset.tpvMounted = '1';
  const [aw, ah] = ASPECTS[tpl.aspect] || ASPECTS['16:9'];
  const w = aw >= ah ? LONG : Math.round((LONG * aw) / ah);
  const h = aw >= ah ? Math.round((LONG * ah) / aw) : LONG;
  cv.width = w;
  cv.height = h;
  cv.style.aspectRatio = `${aw} / ${ah}`;
  const media = tpl.media || {};
  const item = {
    cv,
    ctx: cv.getContext('2d'),
    tpl,
    p: defaultParams(tpl),
    w,
    h,
    dur: tpl.duration || 4,
    mediaDefault: media.default || 1,
    cards: sampleCardsSync(tpl.id),
    visible: false,
  };
  loadSampleCards(tpl.id).then((c) => {
    if (c && c.length) item.cards = c;
  });
  items.push(item);
  io.observe(cv);
}

function draw(item, now) {
  const { ctx, tpl, p, w, h } = item;
  const t = ((now / 1000) / item.dur) % 1;
  const g = ctx.createLinearGradient(0, 0, w, h);
  g.addColorStop(0, '#141922');
  g.addColorStop(1, '#0b0f16');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
  const cards = item.cards;
  const imageAt = (i) => (cards.length ? cards[(((i | 0) % cards.length) + cards.length) % cards.length] : getPlaceholder());
  const count = Math.max(1, cards.length || item.mediaDefault);
  try {
    tpl.render(ctx, t, p, { image: imageAt(0), imageAt, count, w, h });
  } catch {
    /* one bad frame shouldn't kill the loop */
  }
}

function loop(now) {
  raf = requestAnimationFrame(loop);
  for (const it of items) if (it.visible) draw(it, now);
}

// Mount + animate a set of canvases. Safe to call multiple times (dedupes via a
// data flag) and re-entrant (shares one loop/observer).
export function mountLivePreviews(canvases) {
  if (!io) {
    io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const it = items.find((x) => x.cv === e.target);
          if (it) it.visible = e.isIntersecting;
        }
      },
      { rootMargin: '150px' }
    );
  }
  (canvases || []).forEach(mount);
  if (items.length && !raf) raf = requestAnimationFrame(loop);
}
