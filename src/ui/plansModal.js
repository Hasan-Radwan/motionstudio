// Subscription plans modal. Shows the tiers, highlights the current one, and on
// "Choose" opens Paddle checkout (or the mock when Paddle isn't configured).
// A completed checkout upgrades the local plan; production must confirm via a
// server webhook (see paddleConfig.js).

import { openModal } from './modal.js';
import { PLANS, PLAN_ORDER, currentPlan, setPlan } from '../account/account.js';
import { openCheckout, onCheckoutComplete } from '../billing/paddle.js';
import { paddleConfigured } from '../billing/paddleConfig.js';
import { currentUser } from '../auth/auth.js';
import { openAuthModal } from './authModal.js';
import { t } from '../i18n.js';

const FEATURES = {
  free: ['All core templates', 'Export up to 720p', 'App watermark', 'Local save'],
  pro: ['All templates', 'Export up to 8K', 'No app watermark', 'Your own watermark'],
  teams: ['Everything in Pro', 'Multiple seats', 'Custom templates', 'Priority support'],
};

export function openPlansModal() {
  openModal({
    title: t('Choose your plan'),
    render(body) {
      const grid = document.createElement('div');
      grid.className = 'plans-grid';

      const off = onCheckoutComplete((data) => {
        // Map the completed checkout back to a plan and grant it.
        const planId = data.plan || pendingPlan;
        if (planId) setPlan(planId);
        renderCards();
      });
      // stop listening when the modal is closed
      body.closest('.modal-backdrop')?.addEventListener('remove', off);

      let pendingPlan = null;

      function renderCards() {
        grid.innerHTML = '';
        const cur = currentPlan().id;
        for (const id of PLAN_ORDER) {
          const plan = PLANS[id];
          const card = document.createElement('div');
          card.className = 'plan-card' + (id === 'pro' ? ' featured' : '') + (id === cur ? ' current' : '');

          const price =
            plan.price === 0
              ? `<span class="plan-free">${t('Free')}</span>`
              : `<span class="plan-cur">$</span>${plan.price}<span class="plan-per">${t('/ mo')}</span>`;

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
            btn.textContent = plan.price === 0 ? t('Switch to Free') : t('Choose');
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
          // must be signed in to attach the subscription to an account
          openAuthModal({ startTab: 'signup', onDone: () => choose(plan) });
          return;
        }
        pendingPlan = plan.id;
        await openCheckout(plan, { email: user.email });
        // Real checkout resolves asynchronously via onCheckoutComplete above;
        // the mock also fires it, so no extra handling needed here.
      }

      renderCards();
      const note = document.createElement('p');
      note.className = 'muted';
      note.textContent = paddleConfigured()
        ? t('Secure checkout by Paddle.')
        : t('Demo mode — add your Paddle keys to enable real checkout.');
      body.append(grid, note);
    },
  });
}
