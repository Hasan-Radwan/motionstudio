// Bilingual (Arabic / English) marketing landing page. Rendered as the site's
// front door; the studio boots lazily when the visitor hits "Launch". All copy
// lives in COPY[lang] so switching language just re-renders. RTL is applied to
// the landing container only (the studio stays LTR).

import './landing.css';
import { getLang, setLang, onLang } from '../i18n.js';

const COPY = {
  ar: {
    dir: 'rtl',
    nav: { about: 'نبذة', how: 'كيف يعمل', features: 'المميزات', pricing: 'الأسعار', launch: 'ابدأ الآن' },
    langBtn: 'EN',
    hero: {
      badge: '✦ استوديو موشن في متصفحك',
      title: 'حوّل صورك إلى فيديوهات متحركة احترافية',
      sub: 'اختر قالباً، أضف صورك، عدّل بحرية، وصدّر فيديو حلقة سلس بجودة تصل إلى 4K — كل ذلك داخل المتصفح دون أي رفع لخوادم.',
      ctaPrimary: 'ابدأ مجاناً',
      ctaSecondary: 'شاهد كيف يعمل',
    },
    stats: [
      ['+41', 'قالب حركة احترافي'],
      ['4K', 'تصدير MP4 / WebM'],
      ['100%', 'يعمل محلياً وبخصوصية'],
    ],
    about: {
      title: 'ما هو Motion Studio؟',
      body: 'أداة تصميم حركة تعمل بالكامل في متصفحك: لا تثبيت، ولا حساب، ولا رفع لصورك إلى أي خادم. مبنية للمصممين وصنّاع المحتوى الذين يريدون تحويل صورة ثابتة أو شعار إلى فيديو جذّاب للسوشيال ميديا في دقائق.',
      points: [
        ['🔒', 'خصوصية كاملة', 'كل المعالجة تحدث على جهازك؛ صورك لا تغادره أبداً.'],
        ['⚡', 'سريع وفوري', 'معاينة حيّة لحظية وتصدير أسرع من الزمن الحقيقي عبر WebCodecs.'],
        ['🌐', 'عربي وإنجليزي', 'دعم كامل للكتابة العربية RTL وخطوط عربية احترافية.'],
      ],
    },
    how: {
      title: 'كيف يعمل؟',
      sub: 'أربع خطوات من الصورة إلى الفيديو',
      steps: [
        ['اختر قالباً', 'تصفّح أكثر من 41 قالب حركة موزّعة على 11 تصنيفاً واختر ما يناسب فكرتك.'],
        ['أضف صورك', 'اسحب وأفلت صورك أو شعارك؛ بعض القوالب يدعم عدة صور معاً.'],
        ['خصّص التصميم', 'تحكّم بالألوان والخلفية والنصوص العربية والعلامة المائية وشكل الكارت.'],
        ['صدّر الفيديو', 'صدّر فيديو حلقة سلس MP4 أو WebM بالأبعاد والجودة التي تريدها.'],
      ],
    },
    features: {
      title: 'كل ما تحتاجه لصناعة محتوى متحرك',
      items: [
        ['🎬', '41+ قالب', 'ثلاثي الأبعاد، مدارات، شرائح، سينمائي، آيزومترك والمزيد.'],
        ['🅰️', 'نصوص عربية', 'طبقات نص متعددة، اتجاه RTL تلقائي، وخطوط Cairo وTajawal.'],
        ['🖼️', 'خلفيات مرنة', 'ألوان، تدرّجات، mesh، أو ارفع صورتك الخاصة كخلفية.'],
        ['💧', 'علامة مائية', 'ارفع شعارك وتحكّم بحجمه وزاويته على كل تصدير.'],
        ['🔷', 'أشكال الكارت', 'مستطيل، مربع، دائري، مثلث — بضغطة واحدة.'],
        ['💾', 'حفظ محلي', 'مشاريعك تُحفظ في متصفحك وتُستعاد تلقائياً.'],
      ],
    },
    pricing: {
      title: 'خطط تناسب الجميع',
      sub: 'ابدأ مجاناً، وطوّر متى احتجت المزيد',
      perMonth: '/ شهرياً',
      popular: 'الأكثر رواجاً',
      cta: 'ابدأ الآن',
      tiers: [
        {
          name: 'مجاني',
          price: '0',
          desc: 'للتجربة والاستخدام الشخصي',
          features: ['كل القوالب الأساسية', 'تصدير حتى 720p', 'علامة مائية للتطبيق', 'حفظ محلي'],
          featured: false,
        },
        {
          name: 'احترافي',
          price: '9',
          desc: 'لصنّاع المحتوى والمصممين',
          features: ['كل القوالب', 'تصدير حتى 4K', 'بدون علامة مائية', 'علامتك المائية الخاصة', 'خطوط عربية كاملة'],
          featured: true,
        },
        {
          name: 'الفرق',
          price: '29',
          desc: 'للوكالات وفرق العمل',
          features: ['كل مزايا الاحترافي', 'مقاعد متعددة', 'قوالب مخصّصة', 'دعم ذو أولوية'],
          featured: false,
        },
      ],
      note: '* الأسعار هنا مبدئية للعرض — عدّلها حسب خطتك التجارية.',
    },
    finalCta: { title: 'جاهز لتحريك تصميمك؟', sub: 'ابدأ الآن مجاناً — بلا تسجيل.', btn: 'افتح الاستوديو' },
    footer: '© 2026 Motion Studio — يعمل بالكامل في متصفحك.',
  },
  en: {
    dir: 'ltr',
    nav: { about: 'About', how: 'How it works', features: 'Features', pricing: 'Pricing', launch: 'Launch' },
    langBtn: 'ع',
    hero: {
      badge: '✦ A motion studio in your browser',
      title: 'Turn your images into professional motion videos',
      sub: 'Pick a template, add your images, customize freely, and export a seamless looping video up to 4K — entirely in your browser, nothing uploaded.',
      ctaPrimary: 'Start free',
      ctaSecondary: 'See how it works',
    },
    stats: [
      ['41+', 'pro motion templates'],
      ['4K', 'MP4 / WebM export'],
      ['100%', 'local & private'],
    ],
    about: {
      title: 'What is Motion Studio?',
      body: 'A motion-design tool that runs entirely in your browser: no install, no account, nothing uploaded to any server. Built for designers and creators who want to turn a still image or logo into an eye-catching social video in minutes.',
      points: [
        ['🔒', 'Fully private', 'All processing happens on your device — your images never leave it.'],
        ['⚡', 'Fast & instant', 'Live preview and faster-than-realtime export via WebCodecs.'],
        ['🌐', 'Arabic & English', 'Full RTL Arabic text support with professional Arabic fonts.'],
      ],
    },
    how: {
      title: 'How it works',
      sub: 'Four steps from image to video',
      steps: [
        ['Pick a template', 'Browse 41+ motion templates across 11 categories and pick your vibe.'],
        ['Add your images', 'Drag & drop your photo or logo; some templates take several images.'],
        ['Customize', 'Control colors, backgrounds, Arabic text, watermark and card shape.'],
        ['Export video', 'Export a seamless looping MP4 or WebM in any aspect and quality.'],
      ],
    },
    features: {
      title: 'Everything you need for motion content',
      items: [
        ['🎬', '41+ templates', '3D, orbits, slideshows, cinematic, isometric and more.'],
        ['🅰️', 'Arabic text', 'Multiple text layers, auto RTL, and Cairo / Tajawal fonts.'],
        ['🖼️', 'Flexible backgrounds', 'Colors, gradients, mesh, or upload your own image.'],
        ['💧', 'Watermark', 'Upload your logo and control its size and corner on every export.'],
        ['🔷', 'Card shapes', 'Rectangle, square, circle, triangle — one click.'],
        ['💾', 'Local save', 'Projects are saved in your browser and restored automatically.'],
      ],
    },
    pricing: {
      title: 'Plans for everyone',
      sub: 'Start free, upgrade when you need more',
      perMonth: '/ mo',
      popular: 'Most popular',
      cta: 'Get started',
      tiers: [
        {
          name: 'Free',
          price: '0',
          desc: 'For trying it out & personal use',
          features: ['All core templates', 'Export up to 720p', 'App watermark', 'Local save'],
          featured: false,
        },
        {
          name: 'Pro',
          price: '9',
          desc: 'For creators & designers',
          features: ['All templates', 'Export up to 4K', 'No app watermark', 'Your own watermark', 'Full Arabic fonts'],
          featured: true,
        },
        {
          name: 'Teams',
          price: '29',
          desc: 'For agencies & teams',
          features: ['Everything in Pro', 'Multiple seats', 'Custom templates', 'Priority support'],
          featured: false,
        },
      ],
      note: '* Prices shown are placeholders — edit to match your business plan.',
    },
    finalCta: { title: 'Ready to animate your design?', sub: 'Start now for free — no signup.', btn: 'Open the studio' },
    footer: '© 2026 Motion Studio — runs entirely in your browser.',
  },
};

const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (html != null) n.innerHTML = html;
  return n;
};

export function initLanding(root, { onLaunch }) {
  function render() {
    const c = COPY[getLang()] || COPY.en;
    root.dir = c.dir;
    root.innerHTML = '';

    // ---------- nav ----------
    const nav = el('nav', 'lp-nav');
    nav.innerHTML = `
      <a class="lp-brand" href="#top"><span class="lp-brand-mark">◆</span> Motion Studio</a>
      <div class="lp-nav-links">
        <a href="#about">${c.nav.about}</a>
        <a href="#how">${c.nav.how}</a>
        <a href="#features">${c.nav.features}</a>
        <a href="#pricing">${c.nav.pricing}</a>
      </div>
      <div class="lp-nav-actions">
        <button class="lp-lang" id="lp-lang" title="Toggle language">${c.langBtn}</button>
        <button class="lp-btn lp-btn-primary" id="lp-launch-nav">${c.nav.launch}</button>
      </div>`;

    // ---------- hero ----------
    const hero = el('header', 'lp-hero');
    hero.id = 'top';
    const heroText = el('div', 'lp-hero-text');
    heroText.innerHTML = `
      <span class="lp-badge">${c.hero.badge}</span>
      <h1 class="lp-h1">${c.hero.title}</h1>
      <p class="lp-lead">${c.hero.sub}</p>
      <div class="lp-hero-cta">
        <button class="lp-btn lp-btn-primary lp-btn-lg" id="lp-launch-hero">${c.hero.ctaPrimary}</button>
        <a class="lp-btn lp-btn-ghost lp-btn-lg" href="#how">${c.hero.ctaSecondary}</a>
      </div>
      <div class="lp-stats">
        ${c.stats.map((s) => `<div class="lp-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}
      </div>`;
    const heroArt = el('div', 'lp-hero-art');
    heroArt.innerHTML = `
      <div class="lp-card lp-card-a"></div>
      <div class="lp-card lp-card-b"></div>
      <div class="lp-card lp-card-c"></div>
      <div class="lp-glow"></div>`;
    hero.append(heroText, heroArt);

    // ---------- about ----------
    const about = el('section', 'lp-section');
    about.id = 'about';
    about.innerHTML = `
      <h2 class="lp-h2">${c.about.title}</h2>
      <p class="lp-section-lead">${c.about.body}</p>
      <div class="lp-grid lp-grid-3">
        ${c.about.points
          .map(
            (p) =>
              `<div class="lp-mini"><div class="lp-mini-icon">${p[0]}</div><h3>${p[1]}</h3><p>${p[2]}</p></div>`
          )
          .join('')}
      </div>`;

    // ---------- how it works ----------
    const how = el('section', 'lp-section lp-section-alt');
    how.id = 'how';
    how.innerHTML = `
      <h2 class="lp-h2">${c.how.title}</h2>
      <p class="lp-section-lead">${c.how.sub}</p>
      <div class="lp-steps">
        ${c.how.steps
          .map(
            (s, i) =>
              `<div class="lp-step"><div class="lp-step-num">${i + 1}</div><h3>${s[0]}</h3><p>${s[1]}</p></div>`
          )
          .join('')}
      </div>`;

    // ---------- features ----------
    const features = el('section', 'lp-section');
    features.id = 'features';
    features.innerHTML = `
      <h2 class="lp-h2">${c.features.title}</h2>
      <div class="lp-grid lp-grid-3">
        ${c.features.items
          .map(
            (f) =>
              `<div class="lp-feature"><div class="lp-feature-icon">${f[0]}</div><h3>${f[1]}</h3><p>${f[2]}</p></div>`
          )
          .join('')}
      </div>`;

    // ---------- pricing ----------
    const pricing = el('section', 'lp-section lp-section-alt');
    pricing.id = 'pricing';
    pricing.innerHTML = `
      <h2 class="lp-h2">${c.pricing.title}</h2>
      <p class="lp-section-lead">${c.pricing.sub}</p>
      <div class="lp-pricing">
        ${c.pricing.tiers
          .map(
            (tr) => `
          <div class="lp-plan${tr.featured ? ' lp-plan-featured' : ''}">
            ${tr.featured ? `<span class="lp-plan-tag">${c.pricing.popular}</span>` : ''}
            <h3 class="lp-plan-name">${tr.name}</h3>
            <div class="lp-plan-price"><span class="lp-plan-cur">$</span>${tr.price}<span class="lp-plan-per">${c.pricing.perMonth}</span></div>
            <p class="lp-plan-desc">${tr.desc}</p>
            <ul class="lp-plan-features">
              ${tr.features.map((f) => `<li>${f}</li>`).join('')}
            </ul>
            <button class="lp-btn ${tr.featured ? 'lp-btn-primary' : 'lp-btn-ghost'} lp-plan-cta">${c.pricing.cta}</button>
          </div>`
          )
          .join('')}
      </div>
      <p class="lp-note">${c.pricing.note}</p>`;

    // ---------- final CTA + footer ----------
    const cta = el('section', 'lp-cta-band');
    cta.innerHTML = `
      <h2 class="lp-h2">${c.finalCta.title}</h2>
      <p class="lp-section-lead">${c.finalCta.sub}</p>
      <button class="lp-btn lp-btn-primary lp-btn-lg" id="lp-launch-final">${c.finalCta.btn}</button>`;
    const footer = el('footer', 'lp-footer', c.footer);

    root.append(nav, hero, about, how, features, pricing, cta, footer);

    // ---------- wiring ----------
    // setLang notifies subscribers (incl. our onLang below) which re-render.
    root.querySelector('#lp-lang').addEventListener('click', () => {
      setLang(getLang() === 'ar' ? 'en' : 'ar');
    });
    root
      .querySelectorAll('#lp-launch-nav, #lp-launch-hero, #lp-launch-final, .lp-plan-cta')
      .forEach((b) => b.addEventListener('click', () => onLaunch()));
  }

  render();
  // Re-render when the language changes anywhere (e.g. from the studio toggle).
  onLang(render);
}
