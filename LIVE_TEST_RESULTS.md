# Live Test Results

## Test Event Triggered
- **Event ID**: `evt_1SYXg3IcMSxwbtZN6u7LhbiH`
- **Type**: `checkout.session.completed`
- **Timestamp**: 1764359398 (Nov 28, 2025)
- **Status**: Event created successfully

## Metadata Confirmed
```json
{
  "appId": "ai-enterprise-studio",
  "giftId": "rose-bouquet",
  "userId": "test_user_live"
}
```

## Webhook Delivery
- **Endpoint**: `https://stripe-firestore-unlock.e6c8cfc1411431ef0d7ba9c5a69e1ee9.workers.dev`
- **Status**: `pending_webhooks: 1` (Stripe is attempting delivery)

## Next Steps to Verify

### 1. Check Webhook Delivery Status
In Stripe Dashboard → Developers → Webhooks → Click your endpoint → View Recent Deliveries
- Look for event `evt_1SYXg3IcMSxwbtZN6u7LhbiH`
- Check Response Code (should be 200)
- View Response Body

### 2. Verify Firestore Document (Browser Console)
Since we used `userId: test_user_live` (not a real Firebase Auth UID), the Worker will attempt to write to:
```
artifacts/ai-enterprise-studio/users/test_user_live/gifts/unlocked
```

**To verify with a REAL user:**
1. Open your app in browser
2. Get actual UID:
```javascript
firebase.auth().currentUser.uid
```
3. Trigger another test with that UID:
```powershell
stripe trigger checkout.session.completed `
  --add checkout_session:metadata[giftId]=heart-fireworks `
  --add checkout_session:metadata[userId]=YOUR_REAL_UID `
  --add checkout_session:metadata[appId]=ai-enterprise-studio
```
4. Check Firestore (wait 2-3 seconds):
```javascript
const uid = firebase.auth().currentUser.uid;
const ref = doc(db, `artifacts/ai-enterprise-studio/users/${uid}/gifts/unlocked`);
getDoc(ref).then(d => console.log('Gifts:', d.data()));
```

### 3. Monitor Worker Logs (Optional)
```powershell
cd cloudflare-worker
wrangler tail
```
Then trigger another event to see real-time processing.

## Event JSON Captured
Full event saved to: `evaluation/event_rose_bouquet.json`

## Summary
✅ Stripe CLI installed and authenticated
✅ Test event triggered successfully
✅ Metadata properly attached (appId, giftId, userId)
✅ Event JSON captured for future test dataset
⏳ Webhook delivery in progress
⏳ Firestore verification pending (requires real Auth UID)
