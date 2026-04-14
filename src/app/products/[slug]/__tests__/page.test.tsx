import { vi } from 'vitest';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Product } from '@/content/schemas';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/products', () => ({
  getAllProducts: vi.fn(),
  getProductBySlug: vi.fn(),
}));

vi.mock('@/components/products/BuyButton', () => ({
  BuyButton: ({ productSlug }: { productSlug: string }) => (
    <div data-testid="buy-button" data-product-slug={productSlug} />
  ),
}));

import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { getAllProducts, getProductBySlug } from '@/lib/content/products';
import ProductDetailPage, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetProductBySlug = vi.mocked(getProductBySlug);
const mockGetAllProducts = vi.mocked(getAllProducts);
const mockNotFound = vi.mocked(notFound);

const MOCK_MDX: ComponentType = () => (
  <div data-testid="mdx-body">Product MDX body</div>
);

const MOCK_PRODUCT_FULL: LoadedEntry<Product> = {
  meta: {
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
    heroImageUrl: 'https://example.com/hero.jpg',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-12T00:00:00Z',
  },
  slug: 'workflow-templates',
  Component: MOCK_MDX,
};

const MOCK_PRODUCT_NO_HERO: LoadedEntry<Product> = {
  meta: {
    id: 'prod-dt',
    slug: 'discovery-toolkit',
    title: 'Discovery Toolkit Pro',
    tagline: 'Ask the right questions.',
    summary: 'Templates + scripts for discovery calls.',
    category: 'discovery-toolkit',
    licenseType: 'team',
    priceCents: 12900,
    currency: 'usd',
    stripePriceId: 'price_dt',
    assetFilename: 'discovery-toolkit.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-03-01T00:00:00Z',
  },
  slug: 'discovery-toolkit',
  Component: () => <div data-testid="mdx-body">Toolkit body</div>,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'workflow-templates') {
  const jsx = await ProductDetailPage(makeParams(slug));
  return render(jsx);
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_FULL);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT_FULL, MOCK_PRODUCT_NO_HERO]);
  });

  // --- Unit ---

  it('unit_detail_title: renders product.title as h1', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Workflow Templates Pro' }),
    ).toBeInTheDocument();
  });

  it('unit_detail_tagline: renders product.tagline', async () => {
    await renderDetail();
    expect(screen.getByText('Ship projects faster.')).toBeInTheDocument();
  });

  it('unit_detail_price: renders formatted priceCents as currency', async () => {
    await renderDetail();
    // $49 — Intl.NumberFormat en-US, USD, 0 fraction digits
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  it('unit_detail_category_label: renders PRODUCT_CATEGORY_LABELS[category]', async () => {
    await renderDetail();
    expect(screen.getByText('Workflow Templates')).toBeInTheDocument();
  });

  it('unit_detail_license_label: renders PRODUCT_LICENSE_LABELS[licenseType]', async () => {
    await renderDetail();
    expect(screen.getByText('Single user')).toBeInTheDocument();
  });

  it('unit_detail_mdx_body: renders MDX <Component />', async () => {
    await renderDetail();
    expect(screen.getByTestId('mdx-body')).toBeInTheDocument();
    expect(screen.getByText('Product MDX body')).toBeInTheDocument();
  });

  it('unit_detail_buy_button_slug_prop: renders BuyButton with product slug', async () => {
    await renderDetail();
    const buy = screen.getByTestId('buy-button');
    expect(buy).toHaveAttribute('data-product-slug', 'workflow-templates');
  });

  // --- Integration ---

  it('int_detail_calls_getProductBySlug: invoked with awaited slug', async () => {
    await renderDetail('workflow-templates');
    expect(mockGetProductBySlug).toHaveBeenCalledWith('workflow-templates');
  });

  it('int_detail_uses_container: wraps content in Container (max-w-5xl)', async () => {
    const { container } = await renderDetail();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_detail_article_wrapper: content wrapped in <article>', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('a11y_detail_heading_hierarchy: exactly one h1 (the title)', async () => {
    await renderDetail();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  // --- Infrastructure ---

  it('infra_detail_dynamic_params: dynamicParams export is false', () => {
    expect(dynamicParams).toBe(false);
  });

  it('infra_detail_generate_static_params: returns entries for all seed products', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'workflow-templates' },
      { slug: 'discovery-toolkit' },
    ]);
  });

  it('infra_detail_generate_metadata: returns title + description from product meta', async () => {
    const meta = await generateMetadata(makeParams('workflow-templates'));
    expect(meta.title).toBe('Workflow Templates Pro');
    expect(meta.description).toBe('Templates for discovery through delivery.');
  });

  it('infra_detail_generate_metadata_og: openGraph populated with title + description + type=website', async () => {
    const meta = await generateMetadata(makeParams('workflow-templates'));
    const og = meta.openGraph as {
      title?: string;
      description?: string;
      type?: string;
      images?: unknown;
    } | undefined;
    expect(og).toBeDefined();
    expect(og?.title).toBe('Workflow Templates Pro');
    expect(og?.description).toBe('Templates for discovery through delivery.');
    expect(og?.type).toBe('website');
  });

  // --- Edge cases ---

  it('edge_detail_hero_image_absent: openGraph.images undefined when heroImageUrl missing', async () => {
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_NO_HERO);
    const meta = await generateMetadata(makeParams('discovery-toolkit'));
    const og = meta.openGraph as { images?: unknown } | undefined;
    expect(og?.images).toBeUndefined();
  });

  it('edge_detail_hero_image_present: openGraph.images contains hero URL when set', async () => {
    const meta = await generateMetadata(makeParams('workflow-templates'));
    const og = meta.openGraph as { images?: unknown } | undefined;
    expect(og?.images).toBeDefined();
    const images = og?.images as readonly string[] | string[] | undefined;
    expect(images).toEqual(expect.arrayContaining(['https://example.com/hero.jpg']));
  });

  // --- Error recovery ---

  it('err_detail_not_found: unknown slug calls notFound and returns', async () => {
    mockGetProductBySlug.mockResolvedValue(null);
    const jsx = await ProductDetailPage(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  it('err_metadata_missing_slug: unknown slug returns empty metadata object, no throw', async () => {
    mockGetProductBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    expect(meta).toEqual({});
  });

  // --- storefront-auth-4.2: JSON-LD ---

  it('unit_jsonld_renders_script: renders application/ld+json script tag', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('unit_jsonld_valid_product_schema: JSON-LD has correct Product + Offer structure', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const jsonLd = JSON.parse(script!.textContent!);
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd.name).toBe('Workflow Templates Pro');
    expect(jsonLd.offers).toBeDefined();
    expect(jsonLd.offers['@type']).toBe('Offer');
    expect(jsonLd.offers.priceCurrency).toBe('USD');
    expect(jsonLd.offers.url).toBe('https://fabled10x.com/products/workflow-templates');
  });

  it('data_jsonld_price_decimal_string: offers.price is decimal string not integer', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.textContent!);
    expect(jsonLd.offers.price).toBe('49.00');
    expect(typeof jsonLd.offers.price).toBe('string');
  });

  it('edge_jsonld_no_hero_image: JSON-LD omits image when heroImageUrl absent', async () => {
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_NO_HERO);
    const { container } = await renderDetail('discovery-toolkit');
    const script = container.querySelector('script[type="application/ld+json"]');
    const jsonLd = JSON.parse(script!.textContent!);
    expect(jsonLd.image).toBeUndefined();
  });
});
