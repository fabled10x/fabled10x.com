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
    process.env.RESEND_API_KEY = 're_test_stub_api_key';
  }
  return {};
});

const mockConstructEvent = vi.fn();
vi.mock('@/lib/stripe/client', () => ({
  stripe: {
    webhooks: {
      constructEvent: (...args: unknown[]) => mockConstructEvent(...args),
    },
  },
}));

const mockInsert = vi.fn();
const mockValues = vi.fn();
const mockOnConflict = vi.fn();
const mockReturning = vi.fn();

vi.mock('@/db/client', () => ({
  db: {
    insert: (...args: unknown[]) => {
      mockInsert(...args);
      return {
        values: (...vArgs: unknown[]) => {
          mockValues(...vArgs);
          return {
            onConflictDoNothing: (...cArgs: unknown[]) => {
              mockOnConflict(...cArgs);
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
    purchases: { stripeSessionId: 'stripe_session_id' },
  },
}));

const mockSendEmail = vi.fn();
vi.mock('@/lib/email/purchase-confirmation', () => ({
  sendPurchaseConfirmation: (...args: unknown[]) => mockSendEmail(...args),
}));

function createMockEvent(overrides: Record<string, unknown> = {}) {
  return {
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_test_session_123',
        metadata: {
          userId: 'user-1',
          productSlug: 'workflow-templates',
        },
        payment_intent: 'pi_test_intent_123',
        amount_total: 4900,
        currency: 'usd',
        customer_details: { email: 'buyer@example.com' },
        customer_email: 'buyer@example.com',
        ...overrides,
      },
    },
    ...('type' in overrides ? { type: overrides.type } : {}),
  };
}

function createWebhookRequest(
  body: string = '{}',
  headers: Record<string, string> = { 'stripe-signature': 'test_sig_xxx' },
) {
  return new Request('http://localhost:3000/api/stripe/webhook', {
    method: 'POST',
    body,
    headers,
  });
}

describe('POST /api/stripe/webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReturning.mockResolvedValue([]);
    mockSendEmail.mockResolvedValue(undefined);
  });

  // --- Batch 1: Functional ---

  it('unit_webhook_valid_event_inserts_row: valid checkout.session.completed inserts purchases row with correct fields', async () => {
    const event = createMockEvent();
    mockConstructEvent.mockReturnValue(event);
    mockReturning.mockResolvedValue([{ id: 'purchase-1' }]);

    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest() as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        productSlug: 'workflow-templates',
        stripeSessionId: 'cs_test_session_123',
        stripePaymentIntentId: 'pi_test_intent_123',
        amountCents: 4900,
        currency: 'usd',
      }),
    );
  });

  it('unit_webhook_replay_no_duplicate: replayed event returns 200, onConflictDoNothing returns empty', async () => {
    const event = createMockEvent();
    mockConstructEvent.mockReturnValue(event);
    mockReturning.mockResolvedValue([]);

    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest() as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('unit_webhook_insert_triggers_email: first insert triggers sendPurchaseConfirmation once, replay does not', async () => {
    const event = createMockEvent();
    mockConstructEvent.mockReturnValue(event);
    mockReturning.mockResolvedValue([{ id: 'purchase-1' }]);

    const { POST } = await import('../route');
    await POST(createWebhookRequest() as never);

    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@example.com',
        productSlug: 'workflow-templates',
        purchaseId: 'purchase-1',
      }),
    );

    // Replay: returning() returns empty
    vi.clearAllMocks();
    mockConstructEvent.mockReturnValue(event);
    mockReturning.mockResolvedValue([]);

    await POST(createWebhookRequest() as never);
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('unit_webhook_unrelated_event_ack: unrelated event type returns 200 { received: true }, no DB call', async () => {
    const event = {
      type: 'payment_intent.succeeded',
      data: { object: {} },
    };
    mockConstructEvent.mockReturnValue(event);

    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest() as never);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ received: true });
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // --- Batch 2: Security ---

  it('sec_spoofing_webhook_missing_signature: missing stripe-signature header returns 400', async () => {
    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest('{}', {}) as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toHaveProperty('error');
    expect(json.error).toMatch(/missing signature/i);
  });

  it('sec_spoofing_webhook_invalid_signature: invalid signature returns 400', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest() as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toHaveProperty('error');
    expect(json.error).toMatch(/invalid signature/i);
  });

  // --- Batch 5: Edge/Error/Data ---

  it('edge_input_webhook_missing_userId: missing metadata.userId returns 400', async () => {
    const event = createMockEvent({
      metadata: { productSlug: 'workflow-templates' },
    });
    mockConstructEvent.mockReturnValue(event);

    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest() as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/missing required metadata/i);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('edge_input_webhook_missing_productSlug: missing metadata.productSlug returns 400', async () => {
    const event = createMockEvent({
      metadata: { userId: 'user-1' },
    });
    mockConstructEvent.mockReturnValue(event);

    const { POST } = await import('../route');
    const response = await POST(createWebhookRequest() as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toMatch(/missing required metadata/i);
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // --- Batch 6: Infrastructure ---

  it('infra_webhook_exports_POST: webhook route module exports POST function', async () => {
    const mod = await import('../route');
    expect(mod).toHaveProperty('POST');
    expect(typeof mod.POST).toBe('function');
  });
});
