import { vi } from 'vitest';
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

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { getAllProducts } from '@/lib/content/products';
import ProductsPage, { metadata } from '../page';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const PRODUCTS_PAGE_SOURCE = readFileSync(
  join(REPO_ROOT, 'src/app/products/page.tsx'),
  'utf8',
);

const mockGetAllProducts = vi.mocked(getAllProducts);

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

describe('ProductsPage (index)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllProducts.mockResolvedValue(MOCK_PRODUCTS);
  });

  // --- Unit ---

  it('unit_index_heading: renders h1 "Products"', async () => {
    await renderProductsIndex();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Products' }),
    ).toBeInTheDocument();
  });

  it('unit_index_subtitle: renders storefront subtitle prose', async () => {
    await renderProductsIndex();
    // One specific phrase from the subtitle — unique on the page
    const subtitle = screen.getByText(/consultants and agencies/i);
    expect(subtitle).toBeInTheDocument();
  });

  it('unit_index_card_count: renders one ProductCard per product', async () => {
    await renderProductsIndex();
    const cards = screen.getAllByTestId('product-card');
    expect(cards).toHaveLength(MOCK_PRODUCTS.length);
  });

  it('unit_index_card_link: each card has a link to /products/{slug} (so-6.3: link now inside ProductCard, not outer wrapper)', async () => {
    await renderProductsIndex();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/products/alpha-product');
    expect(hrefs).toContain('/products/beta-product');
  });

  // --- Integration ---

  it('integration_card_in_products_grid_one_link_per_card: each <li> contains exactly ONE anchor (no nested anchors after outer Link drop)', async () => {
    const { container } = await renderProductsIndex();
    const items = container.querySelectorAll('li');
    expect(items.length).toBeGreaterThan(0);
    for (const li of Array.from(items)) {
      const anchors = li.querySelectorAll('a');
      expect(anchors.length).toBe(1);
    }
  });

  it('integration_card_in_products_grid_links_to_slug: each grid anchor href is /products/{slug}', async () => {
    const { container } = await renderProductsIndex();
    const items = container.querySelectorAll('li');
    const hrefs = Array.from(items).map(
      (li) => li.querySelector('a')?.getAttribute('href') ?? null,
    );
    expect(hrefs).toContain('/products/alpha-product');
    expect(hrefs).toContain('/products/beta-product');
    expect(hrefs.every((h) => h?.startsWith('/products/'))).toBe(true);
  });

  it('integration_products_page_drops_outer_link: src/app/products/page.tsx no longer wraps ProductCard in an outer <Link href=/products/...>', async () => {
    expect(PRODUCTS_PAGE_SOURCE).not.toMatch(
      /<Link\s+href=\{`\/products\/\$\{[^}]*\.slug\}`\}/,
    );
    expect(PRODUCTS_PAGE_SOURCE).not.toMatch(
      /className="block"[^>]*>\s*<ProductCard/,
    );
  });


  it('int_index_calls_getAllProducts: invokes loader once', async () => {
    await renderProductsIndex();
    expect(mockGetAllProducts).toHaveBeenCalledOnce();
  });

  it('int_index_uses_container: wraps content in Container (max-w-5xl)', async () => {
    const { container } = await renderProductsIndex();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('int_index_grid_layout: renders products in md:grid-cols-2 grid', async () => {
    const { container } = await renderProductsIndex();
    const grid = container.querySelector('.md\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_index_heading_hierarchy: exactly one h1 on the page', async () => {
    await renderProductsIndex();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it('a11y_index_link_text: every link has non-empty accessible name', async () => {
    await renderProductsIndex();
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
    for (const link of links) {
      expect(link.textContent?.trim().length ?? 0).toBeGreaterThan(0);
    }
  });

  // --- Infrastructure ---

  it('infra_index_metadata_export: static metadata with title Products', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Products');
    expect(typeof metadata.description).toBe('string');
  });

  // --- Edge cases ---

  it('edge_index_empty_state_message: renders empty-state message when no products', async () => {
    mockGetAllProducts.mockResolvedValue([]);
    await renderProductsIndex();
    // An empty-state message is visible — any of: "no products", "coming soon", "check back"
    const emptyMsg = screen.queryByText(/no products|coming soon|check back/i);
    expect(emptyMsg).toBeInTheDocument();
    // No empty <ul> of zero children (either no ul, or ul has children when non-empty)
    expect(screen.queryAllByTestId('product-card')).toHaveLength(0);
  });

  it('edge_index_single_product: renders exactly one card when list has one product', async () => {
    mockGetAllProducts.mockResolvedValue([PRODUCT_A]);
    await renderProductsIndex();
    const cards = screen.getAllByTestId('product-card');
    expect(cards).toHaveLength(1);
  });

  // --- Data integrity ---

  it('data_index_card_count: <li> count equals MOCK_PRODUCTS.length', async () => {
    const { container } = await renderProductsIndex();
    const items = container.querySelectorAll('li');
    expect(items.length).toBe(MOCK_PRODUCTS.length);
  });
});
