// Cohorts index (styling-overhaul-7.5) — brand-aware assertions.
//
// Hybrid red posture (so-7.3/7.4 precedent): preserves data-flow + bucket
// structure pins (getCohortBuckets, upcoming/archived sections, CohortCard
// per <li>, newsletter CTA on empty upcoming, metadata export) and adds
// brand-surface pins (Marble mount, .label/.display-1/.body-1 utilities,
// Section rhythm via @/components/brand) plus source-grep banned-token
// sentinel.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
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
import { describe, it, expect, beforeEach } from 'vitest';
import { getCohortBuckets } from '@/lib/content/cohorts';
import CohortsIndexPage, { metadata } from '../page';

const mockGetCohortBuckets = vi.mocked(getCohortBuckets);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-muted',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'bg-marble-texture',
  'border-mist',
  'rounded-md',
  'rounded-lg',
  'text-link',
  'text-accent',
  'bg-accent',
  'divide-mist',
];

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
    Component: () => null,
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
    Component: () => null,
  },
];

const MOCK_ARCHIVED_COHORT = {
  ...MOCK_UPCOMING[0],
  meta: {
    ...MOCK_UPCOMING[0].meta,
    id: 'cohort-archived-001',
    slug: 'archived-cohort',
    title: 'Archived Cohort',
    status: 'shipped' as const,
  },
  slug: 'archived-cohort',
};

async function renderCohortsIndex() {
  const jsx = await CohortsIndexPage();
  return render(jsx);
}

describe('CohortsIndexPage (styling-overhaul-7.5) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: MOCK_UPCOMING,
      archived: [],
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — page chrome
  // ────────────────────────────────────────────────────────────────

  it('unit_cohorts_index_marble_mount: page renders within Marble surface (bg-(--color-marble))', async () => {
    const { container } = await renderCohortsIndex();
    const marble = container.querySelector('.bg-\\(--color-marble\\)');
    expect(marble).toBeInTheDocument();
  });

  it("unit_cohorts_index_label_kicker_cohorts: .label kicker reads 'Cohorts'", async () => {
    await renderCohortsIndex();
    const kicker = screen.getByText('Cohorts');
    expect(kicker).toBeInTheDocument();
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  it('unit_cohorts_index_display_1_title: h1 uses .display-1 brand utility', async () => {
    await renderCohortsIndex();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
  });

  it('unit_cohorts_index_body_1_subtitle_muted: subtitle uses .body-1 with text-(--color-muted)', async () => {
    const { container } = await renderCohortsIndex();
    const bodyParas = container.querySelectorAll('p.body-1');
    expect(bodyParas.length).toBeGreaterThanOrEqual(1);
    const muted = Array.from(bodyParas).find((p) =>
      /text-\(--color-muted\)/.test(p.className),
    );
    expect(muted).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — bucket grids (preserved)
  // ────────────────────────────────────────────────────────────────

  it('unit_cohorts_index_upcoming_grid_preserved: Upcoming h2 + one <li> per upcoming entry', async () => {
    const { container } = await renderCohortsIndex();
    const h2 = screen.getByRole('heading', { level: 2, name: 'Upcoming' });
    expect(h2).toBeInTheDocument();
    expect(h2.getAttribute('id')).toBe('upcoming-heading');
    const cards = container.querySelectorAll('[data-testid="cohort-card"]');
    expect(cards).toHaveLength(MOCK_UPCOMING.length);
    const upcomingSection = container.querySelector(
      'section[aria-labelledby="upcoming-heading"]',
    );
    expect(upcomingSection).not.toBeNull();
    const lis = upcomingSection!.querySelectorAll('li');
    expect(lis).toHaveLength(MOCK_UPCOMING.length);
  });

  it('unit_cohorts_index_archived_grid_preserved: Past cohorts h2 + grid when archived.length > 0', async () => {
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: MOCK_UPCOMING,
      archived: [MOCK_ARCHIVED_COHORT],
    });
    const { container } = await renderCohortsIndex();
    const h2 = screen.getByRole('heading', { level: 2, name: 'Past cohorts' });
    expect(h2).toBeInTheDocument();
    expect(h2.getAttribute('id')).toBe('archived-heading');
    const archivedSection = container.querySelector(
      'section[aria-labelledby="archived-heading"]',
    );
    expect(archivedSection).not.toBeNull();
    const lis = archivedSection!.querySelectorAll('li');
    expect(lis).toHaveLength(1);
  });

  it('unit_cohorts_index_empty_upcoming_preserved: empty upcoming renders newsletter CTA without placeholder rounded-md border-mist', async () => {
    mockGetCohortBuckets.mockResolvedValue({ upcoming: [], archived: [] });
    const { container } = await renderCohortsIndex();
    expect(screen.getByText(/No upcoming cohorts/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /Join the newsletter/i });
    expect(link).toHaveAttribute('href', '/#email-capture');
    const upcomingSection = container.querySelector(
      'section[aria-labelledby="upcoming-heading"]',
    );
    expect(upcomingSection).not.toBeNull();
    // Fallback wrapper must not use the placeholder tokens
    const fallback = upcomingSection!.querySelector(
      '.rounded-md.border.border-mist',
    );
    expect(fallback).toBeNull();
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it('a11y_cohorts_index_section_labelled_by: each <section> has aria-labelledby pointing at its h2 id', async () => {
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: MOCK_UPCOMING,
      archived: [MOCK_ARCHIVED_COHORT],
    });
    const { container } = await renderCohortsIndex();
    const sections = container.querySelectorAll('section[aria-labelledby]');
    expect(sections.length).toBeGreaterThanOrEqual(2);
    for (const section of Array.from(sections)) {
      const id = section.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      const target = container.querySelector(`#${CSS.escape(id!)}`);
      expect(target).not.toBeNull();
      expect(target!.tagName.toLowerCase()).toBe('h2');
    }
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels
  // ────────────────────────────────────────────────────────────────

  it('infra_cohorts_index_no_placeholder_tokens: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_cohorts_index_brand_imports: page imports Marble + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it('edge_cohorts_index_empty_upcoming: empty upcoming → /#email-capture link + no banned utilities on fallback DOM', async () => {
    mockGetCohortBuckets.mockResolvedValue({ upcoming: [], archived: [] });
    const { container } = await renderCohortsIndex();
    const link = screen.getByRole('link', { name: /Join the newsletter/i });
    expect(link).toHaveAttribute('href', '/#email-capture');
    // No placeholder tokens on fallback wrapper
    const upcomingSection = container.querySelector(
      'section[aria-labelledby="upcoming-heading"]',
    );
    expect(upcomingSection).not.toBeNull();
    const html = upcomingSection!.innerHTML;
    expect(html).not.toMatch(/\bborder-mist\b/);
    expect(html).not.toMatch(/\brounded-md\b/);
    expect(html).not.toMatch(/\btext-link\b/);
  });

  it('edge_cohorts_index_no_archived: archived=[] → no Past cohorts h2', async () => {
    mockGetCohortBuckets.mockResolvedValue({
      upcoming: MOCK_UPCOMING,
      archived: [],
    });
    await renderCohortsIndex();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Past cohorts' }),
    ).not.toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // Metadata (preserved)
  // ────────────────────────────────────────────────────────────────

  it("infra_cohorts_index_metadata_preserved: metadata.title === 'Cohorts' preserved", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Cohorts');
    expect(metadata.description).toMatch(/cohort/i);
  });
});
