# Stripe Webhook - Copy/Paste Commands

## 📋 Step-by-Step Commands

### 1️⃣ Install & Deploy
```powershell
# Install function dependencies
cd functions
npm install

# Return to project root
cd ..

# Deploy to Firebase
firebase deploy --only functions
```

**📝 Copy the function URL from output** (you'll need it in step 3)

---

### 2️⃣ Get Your Stripe Keys

Open these URLs and copy the values:

1. **Secret Key**: https://dashboard.stripe.com/test/apikeys
   - Copy the "Secret key" (starts with `sk_test_`)

2. **Create Webhook**: https://dashboard.stripe.com/test/webhooks
   - Click "Add endpoint"
   - Paste your function URL from step 1
   - Select event: `checkout.session.completed`
   - Click "Add endpoint"
   - Copy the "Signing secret" (starts with `whsec_`)

---

### 3️⃣ Add Secrets to Firebase
```powershell
# Replace YOUR_SECRET_KEY and YOUR_WEBHOOK_SECRET with values from step 2
firebase functions:config:set stripe.secret_key="sk_test_YOUR_SECRET_KEY"
firebase functions:config:set stripe.webhook_secret="whsec_YOUR_WEBHOOK_SECRET"

# Redeploy with secrets
firebase deploy --only functions
```

---

### 4️⃣ Test It
```powershell
# View logs
firebase functions:log

# In Stripe Dashboard, click "Send test webhook" to verify setup
```

---

## 🎉 Done!

Your webhook is now live. Payments will automatically unlock gifts in Firestore.

---

## 🔄 Optional: Enable Checkout Sessions

To use automatic metadata (recommended), add Price IDs to your buy buttons.

### Get Price IDs
1. Open: https://dashboard.stripe.com/test/products
2. Click on a product (e.g., "Rose Bouquet")
3. Copy the Price ID (starts with `price_`)

### Update HTML
In `public/index.html`, add `data-price-id` to buy buttons:

```html
<button class="buy-gift-btn" 
        data-gift-id="rose-bouquet" 
        data-price-id="price_1234567890"
        data-stripe-url="https://buy.stripe.com/...">
    💎 Buy Gift ($9.99)
</button>
```

Deploy:
```powershell
firebase deploy --only hosting
```

Client will now use Cloud Functions automatically for checkout with metadata!

---

## 🧪 Test with Stripe CLI (Optional)

```powershell
# Install Stripe CLI: https://stripe.com/docs/stripe-cli

# Login
stripe login

# Forward events to your function
stripe listen --forward-to https://us-central1-studio-2fb13.cloudfunctions.net/stripeWebhook

# In another terminal, trigger test
stripe trigger checkout.session.completed
```

---

## 📚 More Info

- Full guide: `WEBHOOK_SETUP.md`
- Quick guide: `WEBHOOK_QUICKSTART.md`
- Summary: `WEBHOOK_SUMMARY.md`
