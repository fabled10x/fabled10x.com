// Products index (styling-overhaul-7.5) — brand-aware assertions.
//
// Replaces the placeholder-pattern tests with assertions that pin the
// editorial reskin per phase-7-pages.md Feature 7.5:
//   - <Marble> surface wraps the page
//   - <Section rhythm="md"> (py-(--section-y-md))
//   - <Container> (default width=layout)
//   - .label / .display-1 / .body-1 brand utilities
//   - Storefront kicker + Products h1 + muted subtitle
//   - Grid of ProductCard preserved (one <li> per product)
//   - PRESERVED: metadata.title='Products', empty-state copy, getAllProducts
//
// Source-level sentinels (infra_*) read src/app/products/page.tsx via
// readFileSync to assert no banned placeholder utility names remain.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '@/lib/content/loader';
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

vi.mock('@/lib/content/products', () => ({
  getAllProducts: vi.fn(),
}));

// Mock ProductCard as an anchor (so-6.3): post-refactor ProductCard owns its
// own link via EditorialCard's href prop. Page tests assert the link lives
// inside the card, not as an outer wrapper.
vi.mock('@/components/products/ProductCard', () => ({
  ProductCard: ({ product }: { product: Product }) => (
    <a
      href={`/products/${product.slug}`}
      data-testid="product-card"
      data-product-id={product.id}
      data-product-title={product.title}
    >
      {product.title}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { getAllProducts } from '@/lib/content/products';
import ProductsPage, { metadata } from '../page';

const mockGetAllProducts = vi.mocked(getAllProducts);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-muted',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'text-base',
  'bg-marble-texture',
  'border-mist',
  'rounded-md',
  'rounded-lg',
  'text-link',
  'text-accent',
  'bg-accent',
  'divide-mist',
  'prose-style',
];

const mockComponent: ComponentType = () => null;

const PRODUCT_A: LoadedEntry<Product> = {
  meta: {
    id: 'prod-alpha',
    slug: 'alpha-product',
    title: 'Alpha Product',
    tagline: 'Alpha tagline.',
    summary: 'Alpha summary.',
    category: 'workflow-templates',
    licenseType: 'single-user',
    priceCents: 4900,
    currency: 'usd',
    stripePriceId: 'price_alpha',
    assetFilename: 'alpha.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-12T00:00:00Z',
  },
  slug: 'alpha-product',
  Component: mockComponent,
};

const PRODUCT_B: LoadedEntry<Product> = {
  meta: {
    id: 'prod-beta',
    slug: 'beta-product',
    title: 'Beta Product',
    tagline: 'Beta tagline.',
    summary: 'Beta summary.',
    category: 'discovery-toolkit',
    licenseType: 'team',
    priceCents: 12900,
    currency: 'usd',
    stripePriceId: 'price_beta',
    assetFilename: 'beta.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-03-01T00:00:00Z',
  },
  slug: 'beta-product',
  Component: mockComponent,
};

const MOCK_PRODUCTS: ReadonlyArray<LoadedEntry<Product>> = [PRODUCT_A, PRODUCT_B];

async function renderProductsIndex() {
  const jsx = await ProductsPage();
  return render(jsx);
}

describe('ProductsPage (styling-overhaul-7.5) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllProducts.mockResolvedValue(MOCK_PRODUCTS);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — brand chrome
  // ────────────────────────────────────────────────────────────────

  it('unit_products_index_marble_mount: page renders inside a <Marble> surface (bg-(--color-marble))', async () => {
    const { container } = await renderProductsIndex();
    const marble = container.querySelector('.bg-\\(--color-marble\\)');
    expect(marble).toBeInTheDocument();
  });

  it('unit_products_index_section_rhythm_md: <Section rhythm="md"> wraps content — py-(--section-y-md) present', async () => {
    const { container } = await renderProductsIndex();
    const section = container.querySelector('.py-\\(--section-y-md\\)');
    expect(section).toBeInTheDocument();
  });

  it("unit_products_index_label_kicker_storefront: .label kicker reads 'Storefront' above the h1", async () => {
    await renderProductsIndex();
    const kicker = screen.getByText('Storefront');
    expect(kicker).toBeInTheDocument();
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  it("unit_products_index_display_1_title: h1 uses .display-1 brand utility and reads 'Products'", async () => {
    await renderProductsIndex();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Products' });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
  });

  it('unit_products_index_body_1_subtitle_muted: subtitle uses .body-1 + text-(--color-muted)', async () => {
    const { container } = await renderProductsIndex();
    const bodyParas = container.querySelectorAll('p.body-1');
    expect(bodyParas.length).toBeGreaterThanOrEqual(1);
    const mutedBody = Array.from(bodyParas).find((p) =>
      /text-\(--color-muted\)/.test(p.className),
    );
    expect(mutedBody).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — preserved data behavior
  // ────────────────────────────────────────────────────────────────

  it('unit_products_index_grid_preserved: renders one <li> per product (preserved grid)', async () => {
    const { container } = await renderProductsIndex();
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(MOCK_PRODUCTS.length);
  });

  it('unit_products_index_empty_state_preserved: empty list renders friendly empty state', async () => {
    mockGetAllProducts.mockResolvedValue([]);
    await renderProductsIndex();
    const emptyMsg = screen.queryByText(/no products|coming soon|check back/i);
    expect(emptyMsg).toBeInTheDocument();
    expect(screen.queryAllByTestId('product-card')).toHaveLength(0);
  });

  it("unit_products_index_metadata_preserved: metadata.title='Products' + non-empty description", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Products');
    expect(typeof metadata.description).toBe('string');
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it("a11y_products_index_heading_landmark: h1 visible with name 'Products'", async () => {
    await renderProductsIndex();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Products' });
    expect(h1).toBeVisible();
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels
  // ────────────────────────────────────────────────────────────────

  it('infra_products_index_no_placeholder_tokens: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const escaped = token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&');
      const re = new RegExp(`(?:^|[\\s"'\`])${escaped}(?:[\\s"'\`]|$)`);
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
    // Positive assertions: brand utilities adopted
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
  });

  it('infra_products_index_brand_imports: page imports Marble + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge case
  // ────────────────────────────────────────────────────────────────

  it('edge_products_index_empty_products_array: empty products array renders empty-state copy without crashing', async () => {
    mockGetAllProducts.mockResolvedValue([]);
    const { container } = await renderProductsIndex();
    const emptyMsg = screen.queryByText(/no products|coming soon|check back/i);
    expect(emptyMsg).toBeInTheDocument();
    // No product cards rendered
    expect(container.querySelectorAll('[data-testid="product-card"]').length).toBe(0);
  });
});
