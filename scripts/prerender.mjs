#!/usr/bin/env node
// Build-time pre-rendering for the marketing homepage. Runs AFTER `vite build`
// (so asset filenames are already hashed and correct) and post-processes the
// built dist/index.html:
//   1. Injects real English marketing markup into #landing (was an empty div,
//      populated only by client JS before) → dist/index.html
//   2. Produces an Arabic sibling document with translated meta/JSON-LD/OG and
//      Arabic markup → dist/ar/index.html
// Both documents share the same JS/CSS bundle, so the client "hydrates" by
// simply re-running the identical render logic — no reconciliation needed, the
// content is already correct on first paint for crawlers that don't run JS.
//
// It also bakes in any live admin overrides (hero/about/features/plan-feature
// text edited from /admin, stored in Cloudflare KV) by fetching /api/config
// from the live site before rendering — so the STATIC HTML crawlers see matches
// what a real visitor sees, not just the build-time defaults. If the site isn't
// reachable yet (first-ever deploy, offline dev build) this fails silently and
// falls back to the defaults in copy.js — never blocks the build.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseHTML } from 'linkedom';
import { buildMarkup } from '../src/landing/markup.js';
import { COPY } from '../src/landing/copy.js';
import { ALL_TEMPLATE_NAMES } from '../src/landing/templatesCatalog.js';

// Inject an ItemList of every template name into the page's JSON-LD @graph so
// search engines and AI answer-engines can see and cite the full catalogue
// (otherwise the 61 names live only inside the client-rendered /app).
function addTemplatesItemList(document, lang) {
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (!ld) return;
  const data = JSON.parse(ld.textContent);
  const base = lang === 'ar' ? 'https://rotionapp.com/ar/' : 'https://rotionapp.com/';
  (data['@graph'] ||= []).push({
    '@type': 'ItemList',
    '@id': base + '#templates',
    name: lang === 'ar' ? 'قوالب الموشن في Rotion App' : 'Rotion App motion templates',
    numberOfItems: ALL_TEMPLATE_NAMES.length,
    itemListElement: ALL_TEMPLATE_NAMES.map((name, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
    })),
  });
  ld.textContent = JSON.stringify(data, null, 2);
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const distDir = join(__dirname, '..', 'dist');
const indexPath = join(distDir, 'index.html');

const sourceHtml = readFileSync(indexPath, 'utf8');

// Fetch admin-authored content overrides from the live site. Returns null (→
// callers fall back to copy.js defaults) on any failure or timeout.
async function fetchOverrides() {
  const url = process.env.SITE_CONFIG_URL || 'https://rotionapp.com/api/config';
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 5000);
    const res = await fetch(url, { signal: ctrl.signal });
    clearTimeout(timer);
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === 'object' ? data : null;
  } catch {
    return null; // not live yet / offline build / network hiccup — use defaults
  }
}

const config = await fetchOverrides();
console.log(config ? '✓ Loaded live admin content overrides' : '· No admin overrides (using copy.js defaults)');

// ---------- English (primary, at /) ----------
{
  const { document } = parseHTML(sourceHtml);
  const landing = document.getElementById('landing');
  if (!landing) throw new Error('prerender: #landing not found in dist/index.html');
  buildMarkup(landing, 'en', document, config?.en);
  addTemplatesItemList(document, 'en');
  writeFileSync(indexPath, '<!doctype html>\n' + document.documentElement.outerHTML);
  console.log('✓ Pre-rendered English → dist/index.html');
}

// ---------- Arabic (/ar) ----------
{
  const { document } = parseHTML(sourceHtml); // fresh parse, independent of the English pass
  const html = document.documentElement;
  html.setAttribute('lang', 'ar');
  html.setAttribute('dir', 'rtl');

  const setAttr = (selector, attr, value) => {
    const el = document.querySelector(selector);
    if (el) el.setAttribute(attr, value);
  };
  const setText = (selector, value) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = value;
  };

  setText('title', 'Rotion App — حرّك تصميمك · Motion made simple');
  setAttr('meta[name="description"]', 'content',
    'Rotion App: أداة تصميم حركة في المتصفح — اختر قالباً من 41+ قالب، أضف صورك، وصدّر فيديو متحرك حتى 8K. دعم عربي RTL كامل، بلا رفع لأي خادم.');
  setAttr('link[rel="canonical"]', 'href', 'https://rotionapp.com/ar');

  setAttr('meta[property="og:title"]', 'content', 'Rotion App — حرّك تصميمك · Motion made simple');
  setAttr('meta[property="og:description"]', 'content',
    'أداة تصميم حركة في المتصفح: اختر قالباً، أضف صورك، وصدّر فيديو متحرك حتى 8K. دعم عربي RTL كامل.');
  setAttr('meta[property="og:url"]', 'content', 'https://rotionapp.com/ar');
  setAttr('meta[property="og:image"]', 'content', 'https://rotionapp.com/og-image-ar.svg');
  setAttr('meta[property="og:locale"]', 'content', 'ar_AR');
  setAttr('meta[property="og:locale:alternate"]', 'content', 'en_US');

  setAttr('meta[name="twitter:title"]', 'content', 'Rotion App — حرّك تصميمك · Motion made simple');
  setAttr('meta[name="twitter:description"]', 'content',
    'أداة تصميم حركة في المتصفح: اختر قالباً، أضف صورك، وصدّر فيديو متحرك حتى 8K.');
  setAttr('meta[name="twitter:image"]', 'content', 'https://rotionapp.com/og-image-ar.svg');

  // hreflang link tags stay identical across both documents (Google requires the
  // set to be reciprocal/consistent) — no change needed here.

  // JSON-LD: same Organization/WebApplication entity (@id unchanged, description
  // localized), FAQPage fully localized with a page-specific @id.
  const ld = document.querySelector('script[type="application/ld+json"]');
  if (ld) {
    const data = JSON.parse(ld.textContent);
    for (const node of data['@graph'] || []) {
      if (node['@type'] === 'WebApplication') {
        node.description =
          'أداة تصميم حركة تعمل بالكامل في المتصفح: اختر قالباً، أضف صورك، وصدّر فيديو متحرك حتى 8K. دعم عربي RTL كامل. لا رفع لأي خادم.';
        node.inLanguage = ['ar', 'en'];
        if (node.offers) {
          node.offers[0].description = 'باقة مجانية بالقوالب الأساسية وتصدير حتى 720p.';
          if (node.offers[1]) node.offers[1].description = 'باقة Pro شهرياً: كل القوالب، تصدير حتى 8K، بلا علامة مائية.';
          if (node.offers[2]) node.offers[2].description = 'باقة Pro سنوياً (وفّر 17%): كل القوالب، تصدير حتى 8K، بلا علامة مائية.';
        }
      }
      if (node['@type'] === 'FAQPage') {
        node['@id'] = 'https://rotionapp.com/ar/#faq';
        node.mainEntity = [
          {
            '@type': 'Question',
            name: 'ما هو Rotion App؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Rotion App أداة تصميم حركة تعمل بالكامل في متصفحك: تختار قالباً، تضيف صورك، وتصدّر فيديو متحرك. كل المعالجة تتم على جهازك دون رفع صورك لأي خادم.',
            },
          },
          {
            '@type': 'Question',
            name: 'هل يدعم اللغة العربية؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'نعم، Rotion App يدعم الكتابة العربية RTL بالكامل مع خطوط عربية احترافية مثل Cairo وTajawal.',
            },
          },
          {
            '@type': 'Question',
            name: 'ما أقصى دقة للتصدير؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'الباقة المجانية تصدّر حتى 720p، وباقة Pro تصدّر حتى 8K بصيغتي MP4 وWebM.',
            },
          },
          {
            '@type': 'Question',
            name: 'هل الأداة مجانية؟',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'توجد باقة مجانية دائمة، وباقة Pro بسعر 10 دولارات شهرياً أو 99 دولاراً سنوياً تفتح التصدير 8K وإزالة العلامة والمزيد.',
            },
          },
        ];
      }
    }
    ld.textContent = JSON.stringify(data, null, 2);
  }

  addTemplatesItemList(document, 'ar');

  const landing = document.getElementById('landing');
  if (!landing) throw new Error('prerender: #landing not found while building Arabic variant');
  buildMarkup(landing, 'ar', document, config?.ar);

  const arDir = join(distDir, 'ar');
  mkdirSync(arDir, { recursive: true });
  writeFileSync(join(arDir, 'index.html'), '<!doctype html>\n' + document.documentElement.outerHTML);
  console.log('✓ Pre-rendered Arabic → dist/ar/index.html');

  // Expose the base marketing copy so the admin dashboard can show the current
  // homepage text (as placeholders) instead of empty fields.
  writeFileSync(join(distDir, 'site-copy.json'), JSON.stringify({ en: COPY.en, ar: COPY.ar }));
  console.log('✓ Wrote base copy → dist/site-copy.json');
}
