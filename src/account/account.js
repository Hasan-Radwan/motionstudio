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
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 9,
    paddleKey: 'pro',
    maxQuality: 2160,
    ownWatermark: true,
    appWatermark: false,
  },
  teams: {
    id: 'teams',
    name: 'Teams',
    price: 29,
    paddleKey: 'teams',
    maxQuality: 2160,
    ownWatermark: true,
    appWatermark: false,
  },
};

export const PLAN_ORDER = ['free', 'pro', 'teams'];

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

// Re-load the plan whenever the signed-in user changes (guest → free).
onAuth((user) => load(user?.id || null));
load(currentUser()?.id || null);
