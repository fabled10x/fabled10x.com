import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/content/products', () => ({
  getProductBySlug: vi.fn(),
}));

import { resolveStripePriceId } from '../price-map';
import { getProductBySlug } from '@/lib/content/products';

const mockGetProductBySlug = vi.mocked(getProductBySlug);

describe('resolveStripePriceId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Unit ---

  it('unit_pricemap_valid_resolve: returns { priceId, amountCents, currency } for a valid product', async () => {
    mockGetProductBySlug.mockResolvedValue({
      meta: {
        id: 'prod-workflow-templates',
        slug: 'workflow-templates',
        title: 'Agent Workflow Templates',
        tagline: 'Templates',
        summary: 'Summary',
        category: 'workflow-templates' as const,
        licenseType: 'single-user' as const,
        priceCents: 4900,
        currency: 'usd',
        stripePriceId: 'price_abc123',
        assetFilename: 'workflow-templates.zip',
        lllEntryUrls: [],
        relatedCaseIds: [],
        publishedAt: '2026-04-12T00:00:00Z',
      },
      slug: 'workflow-templates',
      Component: () => null,
    });

    const result = await resolveStripePriceId('workflow-templates');
    expect(result).toEqual({
      priceId: 'price_abc123',
      amountCents: 4900,
      currency: 'usd',
    });
  });

  it('unit_pricemap_missing_product: throws "No product found" for non-existent slug', async () => {
    mockGetProductBySlug.mockResolvedValue(null);

    await expect(resolveStripePriceId('bogus')).rejects.toThrow(
      'No product found for slug: bogus',
    );
  });

  it('unit_pricemap_placeholder_rejection: throws when stripePriceId contains REPLACE_ME', async () => {
    mockGetProductBySlug.mockResolvedValue({
      meta: {
        id: 'prod-workflow-templates',
        slug: 'workflow-templates',
        title: 'Agent Workflow Templates',
        tagline: 'Templates',
        summary: 'Summary',
        category: 'workflow-templates' as const,
        licenseType: 'single-user' as const,
        priceCents: 4900,
        currency: 'usd',
        stripePriceId: 'price_REPLACEMEBEFORESHIPPING',
        assetFilename: 'workflow-templates.zip',
        lllEntryUrls: [],
        relatedCaseIds: [],
        publishedAt: '2026-04-12T00:00:00Z',
      },
      slug: 'workflow-templates',
      Component: () => null,
    });

    await expect(resolveStripePriceId('workflow-templates')).rejects.toThrow(
      /placeholder Stripe price ID/,
    );
  });

  // --- Edge Case ---

  it('edge_input_empty_slug: throws "No product found" for empty string', async () => {
    mockGetProductBySlug.mockResolvedValue(null);

    await expect(resolveStripePriceId('')).rejects.toThrow(
      'No product found for slug: ',
    );
  });

  // --- Infrastructure ---

  it('infra_stripe_client_singleton: client.ts uses globalThis singleton pattern', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const source = readFileSync(
      resolve(process.cwd(), 'src/lib/stripe/client.ts'),
      'utf-8',
    );
    expect(source).toContain('globalThis');
    expect(source).toContain('STRIPE_SECRET_KEY');
  });
});
