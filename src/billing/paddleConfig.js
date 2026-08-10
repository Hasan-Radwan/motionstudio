// Paddle Billing configuration. Fill these from your Paddle dashboard:
//   - token: the CLIENT-SIDE token (starts with `test_` or `live_`) — this is a
//     PUBLIC token, safe to ship in the browser. NOT the secret API key.
//   - prices: the Price IDs (`pri_...`) you created for each paid plan.
//   - environment: 'sandbox' while testing, 'production' when live.
//
// While `token` is empty the app runs a MOCK checkout so the whole flow is
// testable without real keys. The secret API key and subscription webhooks must
// live on a server — see NOTES at the bottom.

export const PADDLE = {
  environment: 'sandbox', // 'sandbox' | 'production'
  token: '', // TODO: paste your Paddle client-side token
  prices: {
    pro: '', // TODO: pri_... for the Pro plan
    teams: '', // TODO: pri_... for the Teams plan
  },
};

// True once a real token + at least one price is configured.
export function paddleConfigured() {
  return !!PADDLE.token && Object.values(PADDLE.prices).some(Boolean);
}

// NOTES — production entitlement (do server-side):
// 1. Create a webhook endpoint that receives Paddle events
//    (subscription.created / .updated / .canceled, transaction.completed) and
//    verify the signature with your Paddle webhook secret.
// 2. On those events, persist the user's plan + status in your DB.
// 3. The client should read entitlement from your server (or a signed token),
//    NOT trust the local optimistic state set after checkout.completed.
