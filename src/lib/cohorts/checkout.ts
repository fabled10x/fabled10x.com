import { getStripe } from '@/lib/stripe/client';
import type { Cohort } from '@/content/schemas';
import { COHORT_METADATA_KEYS, COHORT_METADATA_KIND } from './constants';

interface CreateCohortCheckoutSessionInput {
  cohort: Cohort;
  applicationId: string;
  userId: string;
  userEmail: string;
}

export async function createCohortCheckoutSession(
  input: CreateCohortCheckoutSessionInput,
): Promise<string> {
  const { cohort, applicationId, userId, userEmail } = input;

  if (cohort.stripePriceId.includes('REPLACE_ME')) {
    throw new Error(
      `Cohort "${cohort.slug}" has a placeholder stripePriceId. Set a real ` +
        `price_xxx in src/content/cohorts/${cohort.slug}.mdx before accepting applicants.`,
    );
  }

  const baseUrl = process.env.AUTH_URL ?? 'http://localhost:3000';

  const session = await getStripe().checkout.sessions.create({
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [{ price: cohort.stripePriceId, quantity: 1 }],
    customer_email: userEmail,
    client_reference_id: userId,
    metadata: {
      [COHORT_METADATA_KEYS.kind]: COHORT_METADATA_KIND,
      [COHORT_METADATA_KEYS.cohortSlug]: cohort.slug,
      [COHORT_METADATA_KEYS.applicationId]: applicationId,
      [COHORT_METADATA_KEYS.userId]: userId,
    },
    success_url: `${baseUrl}/products/account/cohorts?enrolled=${encodeURIComponent(cohort.slug)}`,
    cancel_url: `${baseUrl}/cohorts/${cohort.slug}?canceled=1`,
    allow_promotion_codes: false,
  });

  if (!session.url) {
    throw new Error('Stripe did not return a checkout URL');
  }

  return session.url;
}
