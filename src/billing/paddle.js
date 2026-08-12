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
          _completeHandlers.forEach((fn) => fn(data));
        }
      },
    });
    _paddle = Paddle;
    return Paddle;
  })();
  return _loading;
}

// Open checkout for a specific Paddle Price ID. `planId` is passed through to the
// mock completion event so callers can grant the right plan. Returns true if a
// REAL checkout opened, false if we ran the mock.
export async function openCheckout({ priceId, planId, email } = {}) {
  if (paddleConfigured() && priceId) {
    const Paddle = await loadPaddle();
    Paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
      customer: email ? { email } : undefined,
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
