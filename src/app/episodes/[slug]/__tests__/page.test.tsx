import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
  getEpisodeBySlug: vi.fn(),
}));

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

vi.mock('@/components/crosslinks/LllCrosslinks', () => ({
  LllCrosslinks: ({ urls, className }: { urls: string[]; className?: string }) => (
    <div data-testid="lll-crosslinks" data-urls={JSON.stringify(urls)} className={className} />
  ),
}));

import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { getAllEpisodes, getEpisodeBySlug } from '@/lib/content/episodes';
import EpisodeDetail, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetEpisodeBySlug = vi.mocked(getEpisodeBySlug);
const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockNotFound = vi.mocked(notFound);

const MOCK_COMPONENT = () => <div data-testid="mdx-body">Episode MDX content</div>;

const MOCK_EPISODE_FULL = {
  meta: {
    id: 'ep-001',
    slug: 'test-episode',
    title: 'Test Episode Title',
    series: 'Discovery Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'A test episode summary for testing.',
    sourceMaterialIds: ['sm-001', 'sm-002'],
    lllEntryUrls: [
      'https://largelanguagelibrary.ai/entries/discovery-process',
      'https://largelanguagelibrary.ai/entries/agent-workflow',
    ],
    youtubeUrl: 'https://youtube.com/watch?v=test123',
    durationMinutes: 45,
    publishedAt: '2026-04-15T12:00:00Z',
  },
  slug: 'test-episode',
  Component: MOCK_COMPONENT,
};

const MOCK_EPISODE_MINIMAL = {
  meta: {
    id: 'ep-002',
    slug: 'minimal-episode',
    title: 'Minimal Episode',
    series: 'Short Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'shorts' as const,
    pillar: 'workflow' as const,
    summary: 'Minimal episode summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'minimal-episode',
  Component: () => <div data-testid="mdx-body">Minimal content</div>,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'test-episode') {
  const jsx = await EpisodeDetail(makeParams(slug));
  return render(jsx);
}

describe('EpisodeDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_FULL);
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE_FULL, MOCK_EPISODE_MINIMAL]);
  });

  // --- Unit ---

  it('unit_title', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Test Episode Title' }),
    ).toBeInTheDocument();
  });

  it('unit_tier_label', async () => {
    await renderDetail();
    expect(screen.getByText(/Flagship/)).toBeInTheDocument();
  });

  it('unit_series', async () => {
    await renderDetail();
    expect(screen.getByText(/Discovery Series/)).toBeInTheDocument();
  });

  it('unit_summary', async () => {
    await renderDetail();
    expect(screen.getByText('A test episode summary for testing.')).toBeInTheDocument();
  });

  it('unit_pillar_question', async () => {
    await renderDetail();
    expect(screen.getByText(/What can an AI agent team actually deliver/i)).toBeInTheDocument();
  });

  it('unit_youtube_button', async () => {
    await renderDetail();
    const link = screen.getByRole('link', { name: /Watch on YouTube/i });
    expect(link).toHaveAttribute('href', 'https://youtube.com/watch?v=test123');
  });

  it('unit_mdx_body', async () => {
    await renderDetail();
    expect(screen.getByTestId('mdx-body')).toBeInTheDocument();
    expect(screen.getByText('Episode MDX content')).toBeInTheDocument();
  });

  it('unit_source_materials', async () => {
    await renderDetail();
    expect(screen.getByText('Source materials')).toBeInTheDocument();
    expect(screen.getByText('sm-001')).toBeInTheDocument();
    expect(screen.getByText('sm-002')).toBeInTheDocument();
  });

  it('unit_email_capture', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    expect(capture).toHaveAttribute('data-source', 'episode-test-episode');
  });

  it('unit_lll_crosslinks', async () => {
    await renderDetail();
    const crosslinks = screen.getByTestId('lll-crosslinks');
    expect(crosslinks).toBeInTheDocument();
    const urls = JSON.parse(crosslinks.getAttribute('data-urls')!);
    expect(urls).toHaveLength(2);
  });

  // --- Integration ---

  it('int_calls_getEpisodeBySlug', async () => {
    await renderDetail();
    expect(mockGetEpisodeBySlug).toHaveBeenCalledWith('test-episode');
  });

  it('int_uses_container', async () => {
    const { container } = await renderDetail();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  // --- Edge ---

  it('edge_no_youtube_url', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_MINIMAL);
    await renderDetail('minimal-episode');
    expect(screen.queryByText(/Watch on YouTube/i)).not.toBeInTheDocument();
  });

  it('edge_empty_source_materials', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_MINIMAL);
    await renderDetail('minimal-episode');
    expect(screen.queryByText('Source materials')).not.toBeInTheDocument();
  });

  it('edge_empty_lll_urls', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_MINIMAL);
    await renderDetail('minimal-episode');
    expect(screen.queryByTestId('lll-crosslinks')).not.toBeInTheDocument();
  });

  // --- Error ---

  it('err_not_found', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(null);
    const jsx = await EpisodeDetail(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  // --- Infrastructure ---

  it('infra_dynamic_params', () => {
    expect(dynamicParams).toBe(false);
  });

  it('infra_generate_static_params', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'test-episode' },
      { slug: 'minimal-episode' },
    ]);
  });

  it('infra_generate_metadata', async () => {
    const meta = await generateMetadata(makeParams('test-episode'));
    expect(meta.title).toBe('Test Episode Title');
    expect(meta.description).toBe('A test episode summary for testing.');
  });

  // --- Phase 4.1 additions: expanded metadata + JSON-LD ---

  it('unit_episode_generate_metadata_og', async () => {
    const meta = await generateMetadata(makeParams('test-episode'));
    const og = meta.openGraph as {
      type?: string;
      title?: string;
      description?: string;
      publishedTime?: string;
      images?: unknown;
    } | undefined;
    expect(og).toBeDefined();
    expect(og?.type).toBe('article');
    expect(og?.title).toBe('Test Episode Title');
    expect(og?.description).toBe('A test episode summary for testing.');
    expect(og?.publishedTime).toBe('2026-04-15T12:00:00Z');
  });

  it('unit_episode_generate_metadata_twitter', async () => {
    const meta = await generateMetadata(makeParams('test-episode'));
    const twitter = meta.twitter as { card?: string; title?: string; description?: string } | undefined;
    expect(twitter).toBeDefined();
    expect(twitter?.card).toBe('summary_large_image');
    expect(twitter?.title).toBe('Test Episode Title');
  });

  it('err_metadata_missing_slug', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    // Returns empty object, doesn't throw
    expect(meta).toEqual({});
  });

  it('unit_episode_jsonld_videoobject', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('VideoObject');
  });

  it('unit_episode_jsonld_fields', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed.name).toBe('Test Episode Title');
    expect(parsed.description).toBe('A test episode summary for testing.');
    expect(parsed.datePublished).toBe('2026-04-15T12:00:00Z');
    expect(parsed.contentUrl).toBe('https://youtube.com/watch?v=test123');
  });

  it('data_jsonld_valid_json', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  // --- Accessibility ---

  it('a11y_heading_hierarchy', async () => {
    await renderDetail();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('a11y_article_wrapper', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  // --- Data integrity ---

  it('data_email_source', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    const source = capture.getAttribute('data-source');
    expect(source).toContain('episode-');
    expect(source).toContain('test-episode');
  });
});
