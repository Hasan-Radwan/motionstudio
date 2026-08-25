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
  // Manual grants can carry an expiry (monthly / yearly / specific date). Once it
  // passes, the entitlement lapses to free automatically without any cron job.
  if (data?.plan === 'pro' && data.expiresAt && Date.now() > data.expiresAt) {
    return json({ plan: 'free', status: 'expired', expiresAt: data.expiresAt });
  }
  return json({ plan: data?.plan || 'free', status: data?.status || null, expiresAt: data?.expiresAt || null });
}

// ---- User directory (built as people sign in) ----
async function handleTrackUser(request, env) {
  if (!env.SUBS) return json({ ok: false });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const email = (body?.email || '').toLowerCase();
  if (!email) return json({ error: 'no_email' }, 400);
  const key = 'user:' + email;
  const now = Date.now();
  const existing = await env.SUBS.get(key);
  const rec = existing ? JSON.parse(existing) : { email, firstSeen: now };
  if (body.name) rec.name = body.name;
  if (body.provider) rec.provider = body.provider;
  rec.lastSeen = now;
  await env.SUBS.put(key, JSON.stringify(rec));
  return json({ ok: true });
}

// ---- Public site config (editable from the admin dashboard) ----
async function handleGetConfig(env) {
  if (!env.SUBS) return json({});
  const raw = await env.SUBS.get('config:site');
  return json(raw ? JSON.parse(raw) : {});
}

// ---- Admin API (gated by the ADMIN_KEY secret via x-admin-key header) ----
function adminOk(request, env) {
  return !!env.ADMIN_KEY && request.headers.get('x-admin-key') === env.ADMIN_KEY;
}

async function handleAdminUsers(request, env) {
  if (!adminOk(request, env)) return json({ error: 'unauthorized' }, 401);
  if (!env.SUBS) return json({ users: [] });
  const list = await env.SUBS.list({ prefix: 'user:', limit: 1000 });
  const users = [];
  for (const k of list.keys) {
    const rec = JSON.parse((await env.SUBS.get(k.name)) || '{}');
    const subRaw = await env.SUBS.get('sub:' + (rec.email || ''));
    const sub = subRaw ? JSON.parse(subRaw) : null;
    // Reflect a lapsed manual grant as free in the directory too.
    const expired = sub?.plan === 'pro' && sub.expiresAt && Date.now() > sub.expiresAt;
    users.push({
      email: rec.email,
      name: rec.name || '',
      provider: rec.provider || 'local',
      firstSeen: rec.firstSeen || null,
      lastSeen: rec.lastSeen || null,
      plan: expired ? 'free' : sub?.plan || 'free',
      status: expired ? 'expired' : sub?.status || null,
      manual: !!sub?.manual,
      expiresAt: sub?.expiresAt || null,
    });
  }
  users.sort((a, b) => (b.lastSeen || 0) - (a.lastSeen || 0));
  return json({ users });
}

async function handleAdminStats(request, env) {
  if (!adminOk(request, env)) return json({ error: 'unauthorized' }, 401);
  if (!env.SUBS) return json({});
  const users = await env.SUBS.list({ prefix: 'user:', limit: 1000 });
  const subs = await env.SUBS.list({ prefix: 'sub:', limit: 1000 });
  let pro = 0;
  for (const k of subs.keys) {
    const s = JSON.parse((await env.SUBS.get(k.name)) || '{}');
    if (s.plan === 'pro') pro++;
  }
  const total = users.keys.length;
  return json({ totalUsers: total, proUsers: pro, freeUsers: Math.max(0, total - pro) });
}

async function handleAdminSetPlan(request, env) {
  if (!adminOk(request, env)) return json({ error: 'unauthorized' }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const email = (body?.email || '').toLowerCase();
  const plan = body?.plan;
  if (!email || !['free', 'pro'].includes(plan)) return json({ error: 'bad_input' }, 400);
  // Optional expiry for a manual Pro grant (ms timestamp). Absent / null = never
  // expires. Sanity-bound it to a future time; ignore anything in the past.
  let expiresAt = null;
  if (plan === 'pro') {
    const e = Number(body?.expiresAt);
    if (Number.isFinite(e) && e > Date.now()) expiresAt = e;
  }
  await env.SUBS.put(
    'sub:' + email,
    JSON.stringify({
      plan,
      status: plan === 'pro' ? 'active' : 'canceled',
      manual: true,
      expiresAt,
      updatedAt: Date.now(),
    })
  );
  return json({ ok: true, expiresAt });
}

async function handleAdminConfig(request, env) {
  if (!adminOk(request, env)) return json({ error: 'unauthorized' }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  await env.SUBS.put('config:site', JSON.stringify(body || {}));
  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const { pathname } = url;
    const m = request.method;
    if (pathname === '/api/paddle/webhook' && m === 'POST') return handleWebhook(request, env);
    if (pathname === '/api/entitlement' && m === 'GET') return handleEntitlement(url, env);
    if (pathname === '/api/auth/google' && m === 'POST') return handleGoogleAuth(request, env);
    if (pathname === '/api/user/track' && m === 'POST') return handleTrackUser(request, env);
    if (pathname === '/api/config' && m === 'GET') return handleGetConfig(env);
    // admin
    if (pathname === '/api/admin/users' && m === 'GET') return handleAdminUsers(request, env);
    if (pathname === '/api/admin/stats' && m === 'GET') return handleAdminStats(request, env);
    if (pathname === '/api/admin/set-plan' && m === 'POST') return handleAdminSetPlan(request, env);
    if (pathname === '/api/admin/config' && m === 'PUT') return handleAdminConfig(request, env);
    // Everything else → the static site (SPA fallback handled by assets config).
    return env.ASSETS.fetch(request);
  },
};
