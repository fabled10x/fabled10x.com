import { render, screen } from '@testing-library/react';
import type { Product } from '@/content/schemas';
import { ProductCard } from '../ProductCard';

const BASE_PRODUCT: Product = {
  id: 'prod-wf',
  slug: 'workflow-templates',
  title: 'Workflow Templates Pro',
  tagline: 'Ship projects faster.',
  summary: 'Templates for discovery through delivery.',
  category: 'workflow-templates',
  licenseType: 'single-user',
  priceCents: 4900,
  currency: 'usd',
  stripePriceId: 'price_wf',
  assetFilename: 'workflow-templates.zip',
  lllEntryUrls: [],
  relatedCaseIds: [],
  publishedAt: '2026-04-12T00:00:00Z',
};

describe('ProductCard', () => {
  // --- Unit ---

  it('unit_card_category: renders PRODUCT_CATEGORY_LABELS[category]', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('Workflow Templates')).toBeInTheDocument();
  });

  it('unit_card_title: renders product.title as h2', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading).toHaveTextContent('Workflow Templates Pro');
  });

  it('unit_card_tagline: renders product.tagline', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('Ship projects faster.')).toBeInTheDocument();
  });

  it('unit_card_price_format: renders formatted price (Intl.NumberFormat)', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    // $49 — en-US, USD, 0 fraction digits
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  // --- Data integrity ---

  it('data_price_format_precision: no decimal digits rendered', () => {
    render(<ProductCard product={{ ...BASE_PRODUCT, priceCents: 12900 }} />);
    expect(screen.getByText('$129')).toBeInTheDocument();
    expect(screen.queryByText('$129.00')).not.toBeInTheDocument();
  });

  it('data_price_currency_uppercased: accepts lowercase currency from schema', () => {
    // Intl.NumberFormat requires uppercase currency code — component must
    // .toUpperCase() before passing. Lowercase 'usd' must not throw.
    expect(() =>
      render(<ProductCard product={{ ...BASE_PRODUCT, currency: 'usd' }} />),
    ).not.toThrow();
    expect(screen.getByText('$49')).toBeInTheDocument();
  });
});
