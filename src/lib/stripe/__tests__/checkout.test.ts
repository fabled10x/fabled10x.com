import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('../client', () => ({
  stripe: {
    checkout: {
      sessions: {
        create: vi.fn(),
      },
    },
  },
}));

vi.mock('../price-map', () => ({
  resolveStripePriceId: vi.fn(),
}));

// next/navigation redirect throws NEXT_REDIRECT — simulate that
const redirectMock = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => {
    redirectMock(...args);
    throw new Error('NEXT_REDIRECT');
  },
}));

import { createCheckoutSession } from '../checkout';
import { auth } from '@/auth';
import { stripe } from '../client';
import { resolveStripePriceId } from '../price-map';

const mockAuth = vi.mocked(auth);
const mockResolve = vi.mocked(resolveStripePriceId);
const mockCreate = vi.mocked(stripe.checkout.sessions.create);

describe('createCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.AUTH_URL = 'http://localhost:3000';
  });

  // --- Unit ---

  it('unit_checkout_no_session_redirects: redirects to /login when no auth session', async () => {
    mockAuth.mockResolvedValue(null);

    await expect(createCheckoutSession('workflow-templates')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(redirectMock).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Fworkflow-templates',
    );
  });

  it('unit_checkout_creates_stripe_session: calls stripe.checkout.sessions.create with correct params', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      expires: '2026-05-01',
    });
    mockResolve.mockResolvedValue({
      priceId: 'price_abc123',
      amountCents: 4900,
      currency: 'usd',
    });
    mockCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/session/cs_test_123',
      id: 'cs_test_123',
    } as never);

    await expect(createCheckoutSession('workflow-templates')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        line_items: [{ price: 'price_abc123', quantity: 1 }],
        customer_email: 'test@example.com',
        client_reference_id: 'user-1',
        metadata: { userId: 'user-1', productSlug: 'workflow-templates' },
      }),
    );
  });

  it('unit_checkout_redirects_to_stripe_url: redirects to the checkout URL from Stripe', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      expires: '2026-05-01',
    });
    mockResolve.mockResolvedValue({
      priceId: 'price_abc123',
      amountCents: 4900,
      currency: 'usd',
    });
    mockCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/session/cs_test_123',
      id: 'cs_test_123',
    } as never);

    await expect(createCheckoutSession('workflow-templates')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(redirectMock).toHaveBeenCalledWith(
      'https://checkout.stripe.com/session/cs_test_123',
    );
  });

  it('unit_checkout_no_url_throws: throws when Stripe returns session without URL', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      expires: '2026-05-01',
    });
    mockResolve.mockResolvedValue({
      priceId: 'price_abc123',
      amountCents: 4900,
      currency: 'usd',
    });
    mockCreate.mockResolvedValue({
      url: null,
      id: 'cs_test_123',
    } as never);

    await expect(createCheckoutSession('workflow-templates')).rejects.toThrow(
      'Stripe did not return a checkout URL',
    );
  });

  it('unit_checkout_resolver_error_bubbles: bubbles errors from resolveStripePriceId', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      expires: '2026-05-01',
    });
    mockResolve.mockRejectedValue(
      new Error('No product found for slug: bogus'),
    );

    await expect(createCheckoutSession('bogus')).rejects.toThrow(
      'No product found for slug: bogus',
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // --- Security ---

  it('sec_spoofing_checkout_auth_check: redirects to /login for session without user.id', async () => {
    mockAuth.mockResolvedValue({
      user: { id: undefined as unknown as string, email: 'test@example.com', name: 'Test' },
      expires: '2026-05-01',
    });

    await expect(createCheckoutSession('workflow-templates')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(redirectMock).toHaveBeenCalledWith(
      expect.stringContaining('/login'),
    );
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('sec_tampering_checkout_invalid_slug: non-existent slug throws via resolver', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com', name: 'Test' },
      expires: '2026-05-01',
    });
    mockResolve.mockRejectedValue(
      new Error('No product found for slug: ../../etc/passwd'),
    );

    await expect(
      createCheckoutSession('../../etc/passwd'),
    ).rejects.toThrow('No product found');
  });

  // --- Edge Case ---

  it('edge_state_session_missing_email: redirects to /login when session has user.id but no email', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: undefined as unknown as string, name: 'Test' },
      expires: '2026-05-01',
    });

    await expect(createCheckoutSession('workflow-templates')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(redirectMock).toHaveBeenCalledWith(
      expect.stringContaining('/login'),
    );
  });

  // --- Data Integrity ---

  it('data_checkout_metadata_correct: checkout session includes correct metadata and URLs', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-42', email: 'buyer@example.com', name: 'Buyer' },
      expires: '2026-05-01',
    });
    mockResolve.mockResolvedValue({
      priceId: 'price_xyz789',
      amountCents: 2900,
      currency: 'usd',
    });
    mockCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/session/cs_test_456',
      id: 'cs_test_456',
    } as never);

    await expect(createCheckoutSession('discovery-toolkit')).rejects.toThrow(
      'NEXT_REDIRECT',
    );

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: 'user-42',
        customer_email: 'buyer@example.com',
        metadata: {
          userId: 'user-42',
          productSlug: 'discovery-toolkit',
        },
        success_url: expect.stringContaining('/products/account?purchased=discovery-toolkit'),
        cancel_url: expect.stringContaining('/products/discovery-toolkit?canceled=1'),
      }),
    );
  });

  // --- Infrastructure ---

  it('infra_stripe_client_use_server: checkout.ts has "use server" directive', () => {
    const source = readFileSync(
      path.resolve(process.cwd(), 'src/lib/stripe/checkout.ts'),
      'utf-8',
    );
    const firstLine = source
      .split('\n')
      .find((line) => line.trim().length > 0 && !line.trim().startsWith('//'));
    expect(firstLine).toMatch(/^\s*['"]use server['"];?\s*$/);
  });
});
