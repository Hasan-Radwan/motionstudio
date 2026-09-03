// Paddle Billing client integration. Loads Paddle.js from the CDN on demand,
// initializes it with your client-side token, and opens the hosted checkout
// overlay for a plan's Price ID. When Paddle isn't configured yet it runs a mock
// checkout so the flow is fully testable. Real, durable entitlement must be
// confirmed by a server webhook (see paddleConfig.js).

import { PADDLE, paddleConfigured } from './paddleConfig.js';

let _paddle = null; // the global Paddle instance once loaded
let _loading = null; // in-flight load promise
const _completeHandlers = new Set();

// Notified when a checkout completes (data = Paddle event detail, or a mock).
export function onCheckoutComplete(fn) {
  _completeHandlers.add(fn);
  return () => _completeHandlers.delete(fn);
}

// Report a completed purchase to GA4 so revenue/conversions attribute to the
// visitor's acquisition channel. Reads the Paddle event defensively (field names
// can vary), and never throws — analytics must not break checkout.
function trackPurchase(data) {
  try {
    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;
    const d = data?.data || {};
    const totals = d.totals || d.recurring_totals || {};
    const value = Number(totals.total ?? totals.grand_total ?? totals.subtotal);
    window.gtag('event', 'purchase', {
      transaction_id: d.transaction_id || d.id || undefined,
      value: Number.isFinite(value) ? value : undefined,
      currency: d.currency_code || 'USD',
      items: (d.items || []).map((it) => ({
        item_id: it?.price_id || it?.price?.id || undefined,
        item_name: it?.product?.name || it?.price?.name || 'Rotion Pro',
        price: Number(it?.totals?.total) || undefined,
        quantity: it?.quantity || 1,
      })),
    });
  } catch {
    /* analytics is best-effort */
  }
}

function injectScript() {
  return new Promise((resolve, reject) => {
    if (window.Paddle) return resolve(window.Paddle);
    const s = document.createElement('script');
    s.src = 'https://cdn.paddle.com/paddle/v2/paddle.js';
    s.async = true;
    s.onload = () => resolve(window.Paddle);
    s.onerror = () => reject(new Error('Failed to load Paddle.js'));
    document.head.appendChild(s);
  });
}

// Load + initialize Paddle once. Resolves to the Paddle global (or null if not
// configured, in which case callers fall back to the mock).
export async function loadPaddle() {
  if (!paddleConfigured()) return null;
  if (_paddle) return _paddle;
  if (_loading) return _loading;
  _loading = (async () => {
    const Paddle = await injectScript();
    if (PADDLE.environment === 'sandbox') Paddle.Environment.set('sandbox');
    Paddle.Initialize({
      token: PADDLE.token,
      eventCallback: (data) => {
        if (data?.name === 'checkout.completed') {
          trackPurchase(data); // GA4 conversion (real checkouts only; mock skips this)
          _completeHandlers.forEach((fn) => fn(data));
        }
      },
    });
    _paddle = Paddle;
    return Paddle;
  })();
  return _loading;
}

// Fetch the REAL, localized formatted prices for the given Price IDs from Paddle
// (so the displayed price always matches the checkout page). Returns a map
// { priceId: "US$9.00" }. Empty when Paddle isn't configured.
export async function previewPrices(priceIds) {
  const ids = (priceIds || []).filter(Boolean);
  if (!paddleConfigured() || !ids.length) return {};
  try {
    const Paddle = await loadPaddle();
    const res = await Paddle.PricePreview({
      items: ids.map((priceId) => ({ priceId, quantity: 1 })),
    });
    const out = {};
    for (const li of res?.data?.details?.lineItems || []) {
      const id = li?.price?.id;
      const total = li?.formattedTotals?.total ?? li?.formattedTotals?.subtotal;
      if (id && total) out[id] = total;
    }
    return out;
  } catch (e) {
    console.warn('Paddle PricePreview failed:', e);
    return {};
  }
}

// Open checkout for a specific Paddle Price ID. `planId` is passed through to the
// mock completion event so callers can grant the right plan. Returns true if a
// REAL checkout opened, false if we ran the mock.
export async function openCheckout({ priceId, planId, email } = {}) {
  if (paddleConfigured() && priceId) {
    const Paddle = await loadPaddle();
    try {
      window.gtag?.('event', 'begin_checkout', {
        currency: 'USD',
        items: [{ item_id: priceId, item_name: 'Rotion Pro' }],
      });
    } catch {
      /* best-effort */
    }
    Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
      // Rides on the webhook events so the server can map the subscription to us.
      customData: email ? { email } : undefined,
      settings: {
        displayMode: 'overlay',
        theme: 'dark',
        locale: document.documentElement.lang === 'ar' ? 'ar' : 'en',
      },
    });
    return true;
  }
  // Mock: no real payment — simulate a completed checkout so the UI can proceed.
  await new Promise((r) => setTimeout(r, 300));
  _completeHandlers.forEach((fn) => fn({ name: 'checkout.completed', mock: true, plan: planId }));
  return false;
}
