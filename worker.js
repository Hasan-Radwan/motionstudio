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

// ---- Google Sign-In: verify the ID token (JWT, RS256) against Google's keys ----
function b64urlToBytes(s) {
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  const bin = atob(s + '='.repeat(pad));
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
const b64urlToStr = (s) => new TextDecoder().decode(b64urlToBytes(s));

async function verifyGoogleIdToken(idToken, clientId) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) return null;
  const [h, p, sig] = parts;
  let header, payload;
  try {
    header = JSON.parse(b64urlToStr(h));
    payload = JSON.parse(b64urlToStr(p));
  } catch {
    return null;
  }
  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== clientId) return null;
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(payload.iss)) return null;
  if (payload.exp && payload.exp < now) return null;
  if (payload.email_verified === false) return null;

  // Fetch Google's public keys and verify the RS256 signature.
  const certs = await fetch('https://www.googleapis.com/oauth2/v3/certs').then((r) => r.json());
  const jwk = (certs.keys || []).find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );
  const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64urlToBytes(sig), enc.encode(`${h}.${p}`));
  if (!ok) return null;
  return { email: (payload.email || '').toLowerCase(), name: payload.name || '' };
}

async function handleGoogleAuth(request, env) {
  const clientId = env.GOOGLE_CLIENT_ID;
  if (!clientId) return json({ error: 'not_configured' }, 400);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const profile = await verifyGoogleIdToken(body?.credential, clientId);
  if (!profile || !profile.email) return json({ error: 'invalid_token' }, 401);
  return json({ email: profile.email, name: profile.name });
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
    if (url.pathname === '/api/auth/google' && request.method === 'POST') {
      return handleGoogleAuth(request, env);
    }
    // Everything else → the static site (SPA fallback handled by assets config).
    return env.ASSETS.fetch(request);
  },
};
