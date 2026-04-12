import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));
vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
}));

import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';
import sitemap from '../sitemap';

const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockGetAllCases = vi.mocked(getAllCases);

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

describe('sitemap', () => {
  beforeEach(() => {
    mockGetAllEpisodes.mockReset();
    mockGetAllCases.mockReset();
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE]);
    mockGetAllCases.mockResolvedValue([MOCK_CASE]);
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
    const result = await sitemap();
    expect(result).toHaveLength(4); // static routes only
    const urls = result.map((r) => r.url);
    expect(urls).toContain('https://fabled10x.com/');
    expect(urls).toContain('https://fabled10x.com/episodes');
    expect(urls).toContain('https://fabled10x.com/cases');
    expect(urls).toContain('https://fabled10x.com/about');
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
});
