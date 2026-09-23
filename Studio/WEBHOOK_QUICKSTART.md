# Stripe Webhook Quick Deploy Guide

## 🚀 Deploy in 5 Minutes

### Step 1: Install and Deploy
```powershell
# Install dependencies
cd functions
npm install

# Go back to project root
cd ..

# Deploy functions
firebase deploy --only functions
```

**Copy the webhook URL from output:**
```
✔ functions[stripeWebhook]: Successful create operation.
Function URL: https://us-central1-studio-2fb13.cloudfunctions.net/stripeWebhook
```

---

### Step 2: Configure Stripe Webhook

1. Open [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/test/webhooks)
2. Click **Add endpoint**
3. Paste your function URL
4. Select event: **checkout.session.completed**
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)

---

### Step 3: Add Secrets to Firebase

```powershell
# Add Stripe secret key (get from Stripe Dashboard → API Keys)
firebase functions:config:set stripe.secret_key="sk_test_YOUR_KEY_HERE"

# Add webhook secret (from step 2)
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_SECRET_HERE"

# Redeploy with secrets
firebase deploy --only functions
```

---

### Step 4: Test It!

#### Option A: Test with Stripe CLI (Recommended)
```powershell
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Listen to events
stripe listen --forward-to https://us-central1-studio-2fb13.cloudfunctions.net/stripeWebhook

# In another terminal, trigger a test payment
stripe trigger checkout.session.completed
```

#### Option B: Test with Real Payment
1. Use Stripe test card: `4242 4242 4242 4242`
2. Any future expiry date
3. Any CVC
4. Check Firebase Functions logs:
```powershell
firebase functions:log
```

---

## ✅ Verify It's Working

1. **Functions deployed**: `firebase functions:list`
2. **Webhook configured**: Check Stripe Dashboard → Webhooks (should show green checkmark)
3. **Secrets set**: `firebase functions:config:get`
4. **Test payment**: Gift unlocks in Firestore automatically

---

## 🔥 Next: Add Checkout Session Support

To use automatic metadata (so webhook knows which gift to unlock):

### Update Buy Buttons in HTML

Add `data-price-id` to each gift button:

```html
<button class="buy-gift-btn" 
        data-gift-id="rose-bouquet" 
        data-price-id="price_1234567890"
        data-stripe-url="https://buy.stripe.com/...">
    💎 Buy Gift ($9.99)
</button>
```

Get Price IDs from Stripe Dashboard → Products → Copy price ID.

The client code already checks for `data-price-id` and will use Cloud Functions automatically!

---

## 🐛 Troubleshooting

**Functions not deploying?**
- Check Node version: `node --version` (should be 18 or 20)
- Clear cache: `firebase functions:delete stripeWebhook` then redeploy

**Webhook signature fails?**
- Ensure webhook secret is correct in Firebase config
- Check that Stripe is POSTing to correct URL
- Verify function is deployed: `firebase functions:list`

**Gift not unlocking?**
- Check function logs: `firebase functions:log`
- Verify metadata in Checkout Session (use Stripe Dashboard → Events)
- Ensure Firestore paths match your `appId`

**Need to test locally?**
- Start emulators: `firebase emulators:start`
- Use Stripe CLI: `stripe listen --forward-to http://localhost:5001/studio-2fb13/us-central1/stripeWebhook`

---

## 📚 Full Documentation

See **WEBHOOK_SETUP.md** for complete setup, testing, and troubleshooting guide.
