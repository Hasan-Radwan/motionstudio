// Live template previews for the server-rendered /templates category pages.
// Reuses the SAME Canvas2D engine as the studio + gallery: each <canvas class="tpv"
// data-tpl="Template Name"> is animated with the template's real render function
// and its default sample images, at the template's natural aspect ratio. A shared
// rAF loop + IntersectionObserver keep it light (offscreen previews pause).

import { TEMPLATES, defaultParams, getPlaceholder } from '../templates/index.js';
import { sampleCardsSync, loadSampleCards } from '../assets/samples.js';

const ASPECTS = { '16:9': [16, 9], '1:1': [1, 1], '9:16': [9, 16], '4:5': [4, 5], '4:3': [4, 3] };
const LONG = 460; // backing-store long side (CSS scales it to the card width)

const items = [];
let io = null;

function findTpl(name) {
  return TEMPLATES.find((t) => t.name === name);
}

function mount(cv) {
  const tpl = findTpl(cv.dataset.tpl);
  if (!tpl) return;
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
  // Real sample cards may still be loading — swap them in when ready.
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

let raf = null;
function loop(now) {
  raf = requestAnimationFrame(loop);
  for (const it of items) if (it.visible) draw(it, now);
}

function start() {
  io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        const it = items.find((x) => x.cv === e.target);
        if (it) it.visible = e.isIntersecting;
      }
    },
    { rootMargin: '150px' }
  );
  document.querySelectorAll('canvas.tpv[data-tpl]').forEach(mount);
  if (items.length) raf = requestAnimationFrame(loop);
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
else start();
