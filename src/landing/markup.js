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
    <a class="lp-brand" href="#top"><img class="lp-brand-app" src="/icon-rotion-02.png" alt="" width="36" height="36" /> Rotion App</a>
    <div class="lp-nav-links">
      <a href="#about">${c.nav.about}</a>
      <a href="#how">${c.nav.how}</a>
      <a href="#features">${c.nav.features}</a>
      <a href="#pricing">${c.nav.pricing}</a>
      <a href="#faq">${c.nav.faq}</a>
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

  // ---------- FAQ ---------- (accordion; first item open by default)
  const faq = make('section', 'lp-section lp-reveal');
  faq.id = 'faq';
  faq.innerHTML = `
    <h2 class="lp-h2">${c.faq.title}</h2>
    <div class="lp-faq">
      ${c.faq.items
        .map(
          (it, i) => `
        <div class="lp-faq-item${i === 0 ? ' open' : ''}">
          <button class="lp-faq-q" type="button" aria-expanded="${i === 0 ? 'true' : 'false'}">
            <span>${it[0]}</span><span class="lp-faq-ic" aria-hidden="true">${i === 0 ? '−' : '+'}</span>
          </button>
          <div class="lp-faq-a"><p>${it[1]}</p></div>
        </div>`
        )
        .join('')}
    </div>`;

  // ---------- final CTA + footer ----------
  const cta = make('section', 'lp-cta-band lp-reveal');
  cta.innerHTML = `
    <h2 class="lp-h2">${c.finalCta.title}</h2>
    <p class="lp-section-lead">${c.finalCta.sub}</p>
    <button class="lp-btn lp-btn-primary lp-btn-lg" id="lp-launch-final">${c.finalCta.btn}</button>`;
  // Footer + legal links (also required for payment-provider approval).
  const footer = make('footer', 'lp-footer');
  footer.innerHTML = `
    <div class="lp-social">
      <a class="lp-social-link" href="https://x.com/rotionapp" target="_blank" rel="noopener" aria-label="X (Twitter)" title="X">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18.24 2H21.5l-7.14 8.16L22.75 22h-6.6l-5.17-6.76L4.99 22H1.72l7.64-8.73L1.25 2h6.77l4.67 6.18L18.24 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.08 20Z"/></svg>
      </a>
      <a class="lp-social-link" href="https://instagram.com/rotionapp" target="_blank" rel="noopener" aria-label="Instagram" title="Instagram">
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.47.66.25 1.22.59 1.77 1.14.55.55.89 1.11 1.14 1.77.25.63.42 1.36.47 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.47 2.43-.25.66-.59 1.22-1.14 1.77-.55.55-1.11.89-1.77 1.14-.63.25-1.36.42-2.43.47-1.07.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.14 4.9 4.9 0 0 1-1.14-1.77c-.25-.63-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.47-2.43.25-.66.59-1.22 1.14-1.77.55-.55 1.11-.89 1.77-1.14.63-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.51.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.31.88-.35 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.21 1.51.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.31 1.86.35 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.51-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.31-.88.35-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.21-1.51-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.31-1.86-.35-1.05-.05-1.37-.06-4.04-.06Zm0 3.07a5.13 5.13 0 1 1 0 10.26 5.13 5.13 0 0 1 0-10.26Zm0 1.8a3.33 3.33 0 1 0 0 6.66 3.33 3.33 0 0 0 0-6.66Zm5.34-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>
      </a>
      <a class="lp-social-link" href="https://youtube.com/rotionapp" target="_blank" rel="noopener" aria-label="YouTube" title="YouTube">
        <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.09 0 12 0 12s0 3.91.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.91 24 12 24 12s0-3.91-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z"/></svg>
      </a>
    </div>
    <nav class="lp-legal">
      <a href="/terms">${c.legal.terms}</a>
      <a href="/privacy">${c.legal.privacy}</a>
      <a href="/refund">${c.legal.refund}</a>
      <a href="/contact">${c.legal.contact}</a>
    </nav>
    <p class="lp-copy">${c.footer}</p>`;

  root.append(nav, hero, about, how, features, pricing, faq, cta, footer);
  return { c };
}
