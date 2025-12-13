# Live Stripe Webhook Test - Instructions

## Step 1: Get Your Current User ID

Open your app in browser and run in console:
```javascript
firebase.auth().currentUser.uid
```
Copy the output (e.g., `xYzAbC123...`)

## Step 2: Trigger Test Event

Replace `YOUR_USER_ID` with the UID from Step 1:
```powershell
stripe trigger checkout.session.completed `
  --add checkout_session:metadata[giftId]=rose-bouquet `
  --add checkout_session:metadata[userId]=YOUR_USER_ID `
  --add checkout_session:metadata[appId]=ai-enterprise-studio
```

## Step 3: Verify Firestore Update

In browser console (wait 2-3 seconds after trigger):
```javascript
const uid = firebase.auth().currentUser.uid;
const ref = doc(db, `artifacts/ai-enterprise-studio/users/${uid}/gifts/unlocked`);
getDoc(ref).then(d => console.log('Unlocked gifts:', d.data()));
```

Expected output: `{ "rose-bouquet": true, ... }`

## Step 4: Capture Event for Dataset

Note the event ID from Stripe CLI output (starts with `evt_`), then:
```powershell
stripe events retrieve evt_xxxxxxxxxxxxx > evaluation/event_rose_bouquet.json
```

## Troubleshooting

**If gift not unlocking:**
1. Check Cloudflare Worker logs: `wrangler tail` (in cloudflare-worker directory)
2. Verify webhook endpoint in Stripe dashboard matches: `https://stripe-firestore-unlock.e6c8cfc1411431ef0d7ba9c5a69e1ee9.workers.dev`
3. Check Firestore rules allow writes to `artifacts/{appId}/users/{userId}/gifts/unlocked`

**If signature fails:**
- Ensure `STRIPE_WEBHOOK_SECRET` in Cloudflare matches the secret shown in Stripe webhook settings
- Re-run: `wrangler secret put STRIPE_WEBHOOK_SECRET` in cloudflare-worker directory
