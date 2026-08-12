// Subscription plans modal. Shows Free + Pro (with a Monthly/Yearly billing
// toggle), highlights the current plan, and on "Choose" opens Paddle checkout for
// the matching Price ID (or the mock when Paddle isn't configured). A completed
// checkout upgrades the local plan; production must confirm via a server webhook
// (see paddleConfig.js).

import { openModal } from './modal.js';
import { PLANS, PLAN_ORDER, currentPlan, setPlan } from '../account/account.js';
import { openCheckout, onCheckoutComplete } from '../billing/paddle.js';
import { PADDLE, paddleConfigured } from '../billing/paddleConfig.js';
import { currentUser } from '../auth/auth.js';
import { openAuthModal } from './authModal.js';
import { t } from '../i18n.js';

const FEATURES = {
  free: ['All core templates', 'Export up to 720p', 'App watermark', 'Local save'],
  pro: ['All templates', 'Export up to 8K', 'No app watermark', 'Your own watermark'],
};

export function openPlansModal() {
  openModal({
    title: t('Choose your plan'),
    render(body) {
      let period = 'monthly'; // 'monthly' | 'yearly'
      let pendingPlan = null;

      const off = onCheckoutComplete((data) => {
        const planId = data.plan || pendingPlan;
        if (planId) setPlan(planId);
        renderCards();
      });
      body.closest('.modal-backdrop')?.addEventListener('remove', off);

      // ---- billing period toggle ----
      const toggle = document.createElement('div');
      toggle.className = 'segmented billing-toggle';
      const mk = (id, label) => {
        const b = document.createElement('button');
        b.className = 'seg-btn' + (period === id ? ' active' : '');
        b.textContent = label;
        b.addEventListener('click', () => {
          period = id;
          [...toggle.children].forEach((c) => c.classList.toggle('active', c === b));
          renderCards();
        });
        return b;
      };
      toggle.append(mk('monthly', t('Monthly')), mk('yearly', t('Yearly')));

      const grid = document.createElement('div');
      grid.className = 'plans-grid';

      function proPrice() {
        return period === 'yearly' ? PLANS.pro.priceYearly : PLANS.pro.priceMonthly;
      }
      function proPriceId() {
        const key = period === 'yearly' ? PLANS.pro.paddleKeyYearly : PLANS.pro.paddleKeyMonthly;
        return PADDLE.prices[key];
      }

      function renderCards() {
        grid.innerHTML = '';
        const cur = currentPlan().id;
        for (const id of PLAN_ORDER) {
          const plan = PLANS[id];
          const isFree = id === 'free';
          const card = document.createElement('div');
          card.className =
            'plan-card' + (id === 'pro' ? ' featured' : '') + (id === cur ? ' current' : '');

          const per = period === 'yearly' ? t('/ yr') : t('/ mo');
          const price = isFree
            ? `<span class="plan-free">${t('Free')}</span>`
            : `<span class="plan-cur">$</span>${proPrice()}<span class="plan-per">${per}</span>`;

          card.innerHTML = `
            <h3>${plan.name}</h3>
            <div class="plan-price">${price}</div>
            <ul>${(FEATURES[id] || []).map((f) => `<li>${t(f)}</li>`).join('')}</ul>`;

          const btn = document.createElement('button');
          btn.className = 'btn ' + (id === 'pro' ? 'btn-primary' : '');
          btn.style.width = '100%';
          if (id === cur) {
            btn.textContent = t('Current plan');
            btn.disabled = true;
          } else {
            btn.textContent = isFree ? t('Switch to Free') : t('Choose');
            btn.addEventListener('click', () => choose(plan));
          }
          card.appendChild(btn);
          grid.appendChild(card);
        }
      }

      async function choose(plan) {
        if (plan.id === 'free') {
          setPlan('free');
          renderCards();
          return;
        }
        const user = currentUser();
        if (!user) {
          openAuthModal({ startTab: 'signup', onDone: () => choose(plan) });
          return;
        }
        pendingPlan = plan.id;
        await openCheckout({ priceId: proPriceId(), planId: plan.id, email: user.email });
      }

      renderCards();
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = paddleConfigured()
        ? t('Secure checkout by Paddle.')
        : t('Demo mode — add your Paddle keys to enable real checkout.');
      body.append(toggle, grid, note);
    },
  });
}
