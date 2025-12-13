# Cloudflare Worker: Stripe Webhook → Firestore Gift Unlock

Secure, pay-as-you-go free alternative to Firebase Cloud Functions (no Blaze plan required). This Worker receives Stripe webhooks for `checkout.session.completed` and unlocks gifts in Firestore using the REST API.

## Why This Exists
Firebase Spark plan blocks Cloud Functions. Rather than exposing secrets client-side or relying on manual unlock, this Worker:
- Verifies Stripe webhook signatures (HMAC SHA256) server-side.
- Creates short-lived Google OAuth access tokens from a service account (no long-lived key in client).
- Performs an idempotent Firestore field patch: set `giftId = true` in `artifacts/{APP_ID}/users/{userId}/gifts/unlocked`.

## Prerequisites
1. Stripe account with a Webhook endpoint (add after deployment). Event: `checkout.session.completed`.
2. Service account (GCP) with role: `Cloud Datastore User` (covers Firestore). Download JSON and extract:
   - `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`
3. Firestore database already initialized (your existing Firebase project).
4. Checkout Sessions or Payment Links that include metadata: `giftId`, `userId`, `appId`.
   - If using Payment Links only: You must migrate to Checkout Sessions created via Dashboard or backend to include metadata. Payment Links do not allow arbitrary metadata unless via API.

## Secrets to Set (Wrangler)
```
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put GOOGLE_SERVICE_ACCOUNT_EMAIL
wrangler secret put GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY
wrangler secret put FIRESTORE_PROJECT_ID
wrangler secret put APP_ID
wrangler secret put TOKEN_CACHE_SECONDS   # optional (e.g. 300)
```
The private key may have literal `\n` sequences; Worker code normalizes them.

## wrangler.toml Example
```toml
name = "stripe-firestore-unlock"
main = "worker.js"
compatibility_date = "2025-11-27"

[vars]
# Non-sensitive defaults can go here if desired
```

## Deploy
```
wrangler deploy
```
Copy the deployed URL (e.g. `https://stripe-firestore-unlock.your-subdomain.workers.dev`) and add to Stripe Dashboard > Developers > Webhooks.

## Stripe Webhook Setup
Select events: `checkout.session.completed` (minimum). Use the webhook secret Stripe gives after creation as `STRIPE_WEBHOOK_SECRET`.

## Metadata Strategy
When creating a Checkout Session (future backend or manual API tool), set:
```json
"metadata": {
  "giftId": "rose-bouquet",
  "userId": "<FIREBASE_UID>",
  "appId": "<APP_ID_FROM_config.js>"
}
```
The Worker rejects mismatched `appId` for defense-in-depth.

## Firestore Document Schema
Document path unlocked:
```
artifacts/{APP_ID}/users/{userId}/gifts/unlocked
```
Field added/updated:
```
{ giftId: true }
```
This mirrors the client manual unlock logic, enabling a seamless migration (no front-end change needed).

## Security Notes
- Signature verification uses constant-time comparison and timestamp tolerance (±300s).
- Service account key never leaves the Worker; only short-lived access tokens are used for Firestore requests.
- No broad write: Only a single field patch via `updateMask.fieldPaths`.
- If metadata is missing or `appId` mismatched → 4xx rejection.

## Testing Locally
Stripe CLI can forward events:
```
stripe listen --forward-to http://localhost:8787
wrangler dev
```
After a test Checkout Session completes, Stripe CLI should output the event; the Worker logs unlock outcome.

## Failure Handling
Responses are JSON with `ok: false` and details on failure. Stripe will retry failed deliveries automatically; ensure idempotency (PATCH is safe—setting same boolean again).

## Migrating From Manual Unlock Flow
1. Begin generating Checkout Sessions with metadata (or adjust Payment Links if moving to backend API).
2. Deploy Worker, configure webhook.
3. Observe successful unlocks in Firestore (document updates).
4. Remove manual confirmation UI from front-end (optional cleanup).

## Optional Enhancements
- Add rate limiting by userId in-memory map (protect from replay floods).
- Log audit trail: create an additional document in `public/data/sent_gifts` for verification.
- Support multiple event types (refund → re-lock gift if consumable logic changes).

## Disclaimer
Do NOT embed service account or Stripe secret in client code. This Worker isolates sensitive operations. Rotate keys periodically.

## Next Steps
- Configure wrangler & secrets
- Create Sessions with metadata
- Monitor Stripe Dashboard webhooks for success
- Remove any manual unlock prompts after verification period
