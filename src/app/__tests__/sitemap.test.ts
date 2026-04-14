import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));
vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
}));
vi.mock('@/lib/build-log/jobs', () => ({
  getAllJobs: vi.fn(),
}));
vi.mock('@/lib/content/products', () => ({
  getAllProducts: vi.fn(),
}));

import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getAllProducts } from '@/lib/content/products';
import sitemap from '../sitemap';

const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockGetAllCases = vi.mocked(getAllCases);
const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetAllProducts = vi.mocked(getAllProducts);

const MOCK_JOB = {
  slug: 'website-foundation',
  title: 'Website Foundation',
  alias: 'wf',
  context: 'ctx',
  features: [],
  phases: [
    { slug: 'phase-1-foundation', filename: 'phase-1-foundation.md', header: {}, body: '' },
    { slug: 'phase-2-content-loader', filename: 'phase-2-content-loader.md', header: {}, body: '' },
  ],
  readmeBody: '# Website Foundation',
};

const MOCK_EPISODE = {
  meta: {
    id: 'ep-001',
    slug: 'ep-slug',
    title: 'Ep',
    series: 'S',
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'x',
    sourceMaterialIds: [],
    lllEntryUrls: [],
    publishedAt: '2026-03-15T00:00:00Z',
  },
  slug: 'ep-slug',
  Component: () => null,
};

const MOCK_EPISODE_NO_DATE = {
  ...MOCK_EPISODE,
  meta: { ...MOCK_EPISODE.meta, publishedAt: undefined },
  slug: 'ep-no-date',
};

const MOCK_CASE = {
  meta: {
    id: 'case-001',
    slug: 'case-slug',
    title: 'Case',
    client: 'Client',
    status: 'active' as const,
    summary: 'x',
    problem: 'x',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: [],
    outcome: 'x',
    relatedEpisodeIds: [],
    lllEntryUrls: [],
    shippedAt: '2026-02-01T00:00:00Z',
  },
  slug: 'case-slug',
  Component: () => null,
};

const MOCK_PRODUCT = {
  meta: {
    id: 'prod-wf',
    slug: 'workflow-templates',
    title: 'Workflow Templates Pro',
    tagline: 'Ship projects faster.',
    summary: 'Templates for delivery.',
    category: 'workflow-templates' as const,
    licenseType: 'single-user' as const,
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
  Component: () => null,
};

const MOCK_PRODUCT_2 = {
  ...MOCK_PRODUCT,
  meta: { ...MOCK_PRODUCT.meta, id: 'prod-dt', slug: 'discovery-toolkit', title: 'Discovery Toolkit', publishedAt: '2026-03-01T00:00:00Z' },
  slug: 'discovery-toolkit',
};

describe('sitemap', () => {
  beforeEach(() => {
    mockGetAllEpisodes.mockReset();
    mockGetAllCases.mockReset();
    mockGetAllJobs.mockReset();
    mockGetAllProducts.mockReset();
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE]);
    mockGetAllCases.mockResolvedValue([MOCK_CASE]);
    mockGetAllJobs.mockResolvedValue([MOCK_JOB] as unknown as Awaited<ReturnType<typeof getAllJobs>>);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT, MOCK_PRODUCT_2] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
  });

  // --- Unit ---

  it('unit_sitemap_includes_static_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/');
    expect(urls).toContain('https://fabled10x.com/episodes');
    expect(urls).toContain('https://fabled10x.com/cases');
    expect(urls).toContain('https://fabled10x.com/about');
  });

  it('unit_sitemap_includes_episodes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/episodes/ep-slug');
  });

  it('unit_sitemap_includes_cases', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/cases/case-slug');
  });

  it('unit_sitemap_lastModified_from_publishedAt', async () => {
    const result = await sitemap();
    const ep = result.find((r) => r.url === 'https://fabled10x.com/episodes/ep-slug');
    expect(ep?.lastModified).toBeInstanceOf(Date);
    expect((ep!.lastModified as Date).toISOString()).toBe('2026-03-15T00:00:00.000Z');
  });

  it('unit_sitemap_all_absolute_urls', async () => {
    const result = await sitemap();
    result.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\/fabled10x\.com\//);
    });
  });

  // --- Infrastructure ---

  it('infra_sitemap_returns_metadataroute_shape', async () => {
    const result = await sitemap();
    expect(Array.isArray(result)).toBe(true);
    result.forEach((entry) => {
      expect(entry).toHaveProperty('url');
      expect(typeof entry.url).toBe('string');
    });
  });

  // --- Edge ---

  it('edge_sitemap_no_episodes_no_cases', async () => {
    mockGetAllEpisodes.mockResolvedValue([]);
    mockGetAllCases.mockResolvedValue([]);
    mockGetAllJobs.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllJobs>>);
    mockGetAllProducts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    const result = await sitemap();
    // 4 pre-existing static routes + 2 build-log static routes + 1 products static route
    expect(result).toHaveLength(7);
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/');
    expect(urls).toContain('https://fabled10x.com/episodes');
    expect(urls).toContain('https://fabled10x.com/cases');
    expect(urls).toContain('https://fabled10x.com/about');
    expect(urls).toContain('https://fabled10x.com/build-log');
    expect(urls).toContain('https://fabled10x.com/build-log/status');
  });

  // --- Phase 3.1: Build-log routes ---

  it('int_sitemap_includes_build_log_index', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/build-log');
  });

  it('int_sitemap_includes_build_log_status', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/build-log/status');
  });

  it('int_sitemap_includes_job_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/build-log/jobs/website-foundation');
  });

  it('int_sitemap_includes_phase_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/build-log/jobs/website-foundation/phase-1-foundation');
    expect(urls).toContain('https://fabled10x.com/build-log/jobs/website-foundation/phase-2-content-loader');
  });

  it('infra_sitemap_no_duplicate_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    const unique = new Set(urls);
    expect(unique.size).toBe(urls.length);
  });

  it('edge_sitemap_empty_jobs', async () => {
    mockGetAllJobs.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllJobs>>);
    mockGetAllProducts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/build-log');
    expect(urls).toContain('https://fabled10x.com/build-log/status');
    expect(urls.filter((u) => u.includes('/build-log/jobs/'))).toEqual([]);
  });

  it('data_sitemap_all_absolute', async () => {
    const result = await sitemap();
    result.forEach((entry) => {
      expect(entry.url).toMatch(/^https:\/\/fabled10x\.com\//);
    });
  });

  it('edge_sitemap_missing_publishedAt', async () => {
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE_NO_DATE]);
    const result = await sitemap();
    const ep = result.find((r) => r.url === 'https://fabled10x.com/episodes/ep-no-date');
    expect(ep).toBeDefined();
    // lastModified should be undefined, NOT Invalid Date or NaN
    if (ep?.lastModified !== undefined) {
      expect(ep.lastModified).toBeInstanceOf(Date);
      expect(Number.isNaN((ep.lastModified as Date).getTime())).toBe(false);
    }
  });

  // --- storefront-auth-4.2: Product URLs ---

  it('unit_sitemap_includes_products_static', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/products');
  });

  it('unit_sitemap_includes_product_urls', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/products/workflow-templates');
    expect(urls).toContain('https://fabled10x.com/products/discovery-toolkit');
  });

  it('unit_sitemap_excludes_gated_routes', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    urls.forEach((url) => {
      expect(url).not.toMatch(/\/products\/account/);
      expect(url).not.toMatch(/\/api\/products\/downloads/);
      expect(url).not.toMatch(/\/login/);
    });
  });

  it('int_sitemap_still_includes_episodes_with_products', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/episodes/ep-slug');
  });

  it('int_sitemap_still_includes_cases_with_products', async () => {
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/cases/case-slug');
  });

  it('edge_sitemap_empty_products', async () => {
    mockGetAllProducts.mockResolvedValue([] as unknown as Awaited<ReturnType<typeof getAllProducts>>);
    const result = await sitemap();
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/products');
    expect(urls.filter((u) => u.includes('/products/'))).toEqual([]);
  });

  it('data_sitemap_product_urls_absolute', async () => {
    const result = await sitemap();
    const productUrls = result.filter((r) => r.url.includes('/products/')).map((r) => r.url);
    expect(productUrls.length).toBeGreaterThan(0);
    productUrls.forEach((url) => {
      expect(url).toMatch(/^https:\/\/fabled10x\.com\//);
    });
  });
});
