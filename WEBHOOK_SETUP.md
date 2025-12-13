# Stripe Webhook Integration Guide

## 🚀 Quick Setup

### 1. Install Dependencies
```powershell
cd functions
npm install
```

### 2. Configure Stripe Secrets

Create `functions/.env` from the example:
```powershell
cp .env.example .env
```

Fill in your Stripe keys:
- `STRIPE_SECRET_KEY`: Get from [Stripe Dashboard → Developers → API Keys](https://dashboard.stripe.com/test/apikeys)
- `STRIPE_WEBHOOK_SECRET`: Get after creating webhook endpoint (step 4)

### 3. Deploy Functions
```powershell
cd ..
firebase deploy --only functions
```

This creates the webhook endpoint at:
`https://us-central1-studio-2fb13.cloudfunctions.net/stripeWebhook`

### 4. Configure Stripe Webhook

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Enter your function URL (from step 3)
4. Select event: `checkout.session.completed`
5. Copy the **Signing secret** (starts with `whsec_`)
6. Add to `functions/.env` as `STRIPE_WEBHOOK_SECRET`
7. Redeploy: `firebase deploy --only functions`

### 5. Update Stripe Products with Metadata

For each gift in your Stripe Dashboard:

1. Go to **Products** → Select product (e.g., "Rose Bouquet")
2. Add **Price metadata**:
   - `giftId`: `rose-bouquet` (matches your HTML `data-gift-id`)
3. Save

### 6. Two Payment Options

#### Option A: Keep Payment Links (Current - Requires Manual Metadata)
- Payment Links don't support dynamic metadata per buyer
- **Workaround**: Use a claim page after payment where user enters their User ID
- Not ideal for production

#### Option B: Use Checkout Sessions (Recommended)
Modify your client code to call `createCheckoutSession` Cloud Function instead of opening Payment Links. This allows automatic metadata injection.

**Client-side example:**
```javascript
// Instead of window.open(stripeUrl)
const createCheckout = firebase.functions().httpsCallable('createCheckoutSession');
const result = await createCheckout({
    giftId: 'rose-bouquet',
    priceId: 'price_xxxxxxxxxxxx', // Get from Stripe Dashboard
    appId: appId
});
window.location.href = result.data.url;
```

---

## 🧪 Testing Webhooks Locally

### Start Firebase Emulators
```powershell
firebase emulators:start
```

### Use Stripe CLI for Local Testing
```powershell
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to http://localhost:5001/studio-2fb13/us-central1/stripeWebhook
```

Stripe CLI will output a webhook secret like `whsec_test123`. Add it to `.env` temporarily.

### Trigger Test Events
```powershell
stripe trigger checkout.session.completed
```

---

## 📊 How It Works

1. **User clicks Buy** → Opens Stripe Checkout with metadata (`userId`, `giftId`, `appId`)
2. **User completes payment** → Stripe sends `checkout.session.completed` event to webhook
3. **Webhook verifies signature** → Prevents spoofing
4. **Function unlocks gift** → Writes to `artifacts/{appId}/users/{userId}/gifts/unlocked`
5. **Client listens** → Firestore snapshot updates UI automatically

---

## 🔒 Security Notes

- Webhook signature verification prevents unauthorized unlock requests
- Firebase Admin SDK has full Firestore write access (server-side only)
- `.env` file is excluded from version control via `.gitignore`
- Use `firebase functions:config:set` for production secrets instead of `.env`

---

## 🛠️ Production Deployment

### Set Firebase Environment Variables (Instead of .env)
```powershell
firebase functions:config:set stripe.secret_key="sk_live_..." stripe.webhook_secret="whsec_..."
```

### Deploy
```powershell
firebase deploy --only functions
```

### Update Stripe Webhook URL
Change to production Cloud Function URL in Stripe Dashboard.

---

## 📝 Metadata Schema

### Checkout Session Metadata
| Field | Type | Required | Example | Description |
|-------|------|----------|---------|-------------|
| `userId` | string | ✅ | `abc123xyz` | Firebase user ID (from `auth.uid`) |
| `giftId` | string | ✅ | `rose-bouquet` | Gift identifier (matches HTML `data-gift-id`) |
| `appId` | string | ✅ | `your-app-id` | App identifier (from `config.js`) |

---

## 🐛 Troubleshooting

### Webhook not triggering
- Check Firebase Functions logs: `firebase functions:log`
- Verify webhook URL in Stripe Dashboard
- Ensure webhook secret matches deployed function

### Gift not unlocking
- Check Firestore paths match: `artifacts/{appId}/users/{userId}/gifts/unlocked`
- Verify metadata is present in Checkout Session
- Check function logs for errors

### Signature verification fails
- Ensure `STRIPE_WEBHOOK_SECRET` is correct
- Redeploy functions after updating secret
- Check that Stripe is sending to correct endpoint

---

## 🎁 Next Steps

1. ✅ Create Stripe products with proper `giftId` metadata
2. ✅ Test webhook locally with Stripe CLI
3. ✅ Deploy to production and update Stripe webhook URL
4. 🔄 Migrate from Payment Links to Checkout Sessions for automatic metadata
5. 📧 Optional: Add email receipts via Stripe or Cloud Functions
