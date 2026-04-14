'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { stripe } from './client';
import { resolveStripePriceId } from './price-map';

export async function createCheckoutSession(productSlug: string) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/products/${productSlug}`)}`,
    );
  }

  const { priceId } = await resolveStripePriceId(productSlug);

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

  const checkout = await stripe.checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    customer_email: session.user.email,
    client_reference_id: session.user.id,
    metadata: {
      userId: session.user.id,
      productSlug,
    },
    success_url: `${baseUrl}/products/account?purchased=${encodeURIComponent(productSlug)}`,
    cancel_url: `${baseUrl}/products/${productSlug}?canceled=1`,
    allow_promotion_codes: false,
  });

  if (!checkout.url) {
    throw new Error('Stripe did not return a checkout URL.');
  }

  redirect(checkout.url);
}
