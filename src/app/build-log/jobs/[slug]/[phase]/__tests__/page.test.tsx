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
import { getAllJobs, getJobBySlug, getJobPhase } from '@/lib/build-log/jobs';
import PhasePage, {
  dynamicParams,
  generateMetadata,
  generateStaticParams,
} from '../page';
import type { Job, JobPhase } from '@/content/schemas';

const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetJobBySlug = vi.mocked(getJobBySlug);
const mockGetJobPhase = vi.mocked(getJobPhase);
const mockNotFound = vi.mocked(notFound);

const fixturePhases: readonly JobPhase[] = [
  {
    slug: 'phase-1-foundation',
    filename: 'phase-1-foundation.md',
    header: { phaseNumber: 1, title: 'Foundation', totalSize: '4 features' },
    body: '# Phase 1 body',
  },
  {
    slug: 'phase-2-pages',
    filename: 'phase-2-pages.md',
    header: { phaseNumber: 2, title: 'Pages' },
    body: '# Phase 2 body',
  },
] as const;

function makeJob(overrides: Partial<Job> = {}): Job {
  return {
    slug: 'demo-job',
    alias: 'dj',
    title: 'Demo Job',
    context: 'context',
    features: [],
    phases: fixturePhases,
    readmeBody: '# Demo Job',
    ...overrides,
  } as Job;
}

async function renderPage(slug: string, phase: string) {
  const jsx = await PhasePage({ params: Promise.resolve({ slug, phase }) });
  return render(jsx);
}

describe('/build-log/jobs/[slug]/[phase] page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unit_phase_page_renders_phase_title_h1', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    await renderPage('demo-job', 'phase-1-foundation');
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('Phase 1: Foundation');
  });

  it('unit_phase_page_renders_breadcrumb', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    await renderPage('demo-job', 'phase-1-foundation');
    const back = screen.getByRole('link', { name: /Build log/i });
    expect(back).toHaveAttribute('href', '/build-log');
    const jobLink = screen.getByRole('link', { name: 'Demo Job' });
    expect(jobLink).toHaveAttribute('href', '/build-log/jobs/demo-job');
  });

  it('unit_phase_page_metadata_strip_when_total_size_present', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    expect(container.textContent).toContain('Total size:');
    expect(container.textContent).toContain('4 features');
  });

  it('unit_phase_page_metadata_strip_omitted_when_header_empty', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-3-untitled',
      filename: 'phase-3-untitled.md',
      header: {},
      body: '# body',
    });
    const { container } = await renderPage('demo-job', 'phase-3-untitled');
    expect(container.textContent).not.toContain('Total size:');
    expect(container.textContent).not.toContain('Prerequisites:');
    expect(container.querySelector('dl')).toBeNull();
  });

  it('integration_phase_page_mounts_phase_nav_with_active_slug', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[1]);
    await renderPage('demo-job', 'phase-2-pages');
    const nav = screen.getByTestId('phase-nav');
    expect(nav.getAttribute('data-active')).toBe('phase-2-pages');
    expect(nav.getAttribute('data-phase-count')).toBe('2');
  });

  it('integration_phase_page_mounts_markdown_document_with_body', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      ...fixturePhases[0],
      body: '# Custom phase body marker',
    });
    await renderPage('demo-job', 'phase-1-foundation');
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('# Custom phase body marker');
  });

  it('integration_generate_static_params_phases_one_per_tuple', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', phases: fixturePhases }),
      makeJob({ slug: 'b', phases: fixturePhases }),
      makeJob({ slug: 'c', phases: fixturePhases }),
    ]);
    const params = await generateStaticParams();
    expect(params).toHaveLength(6);
    expect(params).toContainEqual({ slug: 'a', phase: 'phase-1-foundation' });
    expect(params).toContainEqual({ slug: 'a', phase: 'phase-2-pages' });
    expect(params).toContainEqual({ slug: 'b', phase: 'phase-1-foundation' });
    expect(params).toContainEqual({ slug: 'c', phase: 'phase-2-pages' });
  });

  it('integration_generate_metadata_phase_returns_phase_format', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ title: 'Demo Job' }));
    const meta = await generateMetadata({
      params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }),
    });
    expect(meta.title).toBe('Phase 1: Foundation · Demo Job');
  });

  it('edge_state_phase_page_header_partial_only_total_size', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-x',
      filename: 'phase-x.md',
      header: { phaseNumber: 9, title: 'X', totalSize: 'tiny', prerequisites: undefined },
      body: '# x',
    });
    const { container } = await renderPage('demo-job', 'phase-x');
    expect(container.textContent).toContain('Total size:');
    expect(container.textContent).toContain('tiny');
    expect(container.textContent).not.toContain('Prerequisites:');
  });

  it('err_phase_page_unknown_slug_calls_not_found', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    mockGetJobPhase.mockResolvedValue(undefined);
    await PhasePage({ params: Promise.resolve({ slug: 'bogus', phase: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalled();

    vi.clearAllMocks();
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(undefined);
    await PhasePage({ params: Promise.resolve({ slug: 'demo-job', phase: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('sec_information_disclosure_phase_body_inherits_rehype_raw_omission', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue({
      slug: 'phase-evil',
      filename: 'phase-evil.md',
      header: { phaseNumber: 1, title: 'Evil' },
      body: '<script>alert(1)</script>',
    });
    const { container } = await renderPage('demo-job', 'phase-evil');
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('<script>alert(1)</script>');
    // Narrow to executable scripts — JSON-LD is data, not executable
    expect(container.querySelector('script:not([type="application/ld+json"])')).toBeNull();
  });

  it('infra_dynamic_params_false_exported', () => {
    expect(dynamicParams).toBe(false);
  });

  // --- Phase 3.1: Metadata + JSON-LD ---

  it('unit_phase_metadata_openGraph_type', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }) });
    expect((meta.openGraph as { type?: string } | undefined)?.type).toBe('article');
  });

  it('unit_phase_metadata_openGraph_url_matches_phase', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }) });
    expect(meta.openGraph?.url).toBe('/build-log/jobs/demo-job/phase-1-foundation');
  });

  it('unit_phase_metadata_twitter_card', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'phase-1-foundation' }) });
    expect((meta.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('int_phase_renders_json_ld_tech_article', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('TechArticle');
  });

  it('int_phase_json_ld_headline_contains_phase', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob({ title: 'Demo Job' }));
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.headline).toContain('Phase 1: Foundation');
    expect(payload.headline).toContain('Demo Job');
  });

  it('int_phase_json_ld_isPartOf_job', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.isPartOf?.['@type']).toBe('TechArticle');
    expect(payload.isPartOf?.url).toBe('https://fabled10x.com/build-log/jobs/demo-job');
  });

  it('infra_phase_json_ld_valid_json', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('edge_phase_generateMetadata_unknown_phase_returns_empty', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'demo-job', phase: 'bogus-phase' }) });
    expect(meta).toEqual({});
  });

  it('edge_phase_generateMetadata_unknown_job_returns_empty', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    const meta = await generateMetadata({ params: Promise.resolve({ slug: 'bogus', phase: 'any' }) });
    expect(meta).toEqual({});
  });

  it('err_phase_page_still_calls_notFound_when_missing', async () => {
    mockGetJobBySlug.mockResolvedValue(undefined);
    mockGetJobPhase.mockResolvedValue(undefined);
    await PhasePage({ params: Promise.resolve({ slug: 'bogus', phase: 'bogus' }) });
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('a11y_phase_page_single_h1_after_metadata', async () => {
    mockGetJobBySlug.mockResolvedValue(makeJob());
    mockGetJobPhase.mockResolvedValue(fixturePhases[0]);
    const { container } = await renderPage('demo-job', 'phase-1-foundation');
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
  });
});
