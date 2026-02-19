import { NextResponse } from 'next/server';
import { getFirebaseAdminAuth } from '../_firebaseAdmin';
import stripe from '../_stripe';

export async function POST(req) {
  // Get and verify Firebase ID token from Authorization header
  const authHeader = req.headers.get('authorization');
  let realUserId = null;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const idToken = authHeader.split(' ')[1];
    try {
      const decoded = await getFirebaseAdminAuth().verifyIdToken(idToken);
      realUserId = decoded.uid;
    } catch (e) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  } else {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const body = await req.json();
  const { giftId, toUserId } = body;

  // Dynamically import gifts.json to avoid static import issues
  const { default: gifts } = await import('../../data/gifts.json');
  const gift = gifts.find(g => g.id === giftId);
  if (!gift) {
    return NextResponse.json({ error: 'Gift not found' }, { status: 400 });
  }

  // Check Stripe balance for user
  let customerId;
  try {
    const userRecord = await getFirebaseAdminAuth().getUser(realUserId);
    customerId = userRecord.customClaims?.stripeCustomerId;
    if (!customerId) throw new Error('No Stripe customerId');
  } catch (e) {
    return NextResponse.json({ error: 'No Stripe customer for user' }, { status: 400 });
  }

  // Retrieve Stripe balance (assume credits are stored as balance in cents)
  let balance;
  try {
    const balanceObj = await stripe.customers.retrieveBalance(customerId);
    balance = balanceObj.available[0]?.amount || 0;
  } catch (e) {
    return NextResponse.json({ error: 'Could not retrieve Stripe balance' }, { status: 500 });
  }

  if (balance < gift.price * 100) {
    return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
  }

  // Deduct credits (create a negative balance transaction)
  try {
    await stripe.customers.createBalanceTransaction(customerId, {
      amount: -gift.price * 100,
      currency: 'usd',
      description: `Gift: ${gift.title}`,
    });
  } catch (e) {
    return NextResponse.json({ error: 'Could not deduct credits' }, { status: 500 });
  }

  // Log with verified user ID
  console.log('Gift sent:', { giftId, fromUserId: realUserId, toUserId });
  return NextResponse.json({ success: true, fromUserId: realUserId });
}
