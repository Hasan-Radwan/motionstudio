// Pure landing-page markup builder — no CSS import, no window/canvas-context/
// IntersectionObserver usage. Runs identically in the browser (via landing.js)
// and under linkedom in the build-time prerender script (scripts/prerender.mjs),
// so there is exactly one source of truth for the HTML a crawler sees and what
// the browser renders after hydration.

import { COPY } from './copy.js';
import { mergeCopy } from './mergeCopy.js';

// `doc` lets the prerender script pass a virtual (linkedom) document; defaults
// to the real one in the browser. `overrides` (optional) is an admin-authored
// content patch (see mergeCopy.js) — used by the prerender script to bake admin
// edits directly into the static HTML; the client renders base copy first (zero
// network wait) and patches live separately, see landing.js applyLiveOverrides().
// Returns { c } (the resolved copy object) so callers can wire interactivity or
// write <head> tags without re-looking it up.
export function buildMarkup(root, lang, doc = document, overrides = null) {
  const c = mergeCopy(COPY[lang] || COPY.en, overrides);
  root.dir = c.dir;
  root.setAttribute('lang', lang);
  root.innerHTML = '';

  const make = (tag, cls) => {
    const n = doc.createElement(tag);
    if (cls) n.className = cls;
    return n;
  };

  // ---------- nav ----------
  const nav = make('nav', 'lp-nav');
  nav.innerHTML = `
    <a class="lp-brand" href="#top"><img class="lp-brand-icon" src="/favicon.svg" alt="" width="26" height="26" /> Rotion</a>
    <div class="lp-nav-links">
      <a href="#about">${c.nav.about}</a>
      <a href="#how">${c.nav.how}</a>
      <a href="#features">${c.nav.features}</a>
      <a href="#pricing">${c.nav.pricing}</a>
    </div>
    <div class="lp-nav-actions">
      <a class="lp-lang" id="lp-lang" href="${c.langHref}" title="${lang === 'ar' ? 'English' : 'العربية'}">${c.langBtn}</a>
      <button class="lp-btn lp-btn-primary" id="lp-launch-nav">${c.nav.launch}</button>
    </div>`;

  // ---------- hero ---------- (full-bleed spiral vortex + centred content)
  const hero = make('header', 'lp-hero');
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
  // data-field / data-idx hooks below let landing.js's live-patch pass find and
  // update exactly these nodes after fetching admin overrides, without a full
  // rebuild (which would drop already-wired event listeners).
  const about = make('section', 'lp-section lp-reveal');
  about.id = 'about';
  about.innerHTML = `
    <h2 class="lp-h2" data-field="about-title">${c.about.title}</h2>
    <p class="lp-section-lead" data-field="about-body">${c.about.body}</p>
    <div class="lp-grid lp-grid-3">
      ${c.about.points
        .map(
          (p, i) =>
            `<div class="lp-mini" data-idx="${i}"><div class="lp-mini-icon">${p[0]}</div><h3>${p[1]}</h3><p>${p[2]}</p></div>`
        )
        .join('')}
    </div>`;

  // ---------- how it works ----------
  const how = make('section', 'lp-section lp-section-alt lp-reveal');
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
  const features = make('section', 'lp-section lp-reveal');
  features.id = 'features';
  features.innerHTML = `
    <h2 class="lp-h2" data-field="features-title">${c.features.title}</h2>
    <div class="lp-grid lp-grid-3">
      ${c.features.items
        .map(
          (f, i) =>
            `<div class="lp-feature" data-idx="${i}"><div class="lp-feature-icon">${f[0]}</div><h3>${f[1]}</h3><p>${f[2]}</p></div>`
        )
        .join('')}
    </div>`;

  // ---------- pricing ----------
  const pricing = make('section', 'lp-section lp-section-alt lp-reveal');
  pricing.id = 'pricing';
  pricing.innerHTML = `
    <h2 class="lp-h2">${c.pricing.title}</h2>
    <p class="lp-section-lead">${c.pricing.sub}</p>
    <div class="lp-pricing">
      ${c.pricing.tiers
        .map(
          (tr) => `
        <div class="lp-plan${tr.featured ? ' lp-plan-featured' : ''}" data-tier="${tr.price === '0' ? 'free' : 'pro'}">
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
  const cta = make('section', 'lp-cta-band lp-reveal');
  cta.innerHTML = `
    <h2 class="lp-h2">${c.finalCta.title}</h2>
    <p class="lp-section-lead">${c.finalCta.sub}</p>
    <button class="lp-btn lp-btn-primary lp-btn-lg" id="lp-launch-final">${c.finalCta.btn}</button>`;
  // Footer + legal links (also required for payment-provider approval).
  const footer = make('footer', 'lp-footer');
  footer.innerHTML = `
    <nav class="lp-legal">
      <a href="/terms">${c.legal.terms}</a>
      <a href="/privacy">${c.legal.privacy}</a>
      <a href="/refund">${c.legal.refund}</a>
      <a href="/contact">${c.legal.contact}</a>
    </nav>
    <p class="lp-copy">${c.footer}</p>`;

  root.append(nav, hero, about, how, features, pricing, cta, footer);
  return { c };
}
