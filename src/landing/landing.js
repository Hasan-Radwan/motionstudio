// Bilingual (Arabic / English) marketing landing page. Rendered as the site's
// front door; the studio boots lazily when the visitor hits "Launch". All copy
// lives in COPY[lang] so switching language just re-renders. RTL is applied to
// the landing container only (the studio stays LTR).

import './landing.css';
import { getLang, setLang, onLang } from '../i18n.js';

const TAU = Math.PI * 2;

// Interactive lifecycle (recreated on each render / language change).
let _heroStop = null;
let _observers = [];

function teardownInteractive() {
  if (_heroStop) {
    _heroStop();
    _heroStop = null;
  }
  _observers.forEach((o) => o.disconnect());
  _observers = [];
}

// Original spiral-vortex hero background: soft rounded gradient cards drift along
// an Archimedean spiral from the outer edge toward the centre, rotating to follow
// the curve and fading in/out at the ends. Pure Canvas2D, DPR-aware, and pauses
// when off-screen. Returns a stop() teardown.
function startHeroSpiral(canvas) {
  const ctx = canvas.getContext('2d');
  const parent = canvas.parentElement;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let h = 0;
  let raf = 0;
  let running = true;
  let t = 0;
  let last = 0;

  // Elegant, on-brand gradient pairs (stable per card index).
  // Rotion App brand gradient family (blue → green / cyan).
  const PALETTE = [
    ['#2563eb', '#00e5a0'],
    ['#3b82f6', '#22d3ee'],
    ['#00e5a0', '#2563eb'],
    ['#1d4ed8', '#38bdf8'],
    ['#0ea5e9', '#00e5a0'],
    ['#2563eb', '#38bdf8'],
  ];
  const COUNT = 18;
  const TURNS = 3;

  const resize = () => {
    w = parent.clientWidth || 800;
    h = parent.clientHeight || 600;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    canvas.style.width = '100%';
    canvas.style.height = '100%';
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(parent);

  const roundRect = (c, x, y, rw, rh, r) => {
    const rr = Math.min(r, rw / 2, rh / 2);
    c.beginPath();
    c.moveTo(x + rr, y);
    c.arcTo(x + rw, y, x + rw, y + rh, rr);
    c.arcTo(x + rw, y + rh, x, y + rh, rr);
    c.arcTo(x, y + rh, x, y, rr);
    c.arcTo(x, y, x + rw, y, rr);
    c.closePath();
  };

  const frame = (now) => {
    if (!running) return;
    const dt = last ? (now - last) / 1000 : 0;
    last = now;
    t = (t + Math.min(dt, 0.05) * 0.05) % 1; // slow, unobtrusive drift

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const R = 0.62 * Math.max(w, h);
    const cardW = Math.min(w, h) * 0.16;
    const fade = 0.14;

    const cards = [];
    for (let i = 0; i < COUNT; i++) {
      const p = (((i / COUNT + t) % 1) + 1) % 1; // 0 outer .. 1 centre
      cards.push({ p, pal: PALETTE[i % PALETTE.length] });
    }
    cards.sort((a, b) => a.p - b.p); // outer first, centre cards drawn on top

    for (const { p, pal } of cards) {
      const ang = p * TURNS * TAU + t * TAU;
      const rad = R * (1 - p);
      const x = cx + rad * Math.cos(ang);
      const y = cy + rad * Math.sin(ang);
      const s = 0.3 + 0.7 * (rad / R); // smaller toward the centre
      let alpha = 1;
      if (p < fade) alpha = p / fade;
      else if (p > 1 - fade) alpha = (1 - p) / fade;
      if (alpha <= 0.01) continue;

      const cw = cardW * s;
      const ch = cw * 1.28;
      const g = ctx.createLinearGradient(-cw / 2, -ch / 2, cw / 2, ch / 2);
      g.addColorStop(0, pal[0]);
      g.addColorStop(1, pal[1]);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang + Math.PI / 2); // follow the spiral tangent
      ctx.globalAlpha = alpha * 0.9;
      ctx.shadowColor = 'rgba(0,0,0,0.35)';
      ctx.shadowBlur = cardW * 0.22 * s;
      ctx.shadowOffsetY = cardW * 0.06 * s;
      roundRect(ctx, -cw / 2, -ch / 2, cw, ch, cw * 0.14);
      ctx.fillStyle = g;
      ctx.fill();
      ctx.restore();
    }

    raf = requestAnimationFrame(frame);
  };
  raf = requestAnimationFrame(frame);

  // Pause the loop while the hero is off-screen (or the studio hides the landing).
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting && !running) {
        running = true;
        last = 0;
        raf = requestAnimationFrame(frame);
      } else if (!e.isIntersecting) {
        running = false;
        cancelAnimationFrame(raf);
      }
    }
  });
  io.observe(canvas);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
  };
}

function setupHeroSpiral(root) {
  const canvas = root.querySelector('.lp-hero-canvas');
  if (canvas) _heroStop = startHeroSpiral(canvas);
}

// Reveal sections as they scroll into view (inside the landing scroll container),
// with a safety timer so content is never left hidden if the observer misfires.
function setupReveal(root) {
  const targets = [...root.querySelectorAll('.lp-reveal')];
  const reveal = (el) => el.classList.add('lp-in');
  // Failsafe FIRST: content is guaranteed visible shortly even if anything below
  // throws or the observer never fires.
  const timer = setTimeout(() => targets.forEach(reveal), 2000);
  _observers.push({ disconnect: () => clearTimeout(timer) });
  try {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            reveal(e.target);
            io.unobserve(e.target);
          }
        }
      },
      { root, threshold: 0.05, rootMargin: '0px 0px -8% 0px' }
    );
    targets.forEach((t) => io.observe(t));
    _observers.push(io);
  } catch {
    targets.forEach(reveal);
  }
}

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
      ['8K', 'تصدير MP4 / WebM'],
      ['100%', 'يعمل محلياً وبخصوصية'],
    ],
    about: {
      title: 'ما هو Rotion؟',
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
          features: ['كل القوالب', 'تصدير حتى 8K', 'بدون علامة مائية', 'علامتك المائية الخاصة', 'خطوط عربية كاملة'],
          featured: true,
        },
      ],
      note: '* الأسعار هنا مبدئية للعرض — عدّلها حسب خطتك التجارية.',
    },
    finalCta: { title: 'جاهز لتحريك تصميمك؟', sub: 'ابدأ الآن مجاناً — بلا تسجيل.', btn: 'افتح الاستوديو' },
    footer: '© 2026 Rotion App — يعمل بالكامل في متصفحك.',
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
      ['8K', 'MP4 / WebM export'],
      ['100%', 'local & private'],
    ],
    about: {
      title: 'What is Rotion?',
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
          features: ['All templates', 'Export up to 8K', 'No app watermark', 'Your own watermark', 'Full Arabic fonts'],
          featured: true,
        },
      ],
      note: '* Prices shown are placeholders — edit to match your business plan.',
    },
    finalCta: { title: 'Ready to animate your design?', sub: 'Start now for free — no signup.', btn: 'Open the studio' },
    footer: '© 2026 Rotion App — runs entirely in your browser.',
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
    teardownInteractive(); // stop any preview/observers from a previous render
    root.innerHTML = '';

    // ---------- nav ----------
    const nav = el('nav', 'lp-nav');
    nav.innerHTML = `
      <a class="lp-brand" href="#top"><img class="lp-brand-icon" src="/favicon.svg" alt="" width="26" height="26" /> Rotion</a>
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

    // ---------- hero ---------- (full-bleed spiral vortex + centred content)
    const hero = el('header', 'lp-hero');
    hero.id = 'top';
    hero.innerHTML = `
      <canvas class="lp-hero-canvas" aria-hidden="true"></canvas>
      <div class="lp-hero-scrim"></div>
      <div class="lp-hero-center">
        <span class="lp-badge">${c.hero.badge}</span>
        <h1 class="lp-h1">${c.hero.title}</h1>
        <p class="lp-lead">${c.hero.sub}</p>
        <div class="lp-hero-cta">
          <button class="lp-btn lp-btn-primary lp-btn-lg" id="lp-launch-hero">${c.hero.ctaPrimary}</button>
          <a class="lp-btn lp-btn-ghost lp-btn-lg" href="#how">${c.hero.ctaSecondary}</a>
        </div>
        <div class="lp-stats">
          ${c.stats.map((s) => `<div class="lp-stat"><b>${s[0]}</b><span>${s[1]}</span></div>`).join('')}
        </div>
      </div>`;

    // ---------- about ----------
    const about = el('section', 'lp-section lp-reveal');
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
    const how = el('section', 'lp-section lp-section-alt lp-reveal');
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
    const features = el('section', 'lp-section lp-reveal');
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
    const pricing = el('section', 'lp-section lp-section-alt lp-reveal');
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
    const cta = el('section', 'lp-cta-band lp-reveal');
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

    try {
      setupHeroSpiral(root);
    } catch (e) {
      console.error('hero spiral failed', e);
    }
    setupReveal(root);
  }

  render();
  // Re-render when the language changes anywhere (e.g. from the studio toggle).
  onLang(render);
}
