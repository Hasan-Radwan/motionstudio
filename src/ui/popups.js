// Bilingual (AR + EN) promo popups with a distinctive design:
//   - showWelcomePopup(): a thank-you + social-follow card, shown once when a
//     brand-new user registers (server reports `isNew`).
//   - showDiscountOnce(): a one-time 50% discount code shown to FREE users at
//     export. Per the brief it vanishes for good once dismissed (localStorage).

const SOCIALS = [
  {
    label: 'X',
    href: 'https://x.com/rotionapp',
    svg: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M18.24 2H21.5l-7.14 8.16L22.75 22h-6.6l-5.17-6.76L4.99 22H1.72l7.64-8.73L1.25 2h6.77l4.67 6.18L18.24 2Zm-1.16 18h1.83L7.01 3.9H5.05L17.08 20Z"/></svg>',
  },
  {
    label: 'Instagram',
    href: 'https://instagram.com/rotionapp',
    svg: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path fill="currentColor" d="M12 2c2.72 0 3.06.01 4.12.06 1.07.05 1.8.22 2.43.47.66.25 1.22.59 1.77 1.14.55.55.89 1.11 1.14 1.77.25.63.42 1.36.47 2.43.05 1.07.06 1.4.06 4.12s-.01 3.06-.06 4.12c-.05 1.07-.22 1.8-.47 2.43-.25.66-.59 1.22-1.14 1.77-.55.55-1.11.89-1.77 1.14-.63.25-1.36.42-2.43.47-1.07.05-1.4.06-4.12.06s-3.06-.01-4.12-.06c-1.07-.05-1.8-.22-2.43-.47a4.9 4.9 0 0 1-1.77-1.14 4.9 4.9 0 0 1-1.14-1.77c-.25-.63-.42-1.36-.47-2.43C2.01 15.06 2 14.72 2 12s.01-3.06.06-4.12c.05-1.07.22-1.8.47-2.43.25-.66.59-1.22 1.14-1.77.55-.55 1.11-.89 1.77-1.14.63-.25 1.36-.42 2.43-.47C8.94 2.01 9.28 2 12 2Zm0 1.8c-2.67 0-2.99.01-4.04.06-.98.04-1.51.21-1.86.35-.47.18-.8.4-1.15.75-.35.35-.57.68-.75 1.15-.14.35-.31.88-.35 1.86-.05 1.05-.06 1.37-.06 4.04s.01 2.99.06 4.04c.04.98.21 1.51.35 1.86.18.47.4.8.75 1.15.35.35.68.57 1.15.75.35.14.88.31 1.86.35 1.05.05 1.37.06 4.04.06s2.99-.01 4.04-.06c.98-.04 1.51-.21 1.86-.35.47-.18.8-.4 1.15-.75.35-.35.57-.68.75-1.15.14-.35.31-.88.35-1.86.05-1.05.06-1.37.06-4.04s-.01-2.99-.06-4.04c-.04-.98-.21-1.51-.35-1.86a3.1 3.1 0 0 0-.75-1.15 3.1 3.1 0 0 0-1.15-.75c-.35-.14-.88-.31-1.86-.35-1.05-.05-1.37-.06-4.04-.06Zm0 3.07a5.13 5.13 0 1 1 0 10.26 5.13 5.13 0 0 1 0-10.26Zm0 1.8a3.33 3.33 0 1 0 0 6.66 3.33 3.33 0 0 0 0-6.66Zm5.34-3.2a1.2 1.2 0 1 1 0 2.4 1.2 1.2 0 0 1 0-2.4Z"/></svg>',
  },
  {
    label: 'YouTube',
    href: 'https://youtube.com/rotionapp',
    svg: '<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path fill="currentColor" d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.09 0 12 0 12s0 3.91.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.91 24 12 24 12s0-3.91-.5-5.8ZM9.6 15.57V8.43L15.82 12 9.6 15.57Z"/></svg>',
  },
];

const DISCOUNT_KEY = 'rotion_discount_50_seen';

function mount(node) {
  (document.getElementById('modal-root') || document.body).appendChild(node);
}

// A dimmed, blurred backdrop (reuses .modal-backdrop) + a distinct promo card.
function baseOverlay(variant) {
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop rt-pop-backdrop';
  const card = document.createElement('div');
  card.className = `rt-pop ${variant}`;
  const x = document.createElement('button');
  x.className = 'rt-pop-x';
  x.type = 'button';
  x.setAttribute('aria-label', 'Close');
  x.innerHTML = '&times;';
  card.appendChild(x);
  backdrop.appendChild(card);

  const destroy = () => {
    backdrop.remove();
    document.removeEventListener('keydown', onKey);
  };
  function onKey(e) {
    if (e.key === 'Escape') destroy();
  }
  x.addEventListener('click', destroy);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) destroy();
  });
  document.addEventListener('keydown', onKey);
  return { backdrop, card, destroy };
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for browsers/contexts without the async clipboard API.
    try {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand('copy');
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

// Thank-you popup with social follow links — shown once on first registration.
export function showWelcomePopup() {
  const { backdrop, card, destroy } = baseOverlay('rt-pop--welcome');
  const socials = SOCIALS.map(
    (s) =>
      `<a class="rt-pop-social" href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}">${s.svg}</a>`
  ).join('');
  const body = document.createElement('div');
  body.className = 'rt-pop-body';
  body.innerHTML = `
    <div class="rt-pop-emoji">🎉</div>
    <h2 class="rt-pop-title">شكراً لتسجيلك في Rotion!</h2>
    <p class="rt-pop-sub" dir="ltr">Thanks for joining Rotion!</p>
    <p class="rt-pop-text">تابِعنا لأحدث القوالب والعروض الحصريّة
      <br><span dir="ltr">Follow us for new templates &amp; exclusive offers</span></p>
    <div class="rt-pop-socials">${socials}</div>
    <button class="rt-pop-btn rt-pop-btn--ghost" type="button" data-close>ابدأ الآن · Start creating</button>
  `;
  card.appendChild(body);
  body.querySelector('[data-close]').addEventListener('click', destroy);
  mount(backdrop);
}

// One-time 50% discount code for FREE users at export. Returns true if shown.
export function showDiscountOnce({ code = 'Rotion', onUpgrade } = {}) {
  try {
    if (localStorage.getItem(DISCOUNT_KEY)) return false;
    localStorage.setItem(DISCOUNT_KEY, '1');
  } catch {
    /* storage blocked — still show it, just may repeat */
  }
  const { backdrop, card, destroy } = baseOverlay('rt-pop--discount');
  const body = document.createElement('div');
  body.className = 'rt-pop-body';
  body.innerHTML = `
    <div class="rt-pop-badge">🎁 50% OFF</div>
    <h2 class="rt-pop-title">كود خصم خاص 50%</h2>
    <p class="rt-pop-sub" dir="ltr">Special 50% discount</p>
    <div class="rt-pop-code">
      <code class="rt-pop-code-val">${code}</code>
      <button class="rt-pop-copy" type="button">نسخ · Copy</button>
    </div>
    <button class="rt-pop-btn" type="button" data-upgrade>رقِّ الآن · Upgrade now</button>
    <p class="rt-pop-note">⏳ ستختفي هذه الرسالة بمجرّد إغلاقها — اغتنم الفرصة!
      <br><span dir="ltr">This message disappears once you close it — grab it now!</span></p>
  `;
  card.appendChild(body);

  const copyBtn = body.querySelector('.rt-pop-copy');
  copyBtn.addEventListener('click', async () => {
    const ok = await copyText(code);
    copyBtn.textContent = ok ? 'تم النسخ ✓ Copied' : `${code}`;
    copyBtn.classList.toggle('ok', ok);
    setTimeout(() => {
      copyBtn.textContent = 'نسخ · Copy';
      copyBtn.classList.remove('ok');
    }, 1800);
  });
  body.querySelector('[data-upgrade]').addEventListener('click', () => {
    destroy();
    if (typeof onUpgrade === 'function') onUpgrade();
  });
  mount(backdrop);
  return true;
}
