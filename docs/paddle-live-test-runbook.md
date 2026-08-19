# Paddle LIVE end-to-end test — manual runbook

> Real money, real records. We use a 100%-off discount so the total is $0 (nothing to refund).
> Run all `curl` in **your** terminal. First:
> ```bash
> export PADDLE_API_KEY='pdl_live_apikey_...'   # your LIVE key. Do NOT paste it in chat.
> export PB='https://api.paddle.com'
> ```
> Every call uses: `-H "Authorization: Bearer $PADDLE_API_KEY" -H 'Content-Type: application/json'`
> (Install `jq` for readable output, or drop the `| jq`.)

---

## 1. Pre-flight

**1a. Confirm the price IDs are LIVE** (Paddle uses the same `pri_` prefix for sandbox + live —
the only true test is whether your LIVE key can see them):
```bash
curl -s "$PB/prices/pri_01kzx846h1a2gbk899zpwr6cmz" -H "Authorization: Bearer $PADDLE_API_KEY" | jq '.data.id, .data.status, .error'
curl -s "$PB/prices/pri_01kzx85yg8ctytb16ayfy90ha9" -H "Authorization: Bearer $PADDLE_API_KEY" | jq '.data.id, .data.status, .error'
```
- ✅ `200` + `status: "active"` → these are your live monthly/yearly prices. Good.
- ❌ `404 / entity_not_found` → the IDs in `paddleConfig.js` are **sandbox** IDs. Stop and replace them with the live catalog IDs.

**1b. Code checks (already done for you):**
- `paddleConfig.js` → `environment: 'production'` ✅
- client token is `live_…` ✅
- `Paddle.Environment.set('sandbox')` is guarded by `if (environment === 'sandbox')` → never runs in production ✅
- `worker.js` makes no sandbox API calls (webhook-receive only) ✅

**1c. Checkout domain approved** — dashboard is the reliable route:
Paddle dashboard → **Checkout → Website approval / Domains** → confirm `rotionapp.com` = **Approved**.
(API: the list-checkout-domains endpoint from the doc you linked; dashboard is fine for a manual check.)

**1d. Business/identity verification** — dashboard → **Business verification** shows **Verified**. Checkout won't open until this passes.

**1e. App deployed to the live domain** — open https://rotionapp.com (not localhost) and confirm the current build is live.

**Do not continue past here until 1a–1e are all green.**

---

## 2. Create the 100%-off discount
```bash
curl -s -X POST "$PB/discounts" \
  -H "Authorization: Bearer $PADDLE_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "description": "LIVE E2E test - 100% off",
    "type": "percentage",
    "amount": "100",
    "enabled_for_checkout": true,
    "code": "LIVETEST100",
    "recur": false,
    "usage_limit": 1
  }' | jq '.data.id, .data.code, .data.status, .error'
```
- `type: percentage` + `amount: "100"` → 100% off (no `currency_code` needed for percentage).
- `usage_limit: 1` → nobody can reuse it. Save the returned **discount id** (`dsc_…`) and the code `LIVETEST100`.

Why: this lets you run a genuine checkout — real card, real webhooks, real transaction + subscription —
at a **$0 total**, so there's nothing to refund afterwards.

---

## 3. Do ONE real checkout (you, in a browser)
1. Open checkout on **https://rotionapp.com** (sign in as your test user first so the plan lands on a known account).
2. In the checkout, open the **promo/discount** field and enter **`LIVETEST100`** → total must drop to **$0.00**.
3. Complete with a **real card**. (At $0 Paddle still creates a real transaction + subscription.)

If checkout doesn't load / discount won't apply / price looks wrong → stop and tell me; we'll debug before verifying.

---

## 4. Verify the result

**Find the transaction + subscription** (newest first):
```bash
curl -s "$PB/transactions?order_by=created_at[DESC]&per_page=5" -H "Authorization: Bearer $PADDLE_API_KEY" \
  | jq '.data[] | {id, status, subscription_id, customer_id, total: .details.totals.grand_total}'
```
- Confirm the top row: `status: "completed"`, `grand_total: "0"`. Save `id` (`txn_…`), `subscription_id` (`sub_…`), `customer_id` (`ctm_…`).

**Webhook delivered + 2xx:**
```bash
curl -s "$PB/notifications?order_by=created_at[DESC]&per_page=10" -H "Authorization: Bearer $PADDLE_API_KEY" \
  | jq '.data[] | {type, status, delivered: .last_attempt_at}'
```
- Look for `transaction.completed` and `subscription.created/activated` with `status: "delivered"`.
- Or dashboard → **Developer Tools → Notifications** → your **live** destination → each attempt shows **200**.
- If you see 401s here → the deployed `PADDLE_WEBHOOK_SECRET` doesn't match this **live** destination's secret. Fix:
  `wrangler secret put PADDLE_WEBHOOK_SECRET` (paste the secret from the live destination), redeploy, and re-send the event from the dashboard.

**Your data layer (Cloudflare KV, not a DB):** the webhook writes the plan into the `SUBS` KV.
```bash
curl -s "https://rotionapp.com/api/entitlement?email=<TEST_EMAIL>" | jq
```
- Expect `{ "plan": "pro", ... }`. (Or admin dashboard → Users → the test email shows **Pro**.)

**Access helper unlocks Pro:** sign in as the test user in the app and confirm:
- 8K export available, **Custom font upload** unlocked, audio panel unlocked, app watermark gone.
  (These are gated by `qualityAllowed / fontsAllowed / audioAllowed / currentPlan()` in `account.js`, which flip once entitlement = `pro`.)

---

## 5. Subscription lifecycle (use the `sub_…` from step 4)

**(a) Upgrade immediately, no charge** (monthly → yearly, proration `do_not_bill`):
```bash
curl -s -X PATCH "$PB/subscriptions/<SUB_ID>" \
  -H "Authorization: Bearer $PADDLE_API_KEY" -H 'Content-Type: application/json' \
  -d '{
    "items": [ { "price_id": "pri_01kzx85yg8ctytb16ayfy90ha9", "quantity": 1 } ],
    "proration_billing_mode": "do_not_bill"
  }' | jq '.data.status, (.data.items[].price.id), .error'
```
- Expect `status: "active"`, item now the yearly price, no new transaction. Then re-check: webhook `subscription.updated` = 200, and `/api/entitlement` still `pro`.

**(b) Scheduled cancellation at period end:**
```bash
curl -s -X POST "$PB/subscriptions/<SUB_ID>/cancel" \
  -H "Authorization: Bearer $PADDLE_API_KEY" -H 'Content-Type: application/json' \
  -d '{ "effective_from": "next_billing_period" }' | jq '.data.status, .data.scheduled_change, .error'
```
- Expect `status: "active"` **with** a `scheduled_change` of type `cancel`. Access **still granted** (`/api/entitlement` = `pro`). Webhook `subscription.updated` = 200.

**(c) Immediate cancellation:**
```bash
curl -s -X POST "$PB/subscriptions/<SUB_ID>/cancel" \
  -H "Authorization: Bearer $PADDLE_API_KEY" -H 'Content-Type: application/json' \
  -d '{ "effective_from": "immediately" }' | jq '.data.status, .error'
```
- Expect `status: "canceled"`. Webhook `subscription.canceled` = 200. Access **denied** — confirm `/api/entitlement` returns `plan: "free"` for the test user.
  ✅ Verified in code: `worker.js` sets `plan: active ? 'pro' : 'free'` on every `subscription.*` event, so `canceled` → KV writes `free`. The **server** downgrades correctly.
  ⚠️ One client nuance: `syncEntitlement()` is upgrade-only, so a browser tab already signed in as Pro won't lose access until **reload** (it re-reads KV on load). The KV/entitlement source of truth is already `free`. Test the entitlement endpoint (above) and/or reload the app to see access removed.

---

## 6. Clean up (leave nothing live)
1. **Subscription canceled** — step 5(c) already did this. Confirm `GET /subscriptions/<SUB_ID>` → `status: "canceled"`.
2. **Archive the discount** so nobody else can use it:
```bash
curl -s -X PATCH "$PB/discounts/<DISCOUNT_ID>" \
  -H "Authorization: Bearer $PADDLE_API_KEY" -H 'Content-Type: application/json' \
  -d '{ "status": "archived" }' | jq '.data.status, .error'
```
- Expect `status: "archived"`.

---

## Done criteria (all must be true before opening to customers)
- [ ] 1a live prices resolve; 1c domain approved; 1d verified; 1e deployed
- [ ] Checkout opened on live domain, `LIVETEST100` → $0, purchase completed
- [ ] Transaction `completed`, total `0`
- [ ] Webhooks delivered, all **2xx**
- [ ] Entitlement/KV shows `pro`; app unlocks Pro features
- [ ] (a) upgrade applied, no charge  (b) scheduled cancel: active + pending, access kept  (c) immediate cancel: canceled, access denied
- [ ] Subscription canceled + discount archived

If any step fails, stop and fix it (I can help debug the app/worker side), then re-run from that step.
