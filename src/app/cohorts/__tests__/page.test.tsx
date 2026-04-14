import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/content/cohorts', () => ({
  getCohortBuckets: vi.fn(),
}));

vi.mock('@/components/cohorts/CohortCard', () => ({
  CohortCard: ({ cohort }: { cohort: { title: string; slug: string } }) => (
    <div data-testid="cohort-card" data-slug={cohort.slug}>
      <a href={`/cohorts/${cohort.slug}`}>{cohort.title}</a>
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { getCohortBuckets } from '@/lib/content/cohorts';
import CohortsIndexPage, { metadata } from '../page';

const mockGetCohortBuckets = vi.mocked(getCohortBuckets);

const MOCK_UPCOMING = [
  {
    meta: {
      id: 'cohort-001',
      slug: 'ai-delivery-2026-q3',
      title: 'AI Delivery Intensive',
      series: 'AI Delivery',
      tagline: 'Ship real AI projects in 6 weeks.',
      summary: 'An intensive cohort for solo consultants.',
      status: 'announced' as const,
      pillar: 'delivery' as const,
      startDate: '2026-07-06',
      endDate: '2026-08-14',
      durationWeeks: 6,
      capacity: 12,
      priceCents: 249900,
      currency: 'usd',
      stripePriceId: 'price_REPLACEMEBEFORESHIPPING_ai_delivery',
      commitmentHoursPerWeek: 10,
      lllEntryUrls: [],
      relatedEpisodeIds: [],
      relatedCaseIds: [],
      publishedAt: '2026-04-01',
    },
    slug: 'ai-delivery-2026-q3',
    default: () => null,
  },
  {
    meta: {
      id: 'cohort-002',
      slug: 'workflow-mastery-2026-q4',
      title: 'Workflow Mastery',
      series: 'Workflow Mastery',
      tagline: 'Master AI-driven delivery workflows.',
      summary: 'A cohort focused on workflow optimization.',
      status: 'open' as const,
      pillar: 'workflow' as const,
      startDate: '2026-10-05',
      endDate: '2026-11-27',
      durationWeeks: 8,
      capacity: 10,
      priceCents: 349900,
      currency: 'usd',
      stripePriceId: 'price_REPLACEMEBEFORESHIPPING_workflow',
      commitmentHoursPerWeek: 12,
      lllEntryUrls: [],
      relatedEpisodeIds: [],
      relatedCaseIds: [],
      publishedAt: '2026-04-01',
    },
    slug: 'workflow-mastery-2026-q4',
    default: () => null,
  },
];

async function renderIndex() {
  const jsx = await CohortsIndexPage();
  return render(jsx);
}

describe('CohortsIndexPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: MOCK_UPCOMING,
      archived: [],
    });
  });

  // --- Unit ---

  it('unit_index_heading', async () => {
    await renderIndex();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Learn in a cohort' }),
    ).toBeInTheDocument();
  });

  it('unit_index_subtitle', async () => {
    await renderIndex();
    expect(
      screen.getByText(/Intensive, application-required programs/i),
    ).toBeInTheDocument();
  });

  it('unit_index_upcoming_heading', async () => {
    await renderIndex();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Upcoming' }),
    ).toBeInTheDocument();
  });

  it('unit_index_upcoming_cards', async () => {
    await renderIndex();
    const cards = screen.getAllByTestId('cohort-card');
    expect(cards).toHaveLength(2);
  });

  it('unit_index_card_titles', async () => {
    await renderIndex();
    expect(screen.getByText('AI Delivery Intensive')).toBeInTheDocument();
    expect(screen.getByText('Workflow Mastery')).toBeInTheDocument();
  });

  it('unit_index_card_links', async () => {
    await renderIndex();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/cohorts/ai-delivery-2026-q3');
    expect(hrefs).toContain('/cohorts/workflow-mastery-2026-q4');
  });

  // --- Integration ---

  it('int_index_calls_getCohortBuckets', async () => {
    await renderIndex();
    expect(mockGetCohortBuckets).toHaveBeenCalledOnce();
  });

  it('int_index_uses_container', async () => {
    const { container } = await renderIndex();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('int_index_grid_layout', async () => {
    const { container } = await renderIndex();
    const grid = container.querySelector('.sm\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });

  // --- Edge ---

  it('edge_index_empty_upcoming', async () => {
    mockGetCohortBuckets.mockResolvedValue({ upcoming: [], archived: [] });
    await renderIndex();
    expect(screen.getByText(/No upcoming cohorts/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Join the newsletter/i });
    expect(link).toHaveAttribute('href', '/#email-capture');
  });

  it('edge_index_no_archived', async () => {
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: MOCK_UPCOMING,
      archived: [],
    });
    await renderIndex();
    expect(screen.queryByText('Past cohorts')).not.toBeInTheDocument();
  });

  it('edge_index_with_archived', async () => {
    const archivedCohort = {
      ...MOCK_UPCOMING[0],
      meta: { ...MOCK_UPCOMING[0].meta, status: 'shipped' as const },
    };
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: [],
      archived: [archivedCohort],
    });
    await renderIndex();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Past cohorts' }),
    ).toBeInTheDocument();
  });

  // --- Data Integrity ---

  it('data_index_card_count', async () => {
    await renderIndex();
    const cards = screen.getAllByTestId('cohort-card');
    expect(cards).toHaveLength(MOCK_UPCOMING.length);
  });

  // --- Accessibility ---

  it('a11y_index_heading_hierarchy', async () => {
    await renderIndex();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('a11y_index_links_text', async () => {
    await renderIndex();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it('a11y_index_section_labels', async () => {
    const { container } = await renderIndex();
    const sections = container.querySelectorAll('section[aria-labelledby]');
    expect(sections.length).toBeGreaterThanOrEqual(1);
  });

  // --- Infrastructure ---

  it('infra_index_metadata_export', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Cohorts');
  });

  it('infra_index_metadata_description', () => {
    expect(metadata.description).toMatch(/cohort/i);
  });
});
