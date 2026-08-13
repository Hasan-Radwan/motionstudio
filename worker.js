// Cloudflare Worker: serves the static site (ASSETS binding) AND hosts the Paddle
// billing API on the same domain:
//   POST /api/paddle/webhook   — receives Paddle events, verifies the signature
//                                with PADDLE_WEBHOOK_SECRET, stores the plan in KV.
//   GET  /api/entitlement?email=…  — returns the stored plan for an email.
//
// Bindings (add in the dashboard or wrangler.jsonc):
//   ASSETS  — static assets (already configured)
//   SUBS    — KV namespace for subscription state   [optional until set up]
//   PADDLE_WEBHOOK_SECRET — secret (wrangler secret put)   [optional until set up]
//
// Everything is guarded so the Worker still deploys and serves the site before
// KV / the secret are configured.

const enc = new TextEncoder();
const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

// Verify Paddle's `Paddle-Signature: ts=…;h1=…` header. h1 = HMAC-SHA256 of
// `${ts}:${rawBody}` using the webhook secret.
async function verifyPaddleSignature(rawBody, header, secret) {
  if (!secret || !header) return false;
  const parts = Object.fromEntries(
    header.split(';').map((kv) => {
      const i = kv.indexOf('=');
      return [kv.slice(0, i).trim(), kv.slice(i + 1).trim()];
    })
  );
  const { ts, h1 } = parts;
  if (!ts || !h1) return false;
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const mac = await crypto.subtle.sign('HMAC', key, enc.encode(`${ts}:${rawBody}`));
  const computed = [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, '0')).join('');
  return timingSafeEqual(computed, h1);
}

async function handleWebhook(request, env) {
  const raw = await request.text();
  const secret = env.PADDLE_WEBHOOK_SECRET;
  // Not configured yet: accept (200) so Paddle doesn't keep retrying, but do
  // nothing. Once the secret is set, we verify + store.
  if (!secret) return new Response('webhook not configured', { status: 200 });

  const ok = await verifyPaddleSignature(raw, request.headers.get('Paddle-Signature'), secret);
  if (!ok) return new Response('invalid signature', { status: 401 });

  let evt;
  try {
    evt = JSON.parse(raw);
  } catch {
    return new Response('bad json', { status: 400 });
  }

  const type = evt.event_type || '';
  const data = evt.data || {};
  // Email bridge: we pass customData:{email} at checkout, so it rides on the event.
  const email = (data?.custom_data?.email || data?.customer?.email || '').toLowerCase();

  if (email && env.SUBS && type.startsWith('subscription.')) {
    const status = data.status || '';
    const active = status === 'active' || status === 'trialing';
    await env.SUBS.put(
      'sub:' + email,
      JSON.stringify({
        plan: active ? 'pro' : 'free',
        status,
        subscriptionId: data.id || null,
        updatedAt: Date.now(),
      })
    );
  }
  return new Response('ok', { status: 200 });
}

async function handleEntitlement(url, env) {
  const email = (url.searchParams.get('email') || '').toLowerCase();
  if (!email || !env.SUBS) return json({ plan: 'free', status: null });
  const rec = await env.SUBS.get('sub:' + email);
  const data = rec ? JSON.parse(rec) : null;
  return json({ plan: data?.plan || 'free', status: data?.status || null });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/paddle/webhook' && request.method === 'POST') {
      return handleWebhook(request, env);
    }
    if (url.pathname === '/api/entitlement' && request.method === 'GET') {
      return handleEntitlement(url, env);
    }
    // Everything else → the static site (SPA fallback handled by assets config).
    return env.ASSETS.fetch(request);
  },
};
