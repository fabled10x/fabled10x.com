import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/build-log/jobs', () => ({
  getAllJobs: vi.fn(),
}));

vi.mock('@/lib/build-log/pipeline-state', () => ({
  getJobsRollup: vi.fn(),
}));

vi.mock('@/components/build-log/JobCard', () => ({
  JobCard: ({
    rollup,
    excerpt,
  }: {
    rollup: { slug: string; title: string };
    excerpt: string;
  }) => (
    <div
      data-testid={`job-card-${rollup.slug}`}
      data-excerpt={excerpt}
    >
      {rollup.title}
    </div>
  ),
}));

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getJobsRollup } from '@/lib/build-log/pipeline-state';
import BuildLogIndexPage, { metadata } from '../page';
import type { Job, JobRollupEntry } from '@/content/schemas';

const mockGetAllJobs = vi.mocked(getAllJobs);
const mockGetJobsRollup = vi.mocked(getJobsRollup);

function makeJob(overrides: Partial<Job>): Job {
  return {
    slug: 'demo',
    title: 'Demo Job',
    context: 'Single paragraph context.',
    features: [],
    phases: [],
    readmeBody: '# Demo Job',
    ...overrides,
  } as Job;
}

function makeRollup(overrides: Partial<JobRollupEntry>): JobRollupEntry {
  return {
    slug: 'demo',
    title: 'Demo Job',
    totalFeatures: 0,
    completedFeatures: 0,
    percentComplete: null,
    status: 'unknown',
    ...overrides,
  };
}

async function renderPage() {
  const jsx = await BuildLogIndexPage();
  return render(jsx);
}

describe('/build-log index page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('unit_index_page_renders_title_h1', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    await renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Build log/i);
  });

  it('unit_index_page_renders_status_link', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    await renderPage();
    const link = screen.getByRole('link', { name: /See live pipeline status/i });
    expect(link).toHaveAttribute('href', '/build-log/status');
  });

  it('unit_index_page_first_paragraph_helper_single_first', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({
        slug: 'multi-para',
        title: 'Multi Para',
        context: 'First paragraph here.\n\nSecond paragraph that should not appear.',
      }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'multi-para', title: 'Multi Para' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-multi-para');
    expect(card.getAttribute('data-excerpt')).toBe('First paragraph here.');
  });

  it('unit_index_page_first_paragraph_helper_collapses_whitespace', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({
        slug: 'wsp',
        title: 'Whitespace',
        context: 'Line one\n  line two\n\tline three.\n\nNext paragraph.',
      }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'wsp', title: 'Whitespace' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-wsp');
    expect(card.getAttribute('data-excerpt')).toBe('Line one line two line three.');
  });

  it('integration_index_page_renders_one_card_per_job', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
      makeJob({ slug: 'c', title: 'C' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A' }),
      makeRollup({ slug: 'b', title: 'B' }),
      makeRollup({ slug: 'c', title: 'C' }),
    ]);
    await renderPage();
    expect(screen.getByTestId('job-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('job-card-b')).toBeInTheDocument();
    expect(screen.getByTestId('job-card-c')).toBeInTheDocument();
  });

  it('integration_index_page_join_skips_jobs_without_rollup', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'orphan', title: 'Orphan' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A' }),
      // intentionally NO entry for "orphan"
    ]);
    await renderPage();
    expect(screen.getByTestId('job-card-a')).toBeInTheDocument();
    expect(screen.queryByTestId('job-card-orphan')).toBeNull();
  });

  it('edge_input_index_page_empty_jobs_renders_initializing', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
    const grid = container.querySelector('[class*="grid"]');
    expect(grid).toBeNull();
  });

  it('edge_input_first_paragraph_handles_empty_string', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'empty', title: 'Empty', context: '' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'empty', title: 'Empty' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-empty');
    expect(card.getAttribute('data-excerpt')).toBe('');
  });

  it('edge_input_first_paragraph_single_paragraph_no_split', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'one', title: 'One', context: 'Just a single paragraph.' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([makeRollup({ slug: 'one', title: 'One' })]);
    await renderPage();
    const card = screen.getByTestId('job-card-one');
    expect(card.getAttribute('data-excerpt')).toBe('Just a single paragraph.');
  });

  it('a11y_index_page_single_h1', async () => {
    mockGetAllJobs.mockResolvedValue([
      makeJob({ slug: 'a', title: 'A' }),
      makeJob({ slug: 'b', title: 'B' }),
    ]);
    mockGetJobsRollup.mockResolvedValue([
      makeRollup({ slug: 'a', title: 'A' }),
      makeRollup({ slug: 'b', title: 'B' }),
    ]);
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    void within;
  });

  // --- Phase 3.1: Metadata + JSON-LD ---

  it('unit_index_metadata_openGraph_url', () => {
    expect(metadata.openGraph?.url).toBe('/build-log');
  });

  it('unit_index_metadata_openGraph_type', () => {
    expect((metadata.openGraph as { type?: string } | undefined)?.type).toBe('website');
  });

  it('unit_index_metadata_twitter_card', () => {
    expect((metadata.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('unit_index_metadata_alternates_canonical', () => {
    expect(metadata.alternates?.canonical).toBe('/build-log');
  });

  it('int_index_renders_json_ld_collection_page', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('CollectionPage');
  });

  it('int_index_json_ld_name', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.name).toBe('Build log');
  });

  it('int_index_json_ld_url', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.url).toBe('https://fabled10x.com/build-log');
  });

  it('infra_index_json_ld_valid_json', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('err_index_page_renders_when_no_jobs', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(screen.getByText(/Initializing/i)).toBeInTheDocument();
  });

  it('data_json_ld_urls_absolute_index', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.url).toMatch(/^https:\/\/fabled10x\.com\//);
    if (payload.isPartOf?.url) {
      expect(payload.isPartOf.url).toMatch(/^https:\/\/fabled10x\.com/);
    }
  });

  it('a11y_index_page_single_h1_after_metadata', async () => {
    mockGetAllJobs.mockResolvedValue([]);
    mockGetJobsRollup.mockResolvedValue([]);
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
  });
});
