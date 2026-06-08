// PurchaseList (styling-overhaul-7.5) — Storefront reskin hybrid red.
//
// Preserves behavior pins: empty state with /products link, one <li> per
// purchase, productSlug fallback when productsBySlug map has no entry,
// per-row Details + Download links. Adds brand-aware assertions per
// phase-7-pages.md Feature 7.5:
//   - Empty state wrapped in brand surface chrome (no rounded-md
//     border-mist placeholder utilities)
//   - Row separators use border-t border-(--edge-color), NOT
//     divide-y divide-mist
//   - Source-grep sentinel: no divide-mist / text-link / bg-accent /
//     border-mist / text-muted / font-semibold / text-parchment placeholders

import { vi, describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
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

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const SOURCE_PATH = join(__dirname_compat, '..', 'PurchaseList.tsx');
const SOURCE = readFileSync(SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'divide-y',
  'divide-mist',
  'border-mist',
  'text-link',
  'text-muted',
  'font-semibold',
  'text-parchment',
];

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
  {
    id: 'purchase-3',
    userId: 'user-1',
    productSlug: 'workflow-templates',
    stripeSessionId: 'cs_test_3',
    stripePaymentIntentId: 'pi_test_3',
    amountCents: 4900,
    currency: 'usd',
    purchasedAt: new Date('2026-02-01T12:00:00Z'),
  },
];

function makeProductMap(products: Product[] = [MOCK_PRODUCT]): Map<string, Product> {
  return new Map(products.map((p) => [p.slug, p]));
}

describe('PurchaseList (styling-overhaul-7.5) — brand reskin', () => {
  // ─────────────────────────────────────────────────────────────
  // Unit — brand chrome
  // ─────────────────────────────────────────────────────────────

  it('unit_purchase_list_empty_state_brand_surface: empty state does NOT use placeholder rounded-md/border-mist utilities', () => {
    const { container } = render(
      <PurchaseList purchases={[]} productsBySlug={makeProductMap()} />,
    );
    // The empty-state container should not carry placeholder utility classes.
    const elementsWithClass = Array.from(
      container.querySelectorAll<HTMLElement>('[class]'),
    );
    for (const el of elementsWithClass) {
      expect(el.className).not.toMatch(/\brounded-md\b/);
      expect(el.className).not.toMatch(/\bborder-mist\b/);
    }
  });

  it('unit_purchase_list_empty_state_storefront_link_preserved: empty state contains link href="/products"', () => {
    render(<PurchaseList purchases={[]} productsBySlug={makeProductMap()} />);
    const link = screen.getByRole('link', { name: /storefront/i });
    expect(link).toHaveAttribute('href', '/products');
  });

  it('unit_purchase_list_renders_each_purchase: 3 purchases → 3 <li> rendered', () => {
    render(
      <PurchaseList
        purchases={MOCK_PURCHASES}
        productsBySlug={makeProductMap()}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
  });

  it('unit_purchase_list_product_title_fallback_slug: missing productsBySlug entry → renders purchase.productSlug as title', () => {
    render(
      <PurchaseList
        purchases={[MOCK_PURCHASES[1]]}
        productsBySlug={makeProductMap()}
      />,
    );
    expect(screen.getByText('discovery-toolkit')).toBeInTheDocument();
  });

  it('unit_purchase_list_details_link_per_row: each row links to /products/account/purchases/{id}', () => {
    render(
      <PurchaseList
        purchases={MOCK_PURCHASES}
        productsBySlug={makeProductMap()}
      />,
    );
    const detailsLinks = screen.getAllByRole('link', { name: /details/i });
    expect(detailsLinks).toHaveLength(3);
    expect(detailsLinks[0]).toHaveAttribute(
      'href',
      '/products/account/purchases/purchase-1',
    );
    expect(detailsLinks[1]).toHaveAttribute(
      'href',
      '/products/account/purchases/purchase-2',
    );
    expect(detailsLinks[2]).toHaveAttribute(
      'href',
      '/products/account/purchases/purchase-3',
    );
  });

  it('unit_purchase_list_download_link_per_row: each row anchors to /api/products/downloads/{id}', () => {
    render(
      <PurchaseList
        purchases={MOCK_PURCHASES}
        productsBySlug={makeProductMap()}
      />,
    );
    const downloadLinks = screen.getAllByRole('link', { name: /download/i });
    expect(downloadLinks).toHaveLength(3);
    expect(downloadLinks[0]).toHaveAttribute(
      'href',
      '/api/products/downloads/purchase-1',
    );
    expect(downloadLinks[1]).toHaveAttribute(
      'href',
      '/api/products/downloads/purchase-2',
    );
    expect(downloadLinks[2]).toHaveAttribute(
      'href',
      '/api/products/downloads/purchase-3',
    );
  });

  it('unit_purchase_list_row_separator_edge_color: list rows use border-t border-(--edge-color), NOT divide-y divide-mist', () => {
    const { container } = render(
      <PurchaseList
        purchases={MOCK_PURCHASES}
        productsBySlug={makeProductMap()}
      />,
    );
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    // The <ul> must not carry divide-y or divide-mist placeholder utilities
    expect(ul!.className).not.toMatch(/\bdivide-y\b/);
    expect(ul!.className).not.toMatch(/\bdivide-mist\b/);
    // At least one row must use border-t border-(--edge-color) — the brand separator
    const items = Array.from(container.querySelectorAll('li'));
    const usesBrandSeparator = items.some((li) =>
      /\bborder-t\b/.test(li.className) &&
      /border-\(--edge-color\)/.test(li.className),
    );
    expect(usesBrandSeparator).toBe(true);
  });

  // ─────────────────────────────────────────────────────────────
  // Accessibility
  // ─────────────────────────────────────────────────────────────

  it('a11y_purchase_list_lists_semantic: <ul> with <li> children preserved', () => {
    const { container } = render(
      <PurchaseList
        purchases={MOCK_PURCHASES}
        productsBySlug={makeProductMap()}
      />,
    );
    const ul = container.querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul!.querySelectorAll('li').length).toBe(3);
  });

  // ─────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinel
  // ─────────────────────────────────────────────────────────────

  it('infra_purchase_list_no_placeholder_tokens: source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_purchase_list_brand_imports: source imports from @/components/brand', () => {
    expect(SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
  });

  // ─────────────────────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────────────────────

  it('edge_purchase_list_long_product_title: 200-char title renders without throwing', () => {
    const longTitle = 'a'.repeat(200);
    const longProduct: Product = { ...MOCK_PRODUCT, title: longTitle };
    expect(() =>
      render(
        <PurchaseList
          purchases={[MOCK_PURCHASES[0]]}
          productsBySlug={makeProductMap([longProduct])}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText(longTitle)).toBeInTheDocument();
  });
});
