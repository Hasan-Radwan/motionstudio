// Optional per-template DEFAULT sample images — card images + a background —
// loaded from files you drop into `public/samples/`. Everything here is optional:
// a missing file is silently skipped, so the app gracefully falls back to the
// generated placeholder (and the global default background) until you add images.
//
// Where to put your designed / generated images (public/ is served at the root):
//   public/samples/cards/card-1.jpg … card-6.jpg     ← generic cards (shared default)
//   public/samples/<templateId>/card-1.jpg …          ← per-template card set (overrides)
//   public/samples/<templateId>/bg.jpg                ← per-template default background
//
// To give a template its own set, add an entry to TEMPLATE_SAMPLES below.

const GENERIC_CARD_COUNT = 6;
const GENERIC_CARDS = Array.from(
  { length: GENERIC_CARD_COUNT },
  (_, i) => `/samples/cards/card-${i + 1}.jpg`
);

// Per-template overrides. `cards` is a list of image URLs; `background` is one URL.
// Add more templates as you design images for them.
// The Curved Carousel sample set — card-1 is the FOREGROUND subject (a
// transparent PNG cut-out); the rest are the posters. Shared by all three
// Curved Carousel variants.
const CURVED_CAROUSEL_SAMPLE = {
  cards: [
    '/samples/curvedCarousel/card-1.png',
    '/samples/curvedCarousel/card-2.jpg',
    '/samples/curvedCarousel/card-3.jpg',
    '/samples/curvedCarousel/card-4.jpg',
    '/samples/curvedCarousel/card-5.jpg',
    '/samples/curvedCarousel/card-6.jpg',
  ],
  background: '/samples/curvedCarousel/bg.jpg',
};

// Per-template overrides. `cards` is a list of image URLs; `background` is one URL.
export const TEMPLATE_SAMPLES = {
  curvedCarousel: CURVED_CAROUSEL_SAMPLE,
  curvedCarousel02: CURVED_CAROUSEL_SAMPLE,
  curvedCarousel03: CURVED_CAROUSEL_SAMPLE,
};

// url -> HTMLImageElement | null (null = confirmed missing). Cached so repeated
// template switches don't re-request.
const _cache = new Map();

function loadOne(url) {
  if (_cache.has(url)) return Promise.resolve(_cache.get(url));
  return new Promise((resolve) => {
    const im = new Image();
    im.onload = () => {
      _cache.set(url, im);
      resolve(im);
    };
    im.onerror = () => {
      _cache.set(url, null); // remember the miss so we don't retry every switch
      resolve(null);
    };
    im.src = url;
  });
}

// Load a template's default CARD images (falls back to the generic set). Resolves
// to only the images that actually exist — possibly an empty array.
export async function loadSampleCards(tplId) {
  const urls = TEMPLATE_SAMPLES[tplId]?.cards || GENERIC_CARDS;
  const imgs = await Promise.all(urls.map(loadOne));
  return imgs.filter(Boolean);
}

// Synchronous access to a template's already-loaded sample cards, for the gallery
// thumbnails (which paint on a shared rAF loop and can't await). Kicks off a
// one-time background load so subsequent frames can use them; returns [] until
// they're ready, so the thumb simply shows the generated placeholder meanwhile.
const _warmed = new Set();
export function sampleCardsSync(tplId) {
  const urls = TEMPLATE_SAMPLES[tplId]?.cards || GENERIC_CARDS;
  if (!_warmed.has(tplId)) {
    _warmed.add(tplId);
    Promise.all(urls.map(loadOne)); // fire-and-forget; fills the cache
  }
  const imgs = [];
  for (const u of urls) {
    const im = _cache.get(u);
    if (im) imgs.push(im);
  }
  return imgs;
}

// Load a template's default BACKGROUND as a ready-to-use background object, or
// null when the template has none / the file is missing.
export async function loadSampleBackground(tplId) {
  const url = TEMPLATE_SAMPLES[tplId]?.background;
  if (!url) return null;
  const img = await loadOne(url);
  return img ? { id: 'sample-bg', name: 'Sample', type: 'image', img, fit: 'cover', dim: 0 } : null;
}
