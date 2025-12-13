# 💝 Gift Shop - Dating-Friendly Gifting System

The Gift Shop allows users to buy and send animated gifts to each other, creating fun, romantic moments in your app. Perfect for dating platforms, social apps, or any community where users want to connect emotionally.

## 🎁 Features

- **Buy Gifts**: Browse romantic gifts (roses, fireworks, champagne, shooting stars) with clear pricing
- **Send Gifts**: Choose a recipient and send unlocked gifts instantly
- **Live Animations**: Recipients see beautiful MP4 animations when they receive gifts
- **Custom Gifts**: Admins can upload custom MP4 animations for premium gifts
- **Stripe Integration**: Ready for real payments (demo mode works immediately)

## 🚀 How It Works

### For Users

1. **Browse the Shop**: Scroll through available gifts in the Gift Shop section
2. **Buy a Gift**: Click "Buy" on any gift (opens Stripe checkout or unlocks in demo mode)
3. **Select Recipient**: Choose who you want to send the gift to
4. **Send Gift**: Pick from your unlocked gifts and click "Send Gift"
5. **See the Magic**: The recipient sees a full-screen animation with your name

### For Recipients

When someone sends you a gift:
- A beautiful overlay appears with the sender's name
- An MP4 animation plays (or GIF for built-in gifts)
- Click "Thank You!" to close and continue

## 💳 Setting Up Stripe Payments

### 1. Create Stripe Products

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/)
2. Create a product for each gift (e.g., "Rose Bouquet - $2.99")
3. Generate a Payment Link for each product
4. Copy the payment link URL (starts with `https://buy.stripe.com/...`)

### 2. Update Gift Shop HTML

In `public/index.html`, find each gift item and update the `data-stripe-url`:

```html
<button class="buy-gift-btn" 
        data-stripe-url="https://buy.stripe.com/YOUR_ACTUAL_LINK" 
        data-gift-id="rose-bouquet">
    💳 Buy
</button>
```

### 3. Set Up Stripe Webhook (Production)

For automatic gift unlocking after purchase:

1. Create a webhook endpoint in your backend (Cloud Function or server)
2. Listen for `checkout.session.completed` events
3. Extract the customer ID and gift ID
4. Write to Firestore: `artifacts/{appId}/users/{userId}/gifts/unlocked/{giftId}: true`

Example Cloud Function:

```javascript
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const userId = session.client_reference_id; // Pass this when creating checkout
    const giftId = session.metadata.giftId;
    
    await admin.firestore()
      .doc(`artifacts/ai-enterprise-studio/users/${userId}/gifts/unlocked`)
      .set({ [giftId]: true }, { merge: true });
  }
  
  res.json({ received: true });
});
```

## 🎬 Uploading Custom MP4 Gifts (Admin)

### Enable Admin Panel

In `public/index.html`, find this section and uncomment + add your admin user ID:

```javascript
// Show admin section for specific user
if (userId === 'YOUR_ADMIN_USER_ID_HERE') {
    elements.adminGiftUploadSection.style.display = 'block';
}
```

### Upload a Custom Gift

1. **Log in** as admin user
2. **Scroll to Gift Shop** - you'll see "Admin: Upload Custom Gift"
3. **Fill in details**:
   - Gift name (e.g., "Rainbow Unicorn")
   - Price (e.g., 9.99)
   - Stripe payment URL (optional, for paid custom gifts)
   - Select MP4 file (animation video)
4. **Click Upload** - the MP4 is stored in Firebase Storage
5. **Users can now buy/send** your custom gift

### MP4 Requirements

- **Format**: MP4 (H.264 codec recommended)
- **Duration**: 3-10 seconds ideal for gift animations
- **Size**: Under 5MB recommended for fast loading
- **Resolution**: 720p or 1080p (will auto-scale to fit screen)
- **Content**: Romantic, playful, fun animations (hearts, stars, fireworks, etc.)

### Where to Find MP4 Animations

- **Create your own**: Use After Effects, Blender, or Canva
- **Stock videos**: Pexels, Pixabay (check license)
- **Commissioned**: Hire a motion designer on Fiverr/Upwork
- **Convert GIFs**: Use online tools to convert animated GIFs to MP4

## 🎨 Built-In Gifts

The app includes 4 starter gifts (no MP4 upload needed):

| Gift | Emoji | Price | Vibe |
|------|-------|-------|------|
| Rose Bouquet | 🌹 | $2.99 | Classic romance |
| Heart Fireworks | 💖 | $4.99 | Explosive love |
| Champagne Toast | 🥂 | $3.99 | Celebrate together |
| Shooting Star | 🌠 | $5.99 | Make a wish |

These use emoji placeholders and GIF fallbacks (you can replace with custom MP4s).

## 📊 Firestore Schema

### User's Unlocked Gifts

```
artifacts/
  ai-enterprise-studio/
    users/
      {userId}/
        gifts/
          unlocked:
            rose-bouquet: true
            heart-fireworks: true
            lastUpdated: timestamp
```

### Sent Gifts (Public)

```
artifacts/
  ai-enterprise-studio/
    public/
      data/
        sent_gifts/
          {autoId}:
            senderId: "abc123"
            senderName: "John"
            recipientId: "def456"
            giftId: "rose-bouquet"
            timestamp: timestamp
```

### Custom Gifts (Admin)

```
artifacts/
  ai-enterprise-studio/
    public/
      data/
        custom_gifts/
          {giftId}:
            name: "Rainbow Unicorn"
            price: 9.99
            stripeUrl: "https://buy.stripe.com/..."
            videoUrl: "https://firebasestorage.googleapis.com/..."
            createdAt: timestamp
```

## 🎭 Customization Ideas

### Dating Platform Enhancements

- **Profile Gifts**: Show received gift count on profiles ("Received 12 gifts ❤️")
- **Gift History**: Display sent/received gift timeline
- **Gift Notifications**: Push notification when gift arrives
- **Thank You Messages**: Auto-prompt recipient to send a chat message
- **Gift Leaderboard**: Show top gift senders (gamification)
- **Seasonal Gifts**: Valentine's Day, Christmas special animations

### Business Model

- **Freemium**: Give 1-2 free gifts on signup, charge for premium
- **Subscriptions**: "VIP" tier unlocks all gifts
- **Gift Bundles**: "Romantic Bundle" with 5 gifts for $19.99
- **Custom Requests**: Let users commission personalized MP4 animations

## 🛠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| Buy button does nothing | Check Stripe URL is correct and starts with `https://buy.stripe.com/` |
| Gift doesn't unlock | Demo mode: check browser console. Production: verify Stripe webhook is configured |
| Animation doesn't play | Ensure MP4 is H.264 encoded; check browser console for CORS errors |
| Admin panel not showing | Uncomment admin check in code and add your actual user ID |
| Firebase Storage error | Enable Firebase Storage in console (see `ENABLE_STORAGE.md`) |

## 💡 Pro Tips

- **Test in Demo Mode**: Built-in gifts unlock instantly without Stripe for testing
- **Use High-Quality MP4s**: Smooth animations = better user experience
- **A/B Test Pricing**: Try different price points to maximize revenue
- **Promote Gifting**: Add CTA buttons like "Send a gift to break the ice!"
- **Mobile First**: Most users will send gifts on mobile—test thoroughly

## 📈 Next Steps

1. **Set up real Stripe products** and update payment links
2. **Upload 2-3 custom MP4 gifts** to differentiate your app
3. **Add gift analytics** to track revenue and popular gifts
4. **Enable Firebase Storage** if you want MP4 uploads (see `ENABLE_STORAGE.md`)
5. **Deploy** and let users start spreading love! 💝

Happy gifting! 🎁
