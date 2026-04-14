import Stripe from 'stripe';

const globalForStripe = globalThis as unknown as {
  stripe: Stripe | undefined;
};

export function getStripe(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not set');
  }
  const client = new Stripe(secretKey, {
    apiVersion: '2026-03-25.dahlia',
    typescript: true,
  });
  if (process.env.NODE_ENV !== 'production') {
    globalForStripe.stripe = client;
  }
  return client;
}
