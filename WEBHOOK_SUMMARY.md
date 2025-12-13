# AI Enterprise Studio - Stripe Webhook Integration

## 📁 What Was Created

```
Studio/
├── functions/
│   ├── index.js              # Stripe webhook handler + Checkout Session creator
│   ├── package.json          # Node dependencies (stripe, firebase-admin, etc.)
│   ├── .env.example          # Template for local secrets
│   └── .gitignore            # Excludes .env and node_modules
├── WEBHOOK_SETUP.md          # Complete setup guide with troubleshooting
├── WEBHOOK_QUICKSTART.md     # 5-minute quick deploy guide
└── public/index.html         # Updated to support Checkout Sessions (optional)
```

---

## 🎯 What the Webhook Does

### Automatic Gift Unlocking Flow

1. **User clicks Buy** → Opens Stripe Checkout
2. **User pays** → Stripe sends `checkout.session.completed` event
3. **Webhook verifies** → Checks signature (prevents spoofing)
4. **Function unlocks** → Writes to Firestore:
   ```
   artifacts/{appId}/users/{userId}/gifts/unlocked
   {
     "rose-bouquet": true,
     "lastUpdated": <timestamp>
   }
   ```
5. **Client updates** → Firestore snapshot listener shows gift instantly

---

## 🚀 Deploy Commands

### Quick Deploy (Production)
```powershell
# Install dependencies
cd functions
npm install
cd ..

# Deploy functions
firebase deploy --only functions

# Set Stripe secrets (get from Stripe Dashboard)
firebase functions:config:set stripe.secret_key="sk_test_..." stripe.webhook_secret="whsec_..."

# Redeploy with secrets
firebase deploy --only functions
```

### Configure Stripe
1. Copy function URL from deploy output
2. Add webhook in [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)
3. Select event: `checkout.session.completed`
4. Done! Payments now auto-unlock gifts

---

## 🔀 Two Payment Methods

### Method 1: Payment Links (Current)
- ✅ Simple, no code changes
- ❌ Can't pass per-buyer metadata automatically
- 🔧 Workaround: Webhook needs to look up user by email or add a claim page

### Method 2: Checkout Sessions (Recommended)
- ✅ Automatic metadata (`userId`, `giftId`, `appId`)
- ✅ Client calls `createCheckoutSession` Cloud Function
- ✅ Webhook gets all needed info
- 🔧 Requires adding `data-price-id` to buy buttons

**Client code already supports both!** Add `data-price-id` attribute to auto-switch to Checkout Sessions.

---

## 🧪 Testing

### Local Testing with Emulators
```powershell
# Start Firebase emulators
firebase emulators:start

# In another terminal, forward Stripe events
stripe listen --forward-to http://localhost:5001/studio-2fb13/us-central1/stripeWebhook

# Trigger test payment
stripe trigger checkout.session.completed
```

### Production Testing
Use Stripe test card: `4242 4242 4242 4242` with any future date and CVC.

---

## 📊 What Gets Logged

### Firestore Writes
1. **Gift unlock**: `artifacts/{appId}/users/{userId}/gifts/unlocked`
2. **Purchase log**: `artifacts/{appId}/public/data/purchases` (optional audit trail)

### Function Logs
```powershell
# View logs
firebase functions:log

# Example output:
✅ Payment completed: cs_test_abc123
🎁 Gift unlocked: rose-bouquet for user xyz789
```

---

## 🔒 Security Features

- **Signature verification**: Prevents fake webhook calls
- **Firebase Admin SDK**: Server-side Firestore access (not exposed to client)
- **Environment secrets**: Stripe keys stored securely in Firebase config
- **Idempotent**: Safe to retry webhook events

---

## 📝 Next Steps

1. ✅ Deploy functions: `firebase deploy --only functions`
2. ✅ Configure Stripe webhook endpoint
3. ✅ Set Firebase secrets: `firebase functions:config:set`
4. 🔄 **Optional**: Add `data-price-id` to buy buttons for Checkout Sessions
5. 🧪 Test with Stripe CLI or test card
6. 🚀 Switch to live mode when ready

---

## 💡 Tips

- **Development**: Use `.env` file in `functions/` directory
- **Production**: Use `firebase functions:config:set` for secrets
- **Monitoring**: Check Firebase Console → Functions → Logs
- **Testing**: Stripe CLI is the fastest way to test webhooks locally
- **Debugging**: Enable detailed logs in Stripe Dashboard → Webhooks → View events

---

## 🆘 Need Help?

- **Full guide**: See `WEBHOOK_SETUP.md`
- **Quick start**: See `WEBHOOK_QUICKSTART.md`
- **Function logs**: `firebase functions:log`
- **Stripe events**: Dashboard → Developers → Events
- **Test locally**: `firebase emulators:start`
