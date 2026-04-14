import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { stripe } from '@/lib/stripe/client';
import { db, schema } from '@/db/client';
import { sendPurchaseConfirmation } from '@/lib/email/purchase-confirmation';

export const runtime = 'nodejs';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 },
    );
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 },
    );
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;

  const userId = session.metadata?.userId;
  const productSlug = session.metadata?.productSlug;
  const stripeSessionId = session.id;
  const paymentIntentId =
    typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id;
  const amountCents = session.amount_total ?? 0;
  const currency = session.currency ?? 'usd';

  if (!userId || !productSlug || !paymentIntentId) {
    return NextResponse.json(
      { error: 'Checkout session missing required metadata' },
      { status: 400 },
    );
  }

  const inserted = await db
    .insert(schema.purchases)
    .values({
      userId,
      productSlug,
      stripeSessionId,
      stripePaymentIntentId: paymentIntentId,
      amountCents,
      currency,
    })
    .onConflictDoNothing({ target: schema.purchases.stripeSessionId })
    .returning();

  if (inserted.length > 0) {
    const customerEmail =
      session.customer_details?.email ?? session.customer_email;
    if (customerEmail) {
      await sendPurchaseConfirmation({
        to: customerEmail,
        productSlug,
        purchaseId: inserted[0].id,
      });
    }
  }

  return NextResponse.json({ received: true });
}
