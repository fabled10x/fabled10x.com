import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/build-log/pipeline-state', () => ({
  getSessionStatus: vi.fn(),
  getKnowledgeFile: vi.fn(),
  getJobsRollup: vi.fn(),
}));

vi.mock('@/components/build-log/JobsRollupTable', () => ({
  JobsRollupTable: ({ rows }: { rows: readonly { slug: string; title: string }[] }) => (
    <div data-testid="jobs-rollup-table" data-row-count={rows.length}>
      {rows.map((r) => (
        <span key={r.slug} data-testid={`rollup-row-${r.slug}`}>
          {r.title}
        </span>
      ))}
    </div>
  ),
}));

vi.mock('@/components/build-log/MarkdownDocument', () => ({
  MarkdownDocument: ({ body }: { body: string }) => (
    <div data-testid="markdown-document" data-body={body}>
      {body}
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  getSessionStatus,
  getKnowledgeFile,
  getJobsRollup,
} from '@/lib/build-log/pipeline-state';
import StatusPage, { metadata } from '../page';
import type {
  SessionStatus,
  KnowledgeFile,
  JobRollupEntry,
} from '@/content/schemas';

const mockSession = vi.mocked(getSessionStatus);
const mockKnowledge = vi.mocked(getKnowledgeFile);
const mockRollup = vi.mocked(getJobsRollup);

function makeSession(overrides: Partial<SessionStatus> = {}): SessionStatus {
  return {
    id: '2026-04-13-001',
    startedAt: '2026-04-13T00:00:00Z',
    currentPhase: 'build-in-public-docs',
    currentSection: 'build-in-public-docs-2.3',
    currentAgent: 'red',
    currentStage: 'red-in-progress',
    completedSections: [],
    notes: undefined,
    ...overrides,
  } as SessionStatus;
}

function makeKnowledge(overrides: Partial<KnowledgeFile> = {}): KnowledgeFile {
  return {
    version: 1,
    project: 'fabled10x',
    description: undefined,
    projectContext: undefined,
    openQuestions: undefined,
    ...overrides,
  } as KnowledgeFile;
}

function makeRollupEntry(overrides: Partial<JobRollupEntry> = {}): JobRollupEntry {
  return {
    slug: 'demo',
    title: 'Demo Job',
    alias: 'dj',
    totalFeatures: 5,
    completedFeatures: 1,
    percentComplete: 20,
    status: 'in-progress',
    ...overrides,
  };
}

async function renderPage() {
  const jsx = await StatusPage();
  return render(jsx);
}

describe('/build-log/status page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession.mockResolvedValue(makeSession());
    mockKnowledge.mockResolvedValue(makeKnowledge());
    mockRollup.mockResolvedValue([]);
  });

  it('unit_status_page_renders_h1_pipeline_status', async () => {
    await renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Pipeline status/i);
  });

  it('unit_status_page_renders_session_id', async () => {
    mockSession.mockResolvedValue(makeSession({ id: '2026-04-13-XYZ' }));
    await renderPage();
    expect(screen.getByText('2026-04-13-XYZ')).toBeInTheDocument();
  });

  it('unit_status_page_renders_back_link_to_build_log', async () => {
    await renderPage();
    const link = screen.getByRole('link', { name: /Back to build log/i });
    expect(link).toHaveAttribute('href', '/build-log');
  });

  it('unit_status_page_renders_jobs_rollup_table', async () => {
    mockRollup.mockResolvedValue([
      makeRollupEntry({ slug: 'a', title: 'A' }),
      makeRollupEntry({ slug: 'b', title: 'B' }),
    ]);
    await renderPage();
    const table = screen.getByTestId('jobs-rollup-table');
    expect(table).toBeInTheDocument();
    expect(table.getAttribute('data-row-count')).toBe('2');
    expect(screen.getByTestId('rollup-row-a')).toBeInTheDocument();
    expect(screen.getByTestId('rollup-row-b')).toBeInTheDocument();
  });

  it('integration_status_page_renders_all_four_sections', async () => {
    mockSession.mockResolvedValue(
      makeSession({
        completedSections: ['foo-1.1', 'foo-1.2'],
        notes: 'Some notes here',
      }),
    );
    await renderPage();
    expect(screen.getByRole('heading', { level: 2, name: /Current state/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Jobs at a glance/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Completed sections/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: /Notes/i })).toBeInTheDocument();
  });

  it('integration_status_page_parallel_loader_calls', async () => {
    await renderPage();
    expect(mockSession).toHaveBeenCalledTimes(1);
    expect(mockKnowledge).toHaveBeenCalledTimes(1);
    expect(mockRollup).toHaveBeenCalledTimes(1);
  });

  it('integration_status_page_completed_sections_renders_li_per_entry', async () => {
    mockSession.mockResolvedValue(
      makeSession({
        completedSections: [
          'foo-1.1',
          { section: 'foo-1.2', completedAt: '2026-04-12T00:00:00Z' },
          'bar-2.1',
        ],
      }),
    );
    const { container } = await renderPage();
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('foo-1.1');
    expect(items[1].textContent).toBe('foo-1.2');
    expect(items[2].textContent).toBe('bar-2.1');
  });

  it('a11y_status_page_single_h1', async () => {
    const { container } = await renderPage();
    const h1s = container.querySelectorAll('h1');
    expect(h1s).toHaveLength(1);
  });

  it('a11y_status_page_current_state_uses_dl_dt_dd', async () => {
    const { container } = await renderPage();
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    const dts = dl?.querySelectorAll('dt');
    const dds = dl?.querySelectorAll('dd');
    expect((dts?.length ?? 0)).toBeGreaterThan(0);
    expect((dds?.length ?? 0)).toBeGreaterThan(0);
  });

  it('a11y_status_page_section_aria_labelledby', async () => {
    mockSession.mockResolvedValue(makeSession({ notes: 'something' }));
    const { container } = await renderPage();
    expect(container.querySelector('section[aria-labelledby="current-state"] h2#current-state')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="rollup"] h2#rollup')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="completed"] h2#completed')).not.toBeNull();
    expect(container.querySelector('section[aria-labelledby="notes"] h2#notes')).not.toBeNull();
  });

  it('infra_status_page_metadata_title', () => {
    expect(metadata.title).toBe('Pipeline status · Build log');
  });

  it('infra_status_page_metadata_description', () => {
    expect(typeof metadata.description).toBe('string');
    expect((metadata.description as string).length).toBeGreaterThan(0);
  });

  it('infra_status_page_default_export_is_async', () => {
    expect(StatusPage.constructor.name).toBe('AsyncFunction');
  });

  it('edge_state_status_page_empty_completed_sections_renders_empty_state', async () => {
    mockSession.mockResolvedValue(makeSession({ completedSections: [] }));
    const { container } = await renderPage();
    expect(screen.getByText(/No sections shipped yet/i)).toBeInTheDocument();
    const completedSection = container.querySelector('section[aria-labelledby="completed"]');
    const ulInside = completedSection?.querySelector('ul');
    expect(ulInside).toBeNull();
  });

  it('edge_state_status_page_empty_session_strings_render_em_dash', async () => {
    mockSession.mockResolvedValue(
      makeSession({ currentSection: '', currentAgent: '', currentStage: '' }),
    );
    const { container } = await renderPage();
    const dl = container.querySelector('dl');
    const dds = Array.from(dl?.querySelectorAll('dd') ?? []);
    const labels = Array.from(dl?.querySelectorAll('dt') ?? []).map((dt) => dt.textContent);
    const idx = (text: string) => labels.findIndex((l) => l && new RegExp(text, 'i').test(l));
    expect(dds[idx('Current section')].textContent).toBe('—');
    expect(dds[idx('Current agent')].textContent).toBe('—');
    expect(dds[idx('Current stage')].textContent).toBe('—');
  });

  it('edge_state_status_page_omits_notes_section_when_empty', async () => {
    mockSession.mockResolvedValue(makeSession({ notes: undefined }));
    mockKnowledge.mockResolvedValue(makeKnowledge({ projectContext: undefined }));
    const { container } = await renderPage();
    expect(container.querySelector('section[aria-labelledby="notes"]')).toBeNull();
  });

  it('edge_state_status_page_renders_notes_when_present', async () => {
    mockSession.mockResolvedValue(makeSession({ notes: '## Heading\n\nSome **markdown** body.' }));
    const { container } = await renderPage();
    const notesSection = container.querySelector('section[aria-labelledby="notes"]');
    expect(notesSection).not.toBeNull();
    const md = screen.getByTestId('markdown-document');
    expect(md.getAttribute('data-body')).toBe('## Heading\n\nSome **markdown** body.');
  });

  it('edge_state_status_page_omits_started_at_when_undefined', async () => {
    mockSession.mockResolvedValue(makeSession({ startedAt: undefined }));
    const { container } = await renderPage();
    const dts = Array.from(container.querySelectorAll('dt')).map((dt) => dt.textContent);
    expect(dts.some((t) => t && /Started/i.test(t))).toBe(false);
  });

  it('data_integrity_extract_section_id_string_form', async () => {
    mockSession.mockResolvedValue(makeSession({ completedSections: ['foo-1.1'] }));
    const { container } = await renderPage();
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('foo-1.1');
  });

  it('data_integrity_extract_section_id_object_form', async () => {
    mockSession.mockResolvedValue(
      makeSession({
        completedSections: [{ section: 'foo-1.2', completedAt: '2026-04-12T00:00:00Z' }],
      }),
    );
    const { container } = await renderPage();
    const items = container.querySelectorAll('li');
    expect(items).toHaveLength(1);
    expect(items[0].textContent).toBe('foo-1.2');
  });

  it('data_integrity_completed_sections_preserves_order', async () => {
    mockSession.mockResolvedValue(
      makeSession({ completedSections: ['z-9.9', 'a-1.1', 'm-5.5'] }),
    );
    const { container } = await renderPage();
    const items = container.querySelectorAll('li');
    expect(Array.from(items).map((li) => li.textContent)).toEqual([
      'z-9.9',
      'a-1.1',
      'm-5.5',
    ]);
  });

  // --- Phase 3.1: Metadata + JSON-LD ---

  it('unit_status_metadata_openGraph_url', () => {
    expect(metadata.openGraph?.url).toBe('/build-log/status');
  });

  it('unit_status_metadata_twitter_card', () => {
    expect((metadata.twitter as { card?: string } | undefined)?.card).toBe('summary_large_image');
  });

  it('unit_status_metadata_alternates_canonical', () => {
    expect(metadata.alternates?.canonical).toBe('/build-log/status');
  });

  it('int_status_renders_json_ld_collection_page', async () => {
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    const payload = JSON.parse(script!.innerHTML);
    expect(payload['@type']).toBe('CollectionPage');
  });

  it('int_status_json_ld_name', async () => {
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.name).toBe('Pipeline status');
  });

  it('int_status_json_ld_url', async () => {
    const { container } = await renderPage();
    const script = container.querySelector('script[type="application/ld+json"]');
    const payload = JSON.parse(script!.innerHTML);
    expect(payload.url).toBe('https://fabled10x.com/build-log/status');
  });
});
