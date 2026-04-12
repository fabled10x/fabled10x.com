import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
  getCaseBySlug: vi.fn(),
}));

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

vi.mock('@/components/crosslinks/LllCrosslinks', () => ({
  LllCrosslinks: ({ urls, className }: { urls: string[]; className?: string }) => (
    <div
      data-testid="lll-crosslinks"
      data-urls={JSON.stringify(urls)}
      className={className}
    />
  ),
}));

import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { getAllCases, getCaseBySlug } from '@/lib/content/cases';
import { getAllEpisodes } from '@/lib/content/episodes';
import CaseDetail, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetCaseBySlug = vi.mocked(getCaseBySlug);
const mockGetAllCases = vi.mocked(getAllCases);
const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockNotFound = vi.mocked(notFound);

const MOCK_MDX_COMPONENT = () => <div data-testid="mdx-body">Case MDX content</div>;

const MOCK_CASE_FULL = {
  meta: {
    id: 'case-001',
    slug: 'test-case',
    title: 'Test Case Title',
    client: 'Test Client LLC',
    status: 'active' as const,
    summary: 'A test case summary for the detail page.',
    problem: 'The defining problem of this engagement.',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: ['Deliverable One', 'Deliverable Two', 'Deliverable Three'],
    outcome: 'Outcome description goes here.',
    startedAt: '2026-03-01T00:00:00.000Z',
    relatedEpisodeIds: ['ep-001'],
    lllEntryUrls: [
      'https://largelanguagelibrary.ai/entries/case-topic',
      'https://largelanguagelibrary.ai/entries/related-topic',
    ],
  },
  slug: 'test-case',
  Component: MOCK_MDX_COMPONENT,
};

const MOCK_CASE_MINIMAL = {
  meta: {
    id: 'case-002',
    slug: 'minimal-case',
    title: 'Minimal Case',
    client: 'Minimal Client',
    status: 'archived' as const,
    summary: 'Minimal summary.',
    problem: 'Minimal problem.',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: [],
    outcome: 'Minimal outcome.',
    relatedEpisodeIds: [],
    lllEntryUrls: [],
  },
  slug: 'minimal-case',
  Component: () => <div data-testid="mdx-body">Minimal content</div>,
};

const MOCK_EPISODE_RELATED = {
  meta: {
    id: 'ep-001',
    slug: 'related-episode',
    title: 'Related Episode Title',
    series: 'Test Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'Related episode summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'related-episode',
  Component: () => null,
};

const MOCK_EPISODE_UNRELATED = {
  meta: {
    id: 'ep-999',
    slug: 'unrelated-episode',
    title: 'Unrelated Episode',
    series: 'Other Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'shorts' as const,
    pillar: 'workflow' as const,
    summary: 'Unrelated summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'unrelated-episode',
  Component: () => null,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'test-case') {
  const jsx = await CaseDetail(makeParams(slug));
  return render(jsx);
}

describe('CaseDetail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_FULL);
    mockGetAllEpisodes.mockResolvedValue([
      MOCK_EPISODE_RELATED,
      MOCK_EPISODE_UNRELATED,
    ]);
  });

  // --- Unit ---

  it('unit_detail_title', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Test Case Title' }),
    ).toBeInTheDocument();
  });

  it('unit_detail_status_label', async () => {
    await renderDetail();
    expect(screen.getByText(/Active Engagement/)).toBeInTheDocument();
  });

  it('unit_detail_client', async () => {
    await renderDetail();
    expect(screen.getByText(/Test Client LLC/)).toBeInTheDocument();
  });

  it('unit_detail_summary', async () => {
    await renderDetail();
    expect(
      screen.getByText('A test case summary for the detail page.'),
    ).toBeInTheDocument();
  });

  it('unit_detail_problem_section', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'The problem' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('The defining problem of this engagement.'),
    ).toBeInTheDocument();
  });

  it('unit_detail_deliverables_section', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Deliverables' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Deliverable One')).toBeInTheDocument();
    expect(screen.getByText('Deliverable Two')).toBeInTheDocument();
    expect(screen.getByText('Deliverable Three')).toBeInTheDocument();
  });

  it('unit_detail_outcome_section', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Outcome' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Outcome description goes here.')).toBeInTheDocument();
  });

  it('unit_detail_mdx_body', async () => {
    await renderDetail();
    expect(screen.getByTestId('mdx-body')).toBeInTheDocument();
    expect(screen.getByText('Case MDX content')).toBeInTheDocument();
  });

  it('unit_detail_related_episode_link', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Episodes' }),
    ).toBeInTheDocument();
    const link = screen.getByRole('link', { name: 'Related Episode Title' });
    expect(link).toHaveAttribute('href', '/episodes/related-episode');
    // Unrelated episode must NOT appear
    expect(screen.queryByText('Unrelated Episode')).not.toBeInTheDocument();
  });

  it('unit_detail_email_capture', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    expect(capture).toHaveAttribute('data-source', 'case-test-case');
  });

  it('unit_detail_lll_crosslinks', async () => {
    await renderDetail();
    const crosslinks = screen.getByTestId('lll-crosslinks');
    expect(crosslinks).toBeInTheDocument();
    const urls = JSON.parse(crosslinks.getAttribute('data-urls')!);
    expect(urls).toHaveLength(2);
    expect(urls).toContain('https://largelanguagelibrary.ai/entries/case-topic');
  });

  // --- Integration ---

  it('int_detail_calls_getCaseBySlug', async () => {
    await renderDetail();
    expect(mockGetCaseBySlug).toHaveBeenCalledWith('test-case');
  });

  it('int_detail_calls_getAllEpisodes', async () => {
    await renderDetail();
    expect(mockGetAllEpisodes).toHaveBeenCalledOnce();
  });

  it('int_detail_uses_container_article', async () => {
    const { container } = await renderDetail();
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article?.classList.contains('mx-auto')).toBe(true);
  });

  // --- Edge ---

  it('edge_detail_empty_deliverables', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL);
    await renderDetail('minimal-case');
    expect(
      screen.getByRole('heading', { level: 2, name: 'Deliverables' }),
    ).toBeInTheDocument();
    // Find the deliverables list and assert 0 items
    const deliverablesHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Deliverables',
    });
    const deliverablesList = deliverablesHeading.parentElement?.querySelector('ul');
    expect(deliverablesList).not.toBeNull();
    expect(deliverablesList!.querySelectorAll('li')).toHaveLength(0);
  });

  it('edge_detail_empty_related_episodes', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL);
    await renderDetail('minimal-case');
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Episodes' }),
    ).not.toBeInTheDocument();
  });

  it('edge_detail_empty_lll_urls', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE_MINIMAL);
    await renderDetail('minimal-case');
    expect(screen.queryByTestId('lll-crosslinks')).not.toBeInTheDocument();
  });

  // --- Error recovery ---

  it('err_detail_not_found', async () => {
    mockGetCaseBySlug.mockResolvedValue(null);
    const jsx = await CaseDetail(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  // --- Infrastructure ---

  it('infra_detail_dynamic_params_false', () => {
    expect(dynamicParams).toBe(false);
  });

  it('infra_detail_generate_static_params', async () => {
    mockGetAllCases.mockResolvedValue([MOCK_CASE_FULL, MOCK_CASE_MINIMAL]);
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'test-case' },
      { slug: 'minimal-case' },
    ]);
  });

  it('infra_detail_generate_metadata', async () => {
    const meta = await generateMetadata(makeParams('test-case'));
    expect(meta.title).toBe('Test Case Title');
    expect(meta.description).toBe('A test case summary for the detail page.');
  });

  // --- Phase 4.1 additions: expanded metadata + JSON-LD ---

  it('unit_case_generate_metadata_og', async () => {
    const meta = await generateMetadata(makeParams('test-case'));
    const og = meta.openGraph as { title?: string; description?: string } | undefined;
    expect(og).toBeDefined();
    expect(og?.title).toBe('Test Case Title');
    expect(og?.description).toBe('A test case summary for the detail page.');
  });

  it('unit_case_jsonld_creativework', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('CreativeWork');
  });

  it('unit_case_jsonld_creator_org', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed.creator).toBeDefined();
    expect(parsed.creator['@type']).toBe('Organization');
    expect(parsed.creator.name).toBe('Fabled10X');
    expect(parsed.creator.url).toBe('https://fabled10x.com');
  });

  it('unit_case_jsonld_about_client', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed.about).toBe('Test Client LLC');
  });

  it('data_jsonld_fields_typed', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('CreativeWork');
    expect(parsed.name).toBe('Test Case Title');
  });

  // --- Accessibility ---

  it('a11y_detail_heading_hierarchy', async () => {
    await renderDetail();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    // problem + deliverables + outcome + episodes = 4
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('a11y_detail_article_wrapper', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  // --- Data integrity ---

  it('data_detail_email_source_format', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    const source = capture.getAttribute('data-source');
    expect(source).toContain('case-');
    expect(source).toContain('test-case');
    expect(source).toBe('case-test-case');
  });

  it('data_detail_card_count_matches_source', async () => {
    await renderDetail();
    const deliverablesHeading = screen.getByRole('heading', {
      level: 2,
      name: 'Deliverables',
    });
    const deliverablesList = deliverablesHeading.parentElement?.querySelector('ul');
    expect(deliverablesList!.querySelectorAll('li')).toHaveLength(
      MOCK_CASE_FULL.meta.deliverables.length,
    );
  });
});
