import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  if (!process.env.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_stub_key';
  }
  if (!process.env.AUTH_URL) {
    process.env.AUTH_URL = 'http://localhost:3000';
  }
  return {};
});

const mockSessionsCreate = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    checkout: {
      sessions: {
        create: (...args: unknown[]) => mockSessionsCreate(...args),
      },
    },
  }),
}));

function makeCohort(overrides: Record<string, unknown> = {}) {
  return {
    id: 'cohort-id-1',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery — Q3 2026',
    series: 'ai-delivery',
    tagline: 'tag',
    summary: 'sum',
    status: 'open' as const,
    pillar: 'delivery' as const,
    startDate: '2026-07-01',
    endDate: '2026-09-01',
    durationWeeks: 8,
    capacity: 12,
    priceCents: 200000,
    currency: 'usd',
    stripePriceId: 'price_real_abc123',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-06-01',
    ...overrides,
  };
}

describe('createCohortCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionsCreate.mockResolvedValue({
      id: 'cs_test_cohort_1',
      url: 'https://checkout.stripe.com/c/cs_test_cohort_1',
    });
  });

  it('checkout_create_calls_stripe_with_metadata: passes price, customer_email, client_reference_id, metadata kind/cohortSlug/applicationId/userId', async () => {
    const { createCohortCheckoutSession } = await import('../checkout');
    await createCohortCheckoutSession({
      cohort: makeCohort(),
      applicationId: 'app-1',
      userId: 'user-1',
      userEmail: 'applicant@example.com',
    });
    expect(mockSessionsCreate).toHaveBeenCalledTimes(1);
    const call = mockSessionsCreate.mock.calls[0][0];
    expect(call.mode).toBe('payment');
    expect(call.line_items).toEqual([{ price: 'price_real_abc123', quantity: 1 }]);
    expect(call.customer_email).toBe('applicant@example.com');
    expect(call.client_reference_id).toBe('user-1');
    expect(call.metadata).toMatchObject({
      kind: 'cohort',
      cohortSlug: 'ai-delivery-2026-q3',
      applicationId: 'app-1',
      userId: 'user-1',
    });
  });

  it('checkout_create_returns_session_url: returns session.url from Stripe response', async () => {
    const { createCohortCheckoutSession } = await import('../checkout');
    const url = await createCohortCheckoutSession({
      cohort: makeCohort(),
      applicationId: 'app-1',
      userId: 'user-1',
      userEmail: 'applicant@example.com',
    });
    expect(url).toBe('https://checkout.stripe.com/c/cs_test_cohort_1');
  });

  it('checkout_create_placeholder_price_throws: cohort with stripePriceId containing REPLACE_ME throws BEFORE calling Stripe', async () => {
    const { createCohortCheckoutSession } = await import('../checkout');
    await expect(
      createCohortCheckoutSession({
        cohort: makeCohort({ stripePriceId: 'price_REPLACE_ME_BEFORE_SHIPPING' }),
        applicationId: 'app-1',
        userId: 'user-1',
        userEmail: 'applicant@example.com',
      }),
    ).rejects.toThrow(/placeholder/i);
    expect(mockSessionsCreate).not.toHaveBeenCalled();
  });

  it('checkout_create_no_url_throws: Stripe SDK returns no url → throws', async () => {
    mockSessionsCreate.mockResolvedValueOnce({ id: 'cs_no_url', url: null });
    const { createCohortCheckoutSession } = await import('../checkout');
    await expect(
      createCohortCheckoutSession({
        cohort: makeCohort(),
        applicationId: 'app-1',
        userId: 'user-1',
        userEmail: 'applicant@example.com',
      }),
    ).rejects.toThrow();
  });

  it('checkout_create_success_url_includes_slug: success_url ends with /products/account/cohorts?enrolled=<slug>', async () => {
    const { createCohortCheckoutSession } = await import('../checkout');
    await createCohortCheckoutSession({
      cohort: makeCohort(),
      applicationId: 'app-1',
      userId: 'user-1',
      userEmail: 'applicant@example.com',
    });
    const call = mockSessionsCreate.mock.calls[0][0];
    expect(call.success_url).toContain('/products/account/cohorts?enrolled=ai-delivery-2026-q3');
  });

  it('checkout_create_cancel_url_includes_slug: cancel_url is /cohorts/<slug>?canceled=1', async () => {
    const { createCohortCheckoutSession } = await import('../checkout');
    await createCohortCheckoutSession({
      cohort: makeCohort(),
      applicationId: 'app-1',
      userId: 'user-1',
      userEmail: 'applicant@example.com',
    });
    const call = mockSessionsCreate.mock.calls[0][0];
    expect(call.cancel_url).toContain('/cohorts/ai-delivery-2026-q3?canceled=1');
  });
});
