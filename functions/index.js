const functions = require('firebase-functions');
const admin = require('firebase-admin');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

admin.initializeApp();
const db = admin.firestore();

/**
 * Stripe Webhook Handler
 * Automatically unlocks gifts when checkout completes successfully
 * 
 * Expected Checkout Session metadata:
 * - userId: Firebase user ID
 * - giftId: Gift identifier (e.g., 'rose-bouquet')
 * - appId: Application identifier (from config.js)
 */
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook secret not configured');
  }

  let event;

  try {
    // Verify webhook signature to prevent spoofing
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the checkout.session.completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    console.log('✅ Payment completed:', session.id);

    try {
      const { userId, giftId, appId } = session.metadata || {};

      if (!userId || !giftId || !appId) {
        console.error('❌ Missing required metadata:', { userId, giftId, appId });
        return res.status(400).send('Missing metadata in Checkout Session');
      }

      // Unlock the gift in Firestore
      const giftDocRef = db.doc(`artifacts/${appId}/users/${userId}/gifts/unlocked`);
      await giftDocRef.set(
        { [giftId]: true },
        { merge: true }
      );

      console.log(`🎁 Gift unlocked: ${giftId} for user ${userId}`);

      // Optional: Log the purchase transaction
      const purchaseLogRef = db.collection(`artifacts/${appId}/public/data/purchases`);
      await purchaseLogRef.add({
        userId,
        giftId,
        sessionId: session.id,
        amountTotal: session.amount_total,
        currency: session.currency,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        status: 'completed'
      });

      res.json({ received: true, unlocked: giftId });
    } catch (error) {
      console.error('❌ Error processing webhook:', error);
      return res.status(500).send(`Processing error: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  Unhandled event type: ${event.type}`);
    res.json({ received: true });
  }
});

/**
 * Optional: Create a Checkout Session from the client
 * This provides an alternative to using Stripe Payment Links
 * Allows dynamic metadata injection per purchase
 */
exports.createCheckoutSession = functions.https.onCall(async (data, context) => {
  // Require authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { giftId, priceId, appId } = data;

  if (!giftId || !priceId || !appId) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required parameters');
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${functions.config().app?.url || 'https://studio-2fb13.web.app'}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${functions.config().app?.url || 'https://studio-2fb13.web.app'}?canceled=true`,
      metadata: {
        userId: context.auth.uid,
        giftId,
        appId
      }
    });

    return { sessionId: session.id, url: session.url };
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
