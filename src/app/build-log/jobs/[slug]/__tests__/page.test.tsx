import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/build-log/jobs', () => ({
  getAllJobs: vi.fn(),
  getJobBySlug: vi.fn(),
  getJobPhase: vi.fn(),
}));

vi.mock('@/components/build-log/MarkdownDocument', () => ({
  MarkdownDocument: ({ body }: { body: string }) => (
    <div data-testid="markdown-document" data-body={body} />
  ),
}));

vi.mock('@/components/build-log/PhaseNav', () => ({
  PhaseNav: ({
    jobSlug,
    phases,
    activePhaseSlug,
  }: {
    jobSlug: string;
    phases: ReadonlyArray<{ slug: string }>;
    activePhaseSlug?: string;
  }) => (
    <div
      data-testid="phase-nav"
      data-job-slug={jobSlug}
      data-phase-count={phases.length}
      data-active={activePhaseSlug ?? ''}
    />
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getAllJobs, getJobBySlug } from '@/lib/build-log/jobs';
import JobPage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../page';
import type { Job, JobPhase } from '@/content/schemas';

const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetJobBySlug = vi.mocked(getJobBySlug);
const mockNotFound = vi.mocked(notFound);

const fixturePhases: readonly JobPhase[] = [
  {
    slug: 'phase-1-foundation',
    filename: 'phase-1-foundation.md',
    header: { phaseNumber: 1, title: 'Foundation' },
    body: '# Phase 1',
  },
  {
    slug: 'phase-2-pages',
    filename: 'phase-2-pages.md',
    header: { phaseNumber: 2, title: 'Pages' },
    body: '# Phase 2',
  },
] as const;

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    slug: 'demo-job',
    alias: 'dj',
    title: 'Demo Job',
    context: 'A short context describing demo job.',
    features: [],
    phases: fixturePhases,
    readmeBody: '# Demo Job\n\nReadme body here.',
    ...overrides,
  } as Job;
}

async function renderPage(slug: string) {
  const jsx = await JobPage({ params: Promise.resolve({ slug }) });
  return render(jsx);
}

describe('/build-log/jobs/[slug] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unit_job_page_renders_title_h1', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Demo Job/);
  });

  it('unit_job_page_renders_back_link_to_index', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const back = screen.getByRole('link', { name: /Back to build log/i });
    expect(back).toHaveAttribute('href', '/build-log');
  });

  it('integration_job_page_mounts_phase_nav_with_phases', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    await renderPage('demo-job');
    const nav = screen.getByTestId('phase-nav');
    expect(nav.getAttribute('data-job-slug')).toBe('demo-job');
    expect(nav.getAttribute('data-phase-count')).toBe('2');
    expect(nav.getAttribute('data-active')).toBe('');
  });

  it('integration_job_page_mounts_markdown_document', async () => {
    mockGetJobBySlug.mockResolvedValue(
      makeJob({ readmeBody: '# Custom readme body marker' }),
    );
    await renderPage('demo-job');
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('# Custom readme body marker');
  });

  it('integration_generate_static_params_jobs_one_per_slug', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a' }),
      makeJob({ slug: 'b' }),
      makeJob({ slug: 'c' }),
    ]);
    const params = await generateStaticParams();
    expect(params).toEqual([
      { slug: 'a' },
      { slug: 'b' },
      { slug: 'c' },
    ]);
  });

  it('integration_generate_metadata_job_returns_title_with_suffix', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ title: 'Demo Job' }));
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.title).toBe('Demo Job · Build log');
  });

  it('err_job_page_unknown_slug_calls_not_found', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    await JobPage({ params: Promise.resolve({ slug: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalledTimes(1);
  });

  it('err_generate_metadata_returns_empty_when_entry_missing', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'bogus' }) });
    expect(meta).toEqual({});
  });

  it('data_serialization_phase_metadata_description_truncates_at_160', async () => {
    const longContext = 'X'.repeat(500);
    mockGetJobBySlug.mockResolvedValue(makeJob({ context: longContext }));
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(typeof meta.description).toBe('string');
    expect((meta.description as string).length).toBe(160);
  });

  it('sec_tampering_slug_route_bounded_by_static_params', () => {
    expect(dynamicParams).toBe(false);
  });

  // --- Phase 3.1: Metadata + JSON-LD ---

  it('unit_job_metadata_openGraph_type', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect((meta.openGraph as { type?: string } | undefined)?.type).toBe('article');
  });

  it('unit_job_metadata_openGraph_url_matches_slug', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.openGraph?.url).toBe('/build-log/jobs/demo-job');
  });

  it('unit_job_metadata_twitter_card', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect((meta.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('unit_job_metadata_alternates_canonical', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.alternates?.canonical).toBe('/build-log/jobs/demo-job');
  });

  it('int_job_renders_json_ld_tech_article', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('TechArticle');
  });

  it('int_job_json_ld_headline_is_title', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ title: 'Demo Job' }));
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.headline).toBe('Demo Job');
  });

  it('int_job_json_ld_isPartOf_collection', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.isPartOf?.['@type']).toBe('CollectionPage');
    expect(payload.isPartOf?.url).toBe('https://fabled10x.com/build-log');
  });

  it('infra_job_json_ld_valid_json', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const { container } = await renderPage('demo-job');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('edge_job_generateMetadata_unknown_slug_returns_empty', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'bogus' }) });
    expect(meta).toEqual({});
  });

  it('data_job_metadata_canonical_relative', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job' }) });
    expect(meta.alternates?.canonical).not.toMatch(/^https?:\/\//);
    expect(meta.alternates?.canonical).toMatch(/^\//);
  });
});
