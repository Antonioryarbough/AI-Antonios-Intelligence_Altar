const express = require('express');
const cors = require('cors');
const Stripe = require('stripe');

const app = express();
app.use(cors());
app.use(express.json());

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.error('Missing STRIPE_SECRET_KEY environment variable.');
  process.exit(1);
}

const stripe = Stripe(stripeSecretKey, { apiVersion: '2024-04-10' });

app.post('/create-checkout-session', async (req, res) => {
  try {
    const { giftType, giftPrice, senderEmail, senderUid, recipientEmail, origin, priceId, customerEmail, clientReferenceId } = req.body || {};

    // Handle gift purchase (P2P gifting)
    if (giftType && giftPrice && senderEmail && recipientEmail) {
      const successUrl = `${origin || 'https://raydent-16571.web.app'}/?gift=success&recipient=${encodeURIComponent(recipientEmail)}`;
      const cancelUrl = `${origin || 'https://raydent-16571.web.app'}/?gift=cancel`;

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        customer_email: senderEmail,
        metadata: {
          giftType: giftType,
          senderEmail: senderEmail,
          senderUid: senderUid,
          recipientEmail: recipientEmail
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Gift: ${giftType}`,
                description: `Sending a ${giftType} gift to ${recipientEmail}`
              },
              unit_amount: Math.round(parseFloat(giftPrice) * 100)
            },
            quantity: 1
          }
        ],
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      return res.json({ url: session.url });
    }

    // Handle subscription (30-day trial) - legacy
    if (priceId) {
      const successUrl = `${origin || 'https://raydent-16571.web.app'}/?trial=success`;
      const cancelUrl = `${origin || 'https://raydent-16571.web.app'}/?trial=cancel`;

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        customer_email: customerEmail,
        client_reference_id: clientReferenceId || undefined,
        line_items: [
          {
            price: priceId,
            quantity: 1
          }
        ],
        subscription_data: {
          trial_period_days: 30
        },
        success_url: successUrl,
        cancel_url: cancelUrl
      });

      return res.json({ url: session.url });
    }

    return res.status(400).send('Missing required parameters');
  } catch (error) {
    console.error('Stripe session error:', error);
    return res.status(500).send('Failed to create checkout session');
  }
});

const port = process.env.PORT || 4242;
app.listen(port, () => {
  console.log(`Stripe server running on http://localhost:${port}`);
});
