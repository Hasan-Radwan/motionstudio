// Server-rendered template landing pages (index + one per category), returned by
// the Worker so they are crawlable AND reflect admin edits instantly (content
// lives in KV `config:templates`, merged over the curated defaults below). Pure
// string builders — no browser APIs — so this bundles cleanly into worker.js.

import { TEMPLATE_CATEGORIES, categorySlug } from './templatesCatalog.js';

const SITE = 'https://rotionapp.com';

const esc = (s) =>
  String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// Curated bilingual intro for each category — makes every page substantial (not a
// thin/doorway page) out of the box. Admin overrides ride on top (see mergeCat).
const CAT_COPY = {
  '3d-perspective': {
    en: 'Give flat images real depth: cards that tilt, spin, and fly through 3D space with convincing perspective. Perfect for product showcases and bold intros.',
    ar: 'امنح صورك عمقاً حقيقياً: بطاقات تميل وتدور وتطير في فضاء ثلاثي الأبعاد بمنظور مقنع. مثالية لعرض المنتجات والمقدّمات الجريئة.',
  },
  orbit: {
    en: 'Images orbiting a center — rings, globes, spirals and radial wheels that rotate seamlessly. Great for galleries, logos and “everything revolves around us” stories.',
    ar: 'صور تدور حول مركز — حلقات وكُرات وحلزونات وعجلات شعاعية تدور بسلاسة. رائعة للمعارض والشعارات وقصص "كل شيء يدور حولنا".',
  },
  'carousel-flow': {
    en: 'Smooth looping carousels and flowing card strips — coverflow, curved rings, filmstrips and swipe decks. Drop in your images and export a seamless motion video.',
    ar: 'كاروسيلات وشرائط بطاقات انسيابية متكرّرة — كوفرفلو، حلقات منحنية، أشرطة أفلام وسحب البطاقات. أضف صورك وصدّر فيديو موشن متكرّراً.',
  },
  colors: {
    en: 'Animated color palettes and swatches — show a brand’s colors with codes, in clean grids or layered stacks. Ideal for brand kits and style guides.',
    ar: 'لوحات ألوان وعيّنات متحركة — اعرض ألوان هويتك مع أكوادها في شبكات أنيقة أو طبقات متراكبة. مثالية لهويات العلامات وأدلة الأنماط.',
  },
  'stack-scatter': {
    en: 'Playful stacks, fans and scatters — cards that pile, spread and drift with depth. Perfect for photo dumps, moodboards and energetic social posts.',
    ar: 'أكوام ومراوح وتبعثر مرح — بطاقات تتكدّس وتنتشر وتنجرف بعمق. مثالية لمجموعات الصور واللوحات المزاجية ومنشورات السوشيال النابضة.',
  },
  text: {
    en: 'Kinetic typography — morphing, staggering, waving and revealing text. Turn a headline or quote into a scroll-stopping animated statement.',
    ar: 'تايبوغرافي حركية — نصوص تتحوّل وتتتابع وتتموّج وتنكشف. حوّل عنواناً أو اقتباساً إلى بيان متحرك يوقف التمرير.',
  },
  grid: {
    en: 'Rhythmic image grids — tiles that pulse, flip and ripple in sync. Great for portfolios, feature walls and satisfying, hypnotic loops.',
    ar: 'شبكات صور إيقاعية — مربّعات تنبض وتنقلب وتتموّج بتناغم. رائعة للأعمال وجدران المزايا والحلقات المُرضية الآسرة.',
  },
  'reveal-wipe': {
    en: 'Reveal your image with style — blinds, iris, wipes and staggered masks. Clean, cinematic transitions for intros and before/after moments.',
    ar: 'اكشف صورتك بأناقة — ستائر، قزحية، مسحات وأقنعة متتابعة. انتقالات نظيفة سينمائية للمقدّمات ولحظات قبل/بعد.',
  },
  'slideshow-story': {
    en: 'Turn a set of images into a story — slideshows, split screens and story feeds with polished pacing. Ideal for recaps, launches and highlights.',
    ar: 'حوّل مجموعة صور إلى قصة — شرائح وشاشات مقسّمة وخلاصات قصصية بإيقاع مصقول. مثالية للملخّصات والإطلاقات وأبرز اللقطات.',
  },
  'spotlight-focus': {
    en: 'Put one image center stage — cinematic Ken Burns, spotlight and zoom-blur focus effects that draw the eye. Perfect for a hero shot or single product.',
    ar: 'ضع صورة واحدة في المنتصف — تأثيرات كين بيرنز السينمائية والإبراز وضبابية التقريب التي تجذب العين. مثالية للقطة رئيسية أو منتج واحد.',
  },
  isometric: {
    en: 'Isometric tiles and scenes — a clean, modern 3/4 view that feels designed and techy. Great for app screens, dashboards and product features.',
    ar: 'بلاطات ومشاهد أيزومترية — منظور ثلاثة أرباع نظيف وعصري بإحساس مصمَّم وتقني. رائعة لشاشات التطبيقات ولوحات المعلومات ومزايا المنتج.',
  },
  'logo-branding': {
    en: 'Reveal your logo like a pro — polished logo reveals and neon frames on real mockups, with fades, overshoot pops and Ken Burns depth.',
    ar: 'اكشف شعارك باحترافية — ظهور شعار مصقول وإطارات نيون على موك أب حقيقي، مع تلاشٍ وتجاوز نابض وعمق كين بيرنز.',
  },
  'ticker-marquee': {
    en: 'Endless scrolling tickers and marquee walls — perfect for announcements, logos, sponsors and “always-on” brand energy.',
    ar: 'أشرطة تمرير لا نهائية وجدران ماركيه — مثالية للإعلانات والشعارات والرعاة وطاقة العلامة الدائمة.',
  },
};

const UI = {
  en: {
    brand: 'Rotion App',
    templates: 'Templates',
    editor: 'Open editor',
    tryNow: 'Try it now',
    allTitle: 'Motion Templates',
    allSub: 'Browse every ready-made motion template by category — pick one, drop in your images, and export a looping video in seconds.',
    inThis: 'Templates in this category',
    home: 'Home',
    other: 'More categories',
    footer: 'Create scroll-stopping motion videos in your browser.',
  },
  ar: {
    brand: 'Rotion App',
    templates: 'القوالب',
    editor: 'افتح المحرّر',
    tryNow: 'جرّبه الآن',
    allTitle: 'قوالب الموشن',
    allSub: 'تصفّح كل قوالب الموشن الجاهزة حسب القسم — اختر قالباً، أضف صورك، وصدّر فيديو متكرّراً في ثوانٍ.',
    inThis: 'قوالب هذا القسم',
    home: 'الرئيسية',
    other: 'أقسام أخرى',
    footer: 'أنشئ فيديوهات موشن توقف التمرير من متصفّحك.',
  },
};

const CSS = `
:root{--bg:#0A1622;--bg2:#0e1c2b;--panel:#0e1a28;--bd:#1d3145;--bd2:#294056;--tx:#e8eef5;--dim:#93a4b8;--mut:#647588;--acc:#2563eb;--acc2:#00e5a0}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--tx);font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;line-height:1.6}
a{color:inherit;text-decoration:none}
.t-top{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 20px;border-bottom:1px solid var(--bd);position:sticky;top:0;background:linear-gradient(180deg,var(--bg2),var(--bg));z-index:5}
.t-brand{display:flex;align-items:center;gap:10px;font-weight:800}
.t-brand img{border-radius:7px}
.t-nav{display:flex;align-items:center;gap:14px;font-weight:600;font-size:14px}
.t-nav a{color:var(--dim)}.t-nav a:hover{color:#fff}
.t-cta{background:linear-gradient(180deg,var(--acc2),var(--acc));color:#04120c!important;padding:8px 16px;border-radius:10px;font-weight:700}
.t-wrap{max-width:1040px;margin:0 auto;padding:34px 20px 64px}
.t-crumb{font-size:13px;color:var(--mut);margin-bottom:14px}
.t-crumb a:hover{color:var(--acc2)}
.t-h1{font-size:34px;font-weight:800;margin:6px 0 12px;line-height:1.2}
.t-lead{font-size:17px;color:var(--dim);max-width:720px;margin:0 0 26px}
.t-media{width:100%;max-width:720px;border-radius:16px;border:1px solid var(--bd2);margin:0 0 28px;display:block}
.t-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px;margin:20px 0 30px}
.t-card{display:block;padding:18px;border-radius:14px;border:1px solid var(--bd);background:var(--panel);transition:border-color .15s,transform .05s}
.t-card:hover{border-color:var(--acc2);transform:translateY(-2px)}
.t-card h3{margin:0 0 6px;font-size:17px}
.t-card p{margin:0;font-size:13.5px;color:var(--mut)}
.t-card .cnt{color:var(--acc2);font-weight:700;font-size:12.5px}
.t-h2{font-size:20px;margin:34px 0 14px}
.t-chips{display:flex;flex-wrap:wrap;gap:9px;margin:0 0 30px}
.t-chip{padding:8px 14px;border-radius:999px;border:1px solid var(--bd2);background:var(--bg2);color:var(--tx);font-size:14px}
.t-btn{display:inline-block;background:linear-gradient(180deg,var(--acc2),var(--acc));color:#04120c;font-weight:700;padding:13px 26px;border-radius:12px;font-size:16px}
.t-foot{border-top:1px solid var(--bd);color:var(--mut);font-size:13px;padding:24px 20px;text-align:center}
.t-foot a{color:var(--dim)}.t-foot a:hover{color:var(--acc2)}
@media(max-width:520px){.t-h1{font-size:27px}.t-nav .t-lbl{display:none}}
`;

// Merge admin overrides (KV) over the curated defaults for one category.
function mergeCat(cat, lang, cfg) {
  const slug = categorySlug(cat.cat);
  const ov = (cfg && cfg[slug]) || {};
  const name = lang === 'ar' ? cat.catAr || cat.cat : cat.cat;
  const defDesc = (CAT_COPY[slug] || {})[lang] || '';
  const desc = (lang === 'ar' ? ov.descAr : ov.desc) || defDesc;
  // Only embed https / same-origin media (defense-in-depth; the admin API also
  // validates this on save) so a bad URL can never inject a javascript: scheme.
  const media = /^(https:\/\/|\/)/.test(ov.mediaUrl || '') ? ov.mediaUrl : '';
  return { slug, name, desc, media, items: cat.items || [] };
}

function shell({ lang, path, title, desc, body, jsonLd }) {
  const rtl = lang === 'ar';
  const canonical = SITE + path;
  const altPath = rtl ? path.replace(/^\/ar/, '') || '/' : '/ar' + path;
  const enUrl = rtl ? SITE + altPath : canonical;
  const arUrl = rtl ? canonical : SITE + altPath;
  const u = UI[lang];
  return `<!doctype html><html lang="${lang}" dir="${rtl ? 'rtl' : 'ltr'}"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${canonical}">
<link rel="alternate" hreflang="en" href="${enUrl}">
<link rel="alternate" hreflang="ar" href="${arUrl}">
<link rel="alternate" hreflang="x-default" href="${enUrl}">
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<meta name="theme-color" content="#0A1622">
<meta property="og:type" content="website"><meta property="og:url" content="${canonical}">
<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${SITE}/og-image${rtl ? '-ar' : ''}.svg">
<meta name="twitter:card" content="summary_large_image">
<script src="/analytics.js"></script>
<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>
<style>${CSS}</style></head>
<body>
<header class="t-top">
  <a class="t-brand" href="${rtl ? '/ar' : '/'}"><img src="/icon-rotion-02.png" alt="" width="28" height="28">${u.brand}</a>
  <nav class="t-nav">
    <a href="${rtl ? '/ar/templates' : '/templates'}"><span class="t-lbl">${u.templates}</span></a>
    <a class="t-lang" href="${altPath}">${rtl ? 'EN' : 'ع'}</a>
    <a class="t-cta" href="/app">${u.editor}</a>
  </nav>
</header>
<main class="t-wrap">${body}</main>
<footer class="t-foot">${esc(u.footer)}<br>
  <a href="${rtl ? '/ar' : '/'}">${u.home}</a> · <a href="${rtl ? '/ar/templates' : '/templates'}">${u.templates}</a> · <a href="/app">${u.editor}</a> · © Rotion App
</footer>
</body></html>`;
}

// GET /templates (en) or /ar/templates (ar).
export function renderTemplatesIndex(lang, cfg) {
  const rtl = lang === 'ar';
  const u = UI[lang];
  const base = rtl ? '/ar/templates' : '/templates';
  const cats = TEMPLATE_CATEGORIES.map((c) => mergeCat(c, lang, cfg));
  const cards = cats
    .map(
      (c) =>
        `<a class="t-card" href="${base}/${c.slug}"><h3>${esc(c.name)}</h3><p>${esc(c.desc)}</p><div class="cnt">${c.items.length} ${rtl ? 'قالب' : 'templates'}</div></a>`
    )
    .join('');
  const body = `
    <div class="t-crumb"><a href="${rtl ? '/ar' : '/'}">${esc(u.home)}</a> / ${esc(u.templates)}</div>
    <h1 class="t-h1">${esc(u.allTitle)}</h1>
    <p class="t-lead">${esc(u.allSub)}</p>
    <div class="t-grid">${cards}</div>
    <a class="t-btn" href="/app">${esc(u.editor)}</a>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: u.home, item: SITE + (rtl ? '/ar' : '/') },
          { '@type': 'ListItem', position: 2, name: u.templates, item: SITE + base },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: u.allTitle,
        description: u.allSub,
        url: SITE + base,
        isPartOf: { '@type': 'WebSite', name: 'Rotion App', url: SITE },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: cats.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: c.name, url: SITE + base + '/' + c.slug })),
        },
      },
    ],
  };
  return shell({ lang, path: base, title: `${u.allTitle} — Rotion App`, desc: u.allSub, body, jsonLd });
}

// GET /templates/<slug> (en) or /ar/templates/<slug> (ar). `cat` is the raw
// category object from the catalog. Returns null-safe HTML.
export function renderCategoryPage(lang, cat, cfg) {
  const rtl = lang === 'ar';
  const u = UI[lang];
  const base = rtl ? '/ar/templates' : '/templates';
  const c = mergeCat(cat, lang, cfg);
  const path = `${base}/${c.slug}`;
  const chips = c.items.map((name) => `<span class="t-chip">${esc(name)}</span>`).join('');
  const media = c.media
    ? /\.(mp4|webm)(\?|$)/i.test(c.media)
      ? `<video class="t-media" src="${esc(c.media)}" autoplay muted loop playsinline></video>`
      : `<img class="t-media" src="${esc(c.media)}" alt="${esc(c.name)}" loading="lazy">`
    : '';
  const body = `
    <div class="t-crumb"><a href="${rtl ? '/ar' : '/'}">${esc(u.home)}</a> / <a href="${base}">${esc(u.templates)}</a> / ${esc(c.name)}</div>
    <h1 class="t-h1">${esc(c.name)}</h1>
    <p class="t-lead">${esc(c.desc)}</p>
    ${media}
    <a class="t-btn" href="/app">${esc(u.tryNow)}</a>
    <h2 class="t-h2">${esc(u.inThis)} (${c.items.length})</h2>
    <div class="t-chips">${chips}</div>
    <p><a class="t-card" style="max-width:260px" href="${base}">← ${esc(u.other)}</a></p>`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: u.home, item: SITE + (rtl ? '/ar' : '/') },
          { '@type': 'ListItem', position: 2, name: u.templates, item: SITE + base },
          { '@type': 'ListItem', position: 3, name: c.name, item: SITE + path },
        ],
      },
      {
        '@type': 'CollectionPage',
        name: `${c.name} — Rotion App`,
        description: c.desc,
        url: SITE + path,
        isPartOf: { '@type': 'WebSite', name: 'Rotion App', url: SITE },
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: c.items.map((name, i) => ({ '@type': 'ListItem', position: i + 1, name })),
        },
      },
    ],
  };
  return shell({ lang, path, title: `${c.name} — Rotion App`, desc: c.desc, body, jsonLd });
}

// All category slugs (for the sitemap).
export const CATEGORY_SLUGS = TEMPLATE_CATEGORIES.map((c) => categorySlug(c.cat));
