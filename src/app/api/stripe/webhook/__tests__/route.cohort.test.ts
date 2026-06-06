import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://stubuser:stub@stubhost:5432/stubdb';
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_stub_key';
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_stub_secret';
  }
  if (!process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = 're_test_stub';
  }
  return {};
});

const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  }),
}));

// Track all inserts by target table.
const insertCalls: Array<{ table: unknown; values?: unknown; conflict?: unknown }> = [];
const mockReturning = vi.fn();
vi.mock('@/db/client', () => ({
  db: {
    insert: (table: unknown) => {
      const call: { table: unknown; values?: unknown; conflict?: unknown } = {
        table,
      };
      insertCalls.push(call);
      return {
        values: (v: unknown) => {
          call.values = v;
          return {
            onConflictDoNothing: (c: unknown) => {
              call.conflict = c;
              return {
                returning: () => mockReturning(),
              };
            },
          };
        },
      };
    },
  },
  schema: {
    purchases: { stripeSessionId: 'stripe_session_id', __name: 'purchases' },
    cohortEnrollments: {
      stripeSessionId: 'stripe_session_id',
      __name: 'cohort_enrollments',
    },
  },
}));

const mockSendPurchase = vi.fn();
vi.mock('@/lib/email/purchase-confirmation', () => ({
  sendPurchaseConfirmation: (...args: unknown[]) => mockSendPurchase(...args),
}));

function makeCohortEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_cohort_session_1',
        metadata: {
          kind: 'cohort',
          cohortSlug: 'ai-delivery-2026-q3',
          applicationId: 'app-uuid-1',
          userId: 'user-1',
          ...((overrides.metadata as Record<string, unknown>) ?? {}),
        },
        payment_intent: 'pi_test_cohort_pi_1',
        amount_total: 200000,
        currency: 'usd',
        customer_details: { email: 'applicant@example.com' },
        customer_email: 'applicant@example.com',
        ...overrides,
      },
    },
  };
}

function makeWebhookRequest(body = '{}') {
  return new Request('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body,
    headers: { 'stripe-signature': 'test_sig' },
  });
}

function findCohortInsert() {
  return insertCalls.find(
    (c) =>
      (c.table as { __name?: string } | undefined)?.__name ===
      'cohort_enrollments',
  );
}
function findPurchaseInsert() {
  return insertCalls.find(
    (c) => (c.table as { __name?: string } | undefined)?.__name === 'purchases',
  );
}

describe('POST /api/stripe/webhook — cohort branch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    insertCalls.length = 0;
    mockReturning.mockResolvedValue([]);
  });

  it('webhook_cohort_branch_inserts_enrollment: cohort-kind event → exactly one cohort_enrollments insert', async () => {
    mockConstructEvent.mockReturnValue(makeCohortEvent());
    const { POST } = await import('../route');
    const res = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const cohortInsert = findCohortInsert();
    expect(cohortInsert).toBeTruthy();
    expect(cohortInsert?.values).toMatchObject({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      userId: 'user-1',
      stripeSessionId: 'cs_test_cohort_session_1',
      stripePaymentIntentId: 'pi_test_cohort_pi_1',
      amountCents: 200000,
      currency: 'usd',
    });
    expect(findPurchaseInsert()).toBeFalsy();
  });

  it('webhook_product_kind_falls_through: metadata without kind=cohort → existing product branch runs, no cohort insert', async () => {
    mockConstructEvent.mockReturnValue({
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_product_session_1',
          metadata: { userId: 'user-1', productSlug: 'workflow-templates' },
          payment_intent: 'pi_test_product',
          amount_total: 4900,
          currency: 'usd',
          customer_details: { email: 'buyer@example.com' },
          customer_email: 'buyer@example.com',
        },
      },
    });
    const { POST } = await import('../route');
    const res = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    expect(findCohortInsert()).toBeFalsy();
    expect(findPurchaseInsert()).toBeTruthy();
  });

  it('infra_webhook_runtime_nodejs_unchanged: webhook route still exports runtime=nodejs', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/api/stripe/webhook/route.ts'),
      'utf8',
    );
    expect(src).toMatch(/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/);
  });

  it('perm_webhook_unsigned_rejected: invalid stripe signature → 400, no inserts', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Webhook signature verification failed');
    });
    const { POST } = await import('../route');
    const res = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    expect(findCohortInsert()).toBeFalsy();
    expect(findPurchaseInsert()).toBeFalsy();
  });

  it('contract_webhook_cohort_success_shape: cohort success returns { received: true } status 200', async () => {
    mockConstructEvent.mockReturnValue(makeCohortEvent());
    const { POST } = await import('../route');
    const res = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ received: true });
  });

  it('contract_webhook_cohort_error_shape: missing metadata returns { error: string } status 400', async () => {
    mockConstructEvent.mockReturnValue(
      makeCohortEvent({
        metadata: {
          kind: 'cohort',
          cohortSlug: 'ai-delivery-2026-q3',
          // applicationId + userId missing
        },
      }),
    );
    const { POST } = await import('../route');
    const res = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
    expect(findCohortInsert()).toBeFalsy();
  });

  it('edge_state_webhook_missing_metadata_fields: cohort-kind missing applicationId → 400, no insert', async () => {
    mockConstructEvent.mockReturnValue(
      makeCohortEvent({
        metadata: {
          kind: 'cohort',
          cohortSlug: 'ai-delivery-2026-q3',
          userId: 'user-1',
          // applicationId missing
        },
      }),
    );
    const { POST } = await import('../route');
    const res = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(res.status).toBe(400);
    expect(findCohortInsert()).toBeFalsy();
  });

  it('edge_state_webhook_replay_idempotent: two identical cohort events → both 200, db.insert called twice (DB no-op via onConflictDoNothing)', async () => {
    mockConstructEvent.mockReturnValue(makeCohortEvent());
    const { POST } = await import('../route');
    const r1 = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    const r2 = await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(r1.status).toBe(200);
    expect(r2.status).toBe(200);
    const cohortInserts = insertCalls.filter(
      (c) =>
        (c.table as { __name?: string } | undefined)?.__name ===
        'cohort_enrollments',
    );
    expect(cohortInserts).toHaveLength(2);
    // Both calls include the onConflictDoNothing branch
    expect(cohortInserts[0].conflict).toBeTruthy();
    expect(cohortInserts[1].conflict).toBeTruthy();
  });

  it('data_consistency_webhook_idempotent_unique_session_id: cohort insert uses onConflictDoNothing on stripeSessionId', async () => {
    mockConstructEvent.mockReturnValue(makeCohortEvent());
    const { POST } = await import('../route');
    await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    const cohortInsert = findCohortInsert();
    expect(cohortInsert?.conflict).toBeTruthy();
    // Conflict target points to the stripe_session_id column on cohortEnrollments
    expect(JSON.stringify(cohortInsert?.conflict)).toContain('stripe_session_id');
  });

  it('data_consistency_webhook_cohort_no_purchases_write: cohort-kind event NEVER writes to purchases table', async () => {
    mockConstructEvent.mockReturnValue(makeCohortEvent());
    const { POST } = await import('../route');
    await POST(makeWebhookRequest() as unknown as Parameters<typeof POST>[0]);
    expect(findPurchaseInsert()).toBeFalsy();
  });
});
