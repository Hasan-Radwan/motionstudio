// Account plans + entitlements. Defines the subscription tiers and what each one
// unlocks, and tracks the signed-in user's current plan. Plan state is stored
// locally per user for now; in production it should come from your server after
// Paddle webhooks confirm the subscription (see paddleConfig.js).

import { onAuth, currentUser } from '../auth/auth.js';

// `paddleKey` maps a plan to its Price ID in paddleConfig.PADDLE.prices.
export const PLANS = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    paddleKey: null,
    maxQuality: 720, // export cap (px, shorter side)
    ownWatermark: false, // may use their own logo watermark
    appWatermark: true, // forced app credit watermark
    audio: false, // music/audio upload
    fonts: false, // custom font upload
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    priceMonthly: 9,
    priceYearly: 90,
    paddleKeyMonthly: 'pro_monthly',
    paddleKeyYearly: 'pro_yearly',
    maxQuality: 4320, // up to 8K
    ownWatermark: true,
    appWatermark: false,
    audio: true,
    fonts: true,
  },
};

// Whether the current plan may upload/use audio.
export function audioAllowed() {
  return !!currentPlan().audio;
}

// Whether the current plan may upload/use custom fonts.
export function fontsAllowed() {
  return !!currentPlan().fonts;
}

export const PLAN_ORDER = ['free', 'pro'];

const KEY = 'ms-plan:'; // + userId
const listeners = new Set();
let planId = 'free';

function load(userId) {
  planId = (userId && localStorage.getItem(KEY + userId)) || 'free';
  listeners.forEach((fn) => fn(currentPlan()));
}

export function currentPlan() {
  return PLANS[planId] || PLANS.free;
}
export function isPaid() {
  return planId !== 'free';
}
export function setPlan(id) {
  if (!PLANS[id]) return;
  planId = id;
  const u = currentUser();
  if (u) localStorage.setItem(KEY + u.id, id);
  listeners.forEach((fn) => fn(currentPlan()));
}
export function onPlan(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Whether a given export quality (shorter-side px) is allowed on the current plan.
export function qualityAllowed(px) {
  return px <= currentPlan().maxQuality;
}

// Fetch the authoritative plan from the server (Paddle webhook → KV) and apply it.
// - Upgrade: adopt a server-confirmed paid plan.
// - Downgrade: drop to Free immediately when the server reports an ENDED
//   subscription (status canceled/paused/past_due). We key the downgrade off
//   `status`, not merely plan==='free', so a freshly-completed checkout whose
//   webhook hasn't landed yet (status null or 'active') is never wiped before it's
//   confirmed pro.
// Fails silently when the API isn't deployed yet.
export async function syncEntitlement(email) {
  if (!email) return;
  try {
    const r = await fetch(`/api/entitlement?email=${encodeURIComponent(email)}`, {
      cache: 'no-store',
    });
    if (!r.ok) return;
    const d = await r.json();
    if (!d) return;
    if (d.plan && d.plan !== 'free' && PLANS[d.plan]) {
      setPlan(d.plan);
      return;
    }
    const ended =
      d.status === 'canceled' || d.status === 'paused' || d.status === 'past_due' || d.status === 'expired';
    if (ended && isPaid()) setPlan('free');
  } catch {
    /* API not available yet — keep local state */
  }
}

// Re-load the plan whenever the signed-in user changes (guest → free).
onAuth((user) => load(user?.id || null));
load(currentUser()?.id || null);
