# SIMPLE VERIFICATION GUIDE

## What You Need to Do

### Option A: Check in Stripe Dashboard (Easiest)
1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click on your webhook endpoint (the one ending with `.workers.dev`)
3. Scroll to "Recent events" section
4. Look for event `evt_1SYXg3IcMSxwbtZN6u7LhbiH`
5. Check if it shows:
   - ✅ Green checkmark = Success! Worker processed it
   - ❌ Red X = Failed (click to see error details)

### Option B: Quick Browser Test (Recommended for Real Verification)

**Step 1:** Open your app at http://localhost:5000 (or wherever it's hosted)

**Step 2:** Open browser console (F12 → Console tab)

**Step 3:** Paste this and press Enter:
```javascript
firebase.auth().currentUser.uid
```
**Copy the output** (it looks like: `xYzAbC123randomString456`)

**Step 4:** Come back here and run this command (replace YOUR_UID):
```powershell
stripe trigger checkout.session.completed --add checkout_session:metadata[giftId]=heart-fireworks --add checkout_session:metadata[userId]=YOUR_UID --add checkout_session:metadata[appId]=ai-enterprise-studio
```

**Step 5:** Wait 3 seconds, then paste this in browser console:
```javascript
const uid = firebase.auth().currentUser.uid;
const ref = doc(db, `artifacts/ai-enterprise-studio/users/${uid}/gifts/unlocked`);
getDoc(ref).then(d => console.log('Your unlocked gifts:', d.data()));
```

**Expected Result:** Should show `{ "heart-fireworks": true }` (or similar)

---

## Need Help?
Tell me:
- Can you access the Stripe dashboard? (Yes/No)
- Can you open your app in a browser? (Yes/No)
- What happens when you try?

I'll adjust the instructions based on your setup.
