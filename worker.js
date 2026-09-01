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

// ---- Email (Resend) ---------------------------------------------------------
// Workers can't open SMTP, so all outbound mail goes through Resend's HTTP API.
// Config (add in the dashboard / `wrangler secret put`):
//   RESEND_API_KEY — secret (required to actually send; unset = no-op)
//   EMAIL_FROM     — e.g. "Rotion <hello@rotionapp.com>" (needs a verified domain)
//   SITE_URL       — e.g. "https://rotionapp.com" (used in links)
//   EMAIL_ADDRESS  — physical mailing address for the footer (CAN-SPAM); optional
const EMAIL_FROM_FALLBACK = 'Rotion App <onboarding@resend.dev>'; // works for tests before domain verification

function emailFrom(env) {
  return env.EMAIL_FROM || EMAIL_FROM_FALLBACK;
}
function siteUrl(env) {
  return (env.SITE_URL || 'https://rotionapp.com').replace(/\/+$/, '');
}
function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function genToken() {
  return crypto.randomUUID().replace(/-/g, '');
}

// POST an email through Resend. Returns {ok, id} or {ok:false, error}. No-ops
// (skipped) when the API key isn't configured so the Worker still works.
async function sendEmail(env, { to, subject, html, text, headers, replyTo, tags }) {
  if (!env.RESEND_API_KEY) return { ok: false, skipped: true, error: 'no_api_key' };
  const body = { from: emailFrom(env), to: Array.isArray(to) ? to : [to], subject };
  if (html) body.html = html;
  if (text) body.text = text;
  if (replyTo) body.reply_to = replyTo;
  if (headers) body.headers = headers;
  if (tags) body.tags = tags;
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data?.message || data?.name || `http_${res.status}` };
    return { ok: true, id: data?.id || null };
  } catch (e) {
    return { ok: false, error: String((e && e.message) || e) };
  }
}

// Shared dark-themed, RTL-aware shell for every email (inline CSS only). When a
// `token` is given, a working unsubscribe link + physical address are appended.
function emailShell(env, { bodyHtml, token }) {
  const site = siteUrl(env);
  const unsub = token ? `${site}/api/email/unsubscribe?t=${token}` : site;
  const addr = env.EMAIL_ADDRESS ? `<div style="margin-top:6px">${esc(env.EMAIL_ADDRESS)}</div>` : '';
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;background:#0b0b10;color:#e7e7ee;font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif">
  <div style="max-width:480px;margin:0 auto;padding:32px 24px">
    <div style="font-size:22px;font-weight:800;color:#fff">Rotion</div>
    ${bodyHtml}
    <hr style="border:none;border-top:1px solid #24242e;margin:28px 0"/>
    <div style="font-size:12px;color:#8a8a99;line-height:1.7">
      <a href="${site}" style="color:#8a8a99">rotionapp.com</a>
      &middot; <a href="${unsub}" style="color:#8a8a99">إلغاء الاشتراك / Unsubscribe</a>
      ${addr}
    </div>
  </div>
</body></html>`;
}

// Bilingual welcome email (transactional — sent once on first sign-in).
function buildWelcomeEmail(env, rec) {
  const site = siteUrl(env);
  const token = rec.emailToken || '';
  const unsub = token ? `${site}/api/email/unsubscribe?t=${token}` : site;
  const bodyHtml = `
    <h1 style="font-size:20px;color:#fff;margin:20px 0 10px">مرحباً بك في Rotion 👋</h1>
    <p style="line-height:1.9;color:#c9c9d4;margin:0 0 14px">
      شكراً لانضمامك! Rotion يحوّل صورك إلى فيديو موشن جذّاب: اختر قالباً، أضف صورك، وصدّر فيديو يدور تلقائياً بلا برامج معقّدة.
    </p>
    <p style="line-height:1.8;color:#9a9aa8;margin:0 0 22px;font-size:14px">
      Welcome to Rotion — pick a template, add your images, and export a looping motion video.
    </p>
    <a href="${site}/app" style="display:inline-block;background:#00E5A0;color:#04120c;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:10px">افتح المحرّر · Open the editor</a>`;
  return {
    subject: 'مرحباً بك في Rotion 🎬',
    html: emailShell(env, { bodyHtml, token }),
    text: `مرحباً بك في Rotion!\n\nاختر قالباً، أضف صورك، وصدّر فيديو موشن.\nافتح المحرّر: ${site}/app\n\nإلغاء الاشتراك: ${unsub}`,
    headers: token
      ? { 'List-Unsubscribe': `<${unsub}>`, 'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click' }
      : undefined,
    tags: [{ name: 'type', value: 'welcome' }],
  };
}

// One-click / link unsubscribe. The token is opaque (maps to the email in KV) so
// no personal data ever rides in the URL. Serves a small bilingual confirmation.
async function handleUnsubscribe(url, env) {
  const token = (url.searchParams.get('t') || '').replace(/[^a-f0-9]/gi, '').slice(0, 64);
  const page = (title, msg) =>
    new Response(
      `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<div style="font-family:-apple-system,Segoe UI,Tahoma,Arial,sans-serif;max-width:440px;margin:12vh auto;padding:0 24px;text-align:center;color:#1a1a22">
  <div style="font-size:22px;font-weight:800">Rotion</div>
  <h1 style="font-size:19px;margin:18px 0 8px">${esc(title)}</h1>
  <p style="color:#555;line-height:1.7">${esc(msg)}</p>
  <a href="${siteUrl(env)}" style="color:#0a9;text-decoration:none">rotionapp.com</a>
</div>`,
      { headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' } }
    );
  if (!token || !env.SUBS) return page('رابط غير صالح · Invalid link', 'رابط إلغاء الاشتراك غير صالح.');
  const email = await env.SUBS.get('unsub:' + token);
  if (!email) return page('رابط غير صالح · Invalid link', 'هذا الرابط غير صالح أو منتهٍ.');
  const key = 'user:' + email;
  const raw = await env.SUBS.get(key);
  if (raw) {
    const rec = JSON.parse(raw);
    rec.unsubscribed = true;
    rec.marketingConsent = false;
    rec.unsubscribedAt = Date.now();
    await env.SUBS.put(key, JSON.stringify(rec));
  }
  return page('تم إلغاء الاشتراك ✓', 'لن تصلك رسائل تسويقية بعد الآن · You have been unsubscribed from marketing emails.');
}

// TEMP diagnostic (no auth): sends to the sender's OWN domain address (no third
// party / no spam vector) and reports whether the API key reached the Worker plus
// the raw Resend result. Remove once email delivery is confirmed working.
function fromAddress(env) {
  const f = emailFrom(env);
  const m = f.match(/<([^>]+)>/);
  return (m ? m[1] : f).trim();
}
async function handleEmailDiag(url, env) {
  if ((url.searchParams.get('k') || '') !== 'diag') return json({ error: 'not_found' }, 404);
  const to = fromAddress(env);
  const send = await sendEmail(env, {
    to,
    subject: 'Rotion diag',
    text: 'diagnostic',
    html: emailShell(env, { bodyHtml: '<p style="color:#c9c9d4">diagnostic</p>', token: '' }),
    tags: [{ name: 'type', value: 'diag' }],
  });
  return json({ hasApiKey: !!env.RESEND_API_KEY, from: emailFrom(env), to, siteUrl: siteUrl(env), send });
}

// Admin: send a one-off test email to verify Resend + domain setup end-to-end.
async function handleAdminSendTest(request, env) {
  if (!adminOk(request, env)) return json({ error: 'unauthorized' }, 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const to = (body?.to || '').toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) return json({ error: 'bad_email' }, 400);
  const r = await sendEmail(env, {
    to,
    subject: 'Rotion — اختبار البريد / test email',
    html: emailShell(env, {
      bodyHtml:
        '<p style="color:#c9c9d4;line-height:1.9;margin:20px 0">هذا اختبار من Rotion. إن وصلك فالإعداد يعمل ✅<br/>This is a Rotion test email — your setup works ✅</p>',
      token: '',
    }),
    text: 'Rotion test email — your setup works.',
    tags: [{ name: 'type', value: 'test' }],
  });
  return json(r, r.ok ? 200 : 502);
}

// ---- User directory (built as people sign in) ----
async function handleTrackUser(request, env, ctx) {
  if (!env.SUBS) return json({ ok: false });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const email = (body?.email || '').toLowerCase().trim();
  // Basic email sanity + bound, so it's a safe KV key and directory entry.
  if (!email || email.length > 200 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'bad_email' }, 400);
  }
  const key = 'user:' + email;
  const now = Date.now();
  const existing = await env.SUBS.get(key);
  const isNew = !existing;
  const rec = existing ? JSON.parse(existing) : { email, firstSeen: now };
  // Clamp / whitelist attacker-controlled fields (the admin panel also escapes them).
  if (body.name) rec.name = String(body.name).slice(0, 80);
  if (body.provider) rec.provider = ['local', 'google'].includes(body.provider) ? body.provider : 'local';
  rec.lastSeen = now;
  if (isNew) {
    // Soft opt-in at signup for product/offer emails; every marketing email carries
    // a one-click unsubscribe. Replace with an explicit consent checkbox when ready.
    rec.marketingConsent = body.marketingConsent === false ? false : true;
    rec.unsubscribed = false;
    if (!rec.emailToken) rec.emailToken = genToken();
  }
  await env.SUBS.put(key, JSON.stringify(rec));

  // First sign-in: register the unsubscribe token and send the welcome email once.
  if (isNew && rec.emailToken) {
    await env.SUBS.put('unsub:' + rec.emailToken, email);
    if (!rec.welcomedAt && env.RESEND_API_KEY) {
      const deliver = (async () => {
        const r = await sendEmail(env, { to: email, ...buildWelcomeEmail(env, rec) });
        if (r.ok) {
          rec.welcomedAt = Date.now();
          await env.SUBS.put(key, JSON.stringify(rec));
        }
      })();
      // Fire-and-forget so the sign-in response isn't blocked on the mail send.
      if (ctx && ctx.waitUntil) ctx.waitUntil(deliver);
      else await deliver;
    }
  }
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

// ---- Template popularity (a lightweight open/visit counter per template) ----
async function handleTrackTemplate(request, env) {
  if (!env.SUBS) return json({ ok: false });
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'bad_json' }, 400);
  }
  const id = String(body?.id || '').slice(0, 60).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!id) return json({ error: 'no_id' }, 400);
  const name = String(body?.name || id).slice(0, 60);
  const key = 'tpl:' + id;
  const existing = await env.SUBS.get(key);
  const rec = existing ? JSON.parse(existing) : { id, name, count: 0 };
  rec.count = (rec.count || 0) + 1;
  rec.name = name; // keep the display name fresh
  rec.lastSeen = Date.now();
  await env.SUBS.put(key, JSON.stringify(rec));
  return json({ ok: true });
}

async function handleAdminTemplates(request, env) {
  if (!adminOk(request, env)) return json({ error: 'unauthorized' }, 401);
  if (!env.SUBS) return json({ templates: [] });
  const list = await env.SUBS.list({ prefix: 'tpl:', limit: 1000 });
  const templates = [];
  for (const k of list.keys) {
    const rec = JSON.parse((await env.SUBS.get(k.name)) || '{}');
    templates.push({ id: rec.id || k.name.slice(4), name: rec.name || '', count: rec.count || 0, lastSeen: rec.lastSeen || null });
  }
  templates.sort((a, b) => b.count - a.count);
  return json({ templates });
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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const { pathname } = url;
    const m = request.method;
    if (pathname === '/api/paddle/webhook' && m === 'POST') return handleWebhook(request, env);
    if (pathname === '/api/entitlement' && m === 'GET') return handleEntitlement(url, env);
    if (pathname === '/api/auth/google' && m === 'POST') return handleGoogleAuth(request, env);
    if (pathname === '/api/user/track' && m === 'POST') return handleTrackUser(request, env, ctx);
    if (pathname === '/api/track/template' && m === 'POST') return handleTrackTemplate(request, env);
    if (pathname === '/api/config' && m === 'GET') return handleGetConfig(env);
    if (pathname === '/api/email/unsubscribe' && (m === 'GET' || m === 'POST')) return handleUnsubscribe(url, env);
    if (pathname === '/api/email/diag' && m === 'GET') return handleEmailDiag(url, env);
    // admin
    if (pathname === '/api/admin/send-test' && m === 'POST') return handleAdminSendTest(request, env);
    if (pathname === '/api/admin/users' && m === 'GET') return handleAdminUsers(request, env);
    if (pathname === '/api/admin/stats' && m === 'GET') return handleAdminStats(request, env);
    if (pathname === '/api/admin/templates' && m === 'GET') return handleAdminTemplates(request, env);
    if (pathname === '/api/admin/set-plan' && m === 'POST') return handleAdminSetPlan(request, env);
    if (pathname === '/api/admin/config' && m === 'PUT') return handleAdminConfig(request, env);
    // Everything else → the static site (SPA fallback handled by assets config).
    return env.ASSETS.fetch(request);
  },
};
