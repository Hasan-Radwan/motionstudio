// Bilingual (English / Arabic) marketing landing page. English is primary and
// lives at `/`; Arabic lives at `/ar` (a separate pre-rendered page — see
// scripts/prerender.mjs). The studio lives at `/app`. `buildMarkup()` is pure
// DOM construction with no browser-only APIs, so the exact same function runs
// both here (client) and in the build-time prerender script (via linkedom) —
// one source of truth for the HTML a crawler sees and what the browser renders.

import './landing.css';
import { buildMarkup } from './markup.js';

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

// Replace the static Pro price with the real, localized Paddle price — but only
// once the visitor scrolls to the pricing section (so Paddle.js loads lazily).
function setupLivePricing(root, perLabel) {
  Promise.all([import('../billing/paddle.js'), import('../billing/paddleConfig.js')]).then(
    ([{ previewPrices }, { PADDLE, paddleConfigured }]) => {
      if (!paddleConfigured()) return;
      const pricing = root.querySelector('#pricing');
      const priceEl = root.querySelector('.lp-plan[data-tier="pro"] .lp-plan-price');
      if (!pricing || !priceEl) return;
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            io.disconnect();
            previewPrices([PADDLE.prices.pro_monthly]).then((m) => {
              const real = m[PADDLE.prices.pro_monthly];
              if (real) priceEl.innerHTML = `${real}<span class="lp-plan-per">${perLabel}</span>`;
            });
          }
        },
        { root }
      );
      io.observe(pricing);
      _observers.push(io);
    }
  );
}

// Wire up interactive behaviour on top of markup already in the DOM (built by
// buildMarkup, either client-rendered just now or pre-rendered by the server and
// present on first paint). Browser-only — never called during prerender.
function wireInteractivity(root, lang, c, onLaunch) {
  teardownInteractive();
  root
    .querySelectorAll('#lp-launch-nav, #lp-launch-hero, #lp-launch-final, .lp-plan-cta')
    .forEach((b) => b.addEventListener('click', () => onLaunch()));

  try {
    setupHeroSpiral(root);
  } catch (e) {
    console.error('hero spiral failed', e);
  }
  setupReveal(root);
  // Swap in the real Paddle price only when the admin wants live pricing AND
  // there's no monthly/yearly toggle — live pricing rewrites the price element
  // (monthly only), which would break the yearly swap. With a yearly price the
  // fixed displayed prices are used and the toggle drives them.
  const hasYearly = (c.pricing.tiers || []).some((tr) => tr.priceYearly);
  if (c.pricing.showLivePrice !== false && !hasYearly) setupLivePricing(root, c.pricing.perMonth);
  setupBillingToggle(root, c);
  setupFaq(root);
  setupTemplateSlider(root);
}

// Homepage Templates slider: swap the fallback cards for the REAL most-visited
// templates, duplicate the set for a seamless marquee, and animate each card with
// the live template engine (offscreen cards pause). Best-effort — never throws.
async function setupTemplateSlider(root) {
  const slider = root.querySelector('[data-tpl-slider]');
  if (!slider) return;
  const track = slider.querySelector('.lp-tpl-track');
  if (!track) return;
  const fallback = [...track.querySelectorAll('.lp-tpv-name')].map((n) => n.textContent).filter(Boolean);
  let names = [];
  try {
    const r = await fetch('/api/popular-templates?limit=8');
    if (r.ok) names = ((await r.json()).templates || []).map((t) => t.name).filter(Boolean);
  } catch {
    /* offline / not configured — fall back below */
  }
  // Always show at least 6: top up from the fallback set (deduped).
  for (const f of fallback) {
    if (names.length >= 8) break;
    if (!names.includes(f)) names.push(f);
  }
  if (names.length < 6) names = fallback;
  const card = (name) =>
    `<div class="lp-tpv-card"><canvas class="lp-tpv" data-tpl="${name}" aria-label="${name}"></canvas><span class="lp-tpv-name">${name}</span></div>`;
  const set = names.map(card).join('');
  track.innerHTML = set + set; // duplicate for the -50% marquee loop
  slider.classList.add('is-live');
  try {
    const { mountLivePreviews } = await import('../preview/livePreview.js');
    mountLivePreviews(track.querySelectorAll('canvas.lp-tpv[data-tpl]'));
  } catch (e) {
    console.error('template slider previews failed', e);
  }
}

// Monthly / Yearly billing toggle: swaps the price + per-period label on any plan
// that has a yearly price (data-m / data-y on .lp-plan-price).
function setupBillingToggle(root, c) {
  const opts = [...root.querySelectorAll('.lp-bill-opt')];
  if (!opts.length) return;
  const apply = (period) => {
    root.querySelectorAll('.lp-plan-price[data-y]').forEach((el) => {
      const amt = el.querySelector('.lp-plan-amount');
      const per = el.querySelector('.lp-plan-per');
      if (amt) amt.textContent = period === 'yearly' ? el.dataset.y : el.dataset.m;
      if (per) per.textContent = period === 'yearly' ? c.pricing.perYear : c.pricing.perMonth;
    });
  };
  opts.forEach((o) =>
    o.addEventListener('click', () => {
      opts.forEach((x) => x.classList.toggle('active', x === o));
      apply(o.dataset.period);
    })
  );
  apply('monthly');
}

// FAQ accordion: toggle each item open/closed on click (multiple may be open).
function setupFaq(root) {
  root.querySelectorAll('.lp-faq-q').forEach((btn) => {
    btn.addEventListener('click', () => {
      const item = btn.closest('.lp-faq-item');
      const open = item.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      const ic = btn.querySelector('.lp-faq-ic');
      if (ic) ic.textContent = open ? '−' : '+';
    });
  });
}

// `lang` is fixed for the page's lifetime — English at `/`, Arabic at `/ar` are
// separate documents now (no in-place language switching; the nav language link
// navigates to the sibling URL, which is a real, pre-rendered, indexable page).
export function initLanding(root, lang, { onLaunch }) {
  const render = (overrides) => {
    const { c } = buildMarkup(root, lang, document, overrides);
    wireInteractivity(root, lang, c, onLaunch);
  };
  // Instant first paint from the built-in copy — identical to the pre-rendered
  // HTML, so there's no flash.
  render(null);
  // Then live-patch with admin content overrides (KV via /api/config): re-render
  // once, but only if this language actually has overrides. The build-time
  // prerender bakes the same overrides into the static HTML, so this mostly keeps
  // things fresh between deploys.
  fetch('/api/config')
    .then((r) => (r.ok ? r.json() : null))
    .then((cfg) => {
      if (cfg && cfg[lang] && Object.keys(cfg[lang]).length) render(cfg[lang]);
    })
    .catch(() => {});
}
