import { vi, describe, it, expect } from 'vitest';
import type { Product } from '@/content/schemas';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { PurchaseList } from '../PurchaseList';

const MOCK_PRODUCT: Product = {
  id: 'prod-wf',
  slug: 'workflow-templates',
  title: 'Agent Workflow Templates',
  tagline: 'Ship faster.',
  summary: 'Workflow templates for AI agents.',
  category: 'workflow-templates',
  licenseType: 'single-user',
  priceCents: 4900,
  currency: 'usd',
  stripePriceId: 'price_wf',
  assetFilename: 'workflow-templates.zip',
  lllEntryUrls: [],
  relatedCaseIds: [],
  publishedAt: '2026-04-01T00:00:00Z',
};

const MOCK_PURCHASES = [
  {
    id: 'purchase-1',
    userId: 'user-1',
    productSlug: 'workflow-templates',
    stripeSessionId: 'cs_test_1',
    stripePaymentIntentId: 'pi_test_1',
    amountCents: 4900,
    currency: 'usd',
    purchasedAt: new Date('2026-04-10T12:00:00Z'),
  },
  {
    id: 'purchase-2',
    userId: 'user-1',
    productSlug: 'discovery-toolkit',
    stripeSessionId: 'cs_test_2',
    stripePaymentIntentId: 'pi_test_2',
    amountCents: 12900,
    currency: 'usd',
    purchasedAt: new Date('2026-03-15T12:00:00Z'),
  },
];

function makeProductMap(products: Product[] = [MOCK_PRODUCT]): Map<string, Product> {
  return new Map(products.map((p) => [p.slug, p]));
}

describe('PurchaseList', () => {
  // --- Batch 1: Functional (unit) ---

  it('unit_list_empty: empty list renders empty state copy with storefront link', () => {
    render(<PurchaseList purchases={[]} productsBySlug={makeProductMap()} />);
    expect(screen.getByText(/don.t have any purchases/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /storefront/i })).toHaveAttribute(
      'href',
      '/products',
    );
  });

  it('unit_list_items: non-empty list renders one <li> per purchase', () => {
    render(
      <PurchaseList
        purchases={MOCK_PURCHASES}
        productsBySlug={makeProductMap()}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
  });

  it('unit_list_download_link: download link points at /api/products/downloads/{id}', () => {
    render(
      <PurchaseList
        purchases={[MOCK_PURCHASES[0]]}
        productsBySlug={makeProductMap()}
      />,
    );
    expect(screen.getByRole('link', { name: /download/i })).toHaveAttribute(
      'href',
      '/api/products/downloads/purchase-1',
    );
  });

  it('unit_list_details_link: details link points at /products/account/purchases/{id}', () => {
    render(
      <PurchaseList
        purchases={[MOCK_PURCHASES[0]]}
        productsBySlug={makeProductMap()}
      />,
    );
    expect(screen.getByRole('link', { name: /details/i })).toHaveAttribute(
      'href',
      '/products/account/purchases/purchase-1',
    );
  });

  it('unit_list_price_format: price formatted in stored currency', () => {
    render(
      <PurchaseList
        purchases={[MOCK_PURCHASES[0]]}
        productsBySlug={makeProductMap()}
      />,
    );
    expect(screen.getByText(/\$49\.00/)).toBeInTheDocument();
  });

  it('unit_list_date_format: date formatted as Month Day, Year', () => {
    render(
      <PurchaseList
        purchases={[MOCK_PURCHASES[0]]}
        productsBySlug={makeProductMap()}
      />,
    );
    expect(screen.getByText(/April 10, 2026/)).toBeInTheDocument();
  });

  // --- Batch 5: Edge case ---

  it('edge_state_unknown_slug: unknown product slug renders raw slug as title', () => {
    render(
      <PurchaseList
        purchases={[MOCK_PURCHASES[1]]}
        productsBySlug={makeProductMap()}
      />,
    );
    // discovery-toolkit is not in the product map — should fall back to raw slug
    expect(screen.getByText('discovery-toolkit')).toBeInTheDocument();
  });

  it('edge_state_empty_purchases: zero purchases shows empty state with link to storefront', () => {
    render(<PurchaseList purchases={[]} productsBySlug={new Map()} />);
    expect(screen.getByText(/don.t have any purchases/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /storefront/i });
    expect(link).toHaveAttribute('href', '/products');
  });

  // --- Batch 5: Data integrity ---

  it('data_price_format: formatPrice handles various currencies correctly', () => {
    const eurPurchase = {
      ...MOCK_PURCHASES[0],
      amountCents: 3999,
      currency: 'eur',
    };
    render(
      <PurchaseList
        purchases={[eurPurchase]}
        productsBySlug={makeProductMap()}
      />,
    );
    // €39.99 in en-US locale
    expect(screen.getByText(/€39\.99/)).toBeInTheDocument();
  });

  it('data_date_format: formatDate outputs correct Month Day, Year format', () => {
    const janPurchase = {
      ...MOCK_PURCHASES[0],
      purchasedAt: new Date('2026-01-01T00:00:00Z'),
    };
    render(
      <PurchaseList
        purchases={[janPurchase]}
        productsBySlug={makeProductMap()}
      />,
    );
    // Exact format depends on timezone — check for January and 2026
    expect(screen.getByText(/January.*2026|December.*2025/)).toBeInTheDocument();
  });
});
