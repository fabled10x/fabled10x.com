import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  redirect: vi.fn(),
}));

vi.mock('@/lib/content/cohorts', () => ({
  getCohortBySlug: vi.fn(),
}));

vi.mock('@/auth', () => ({
  auth: vi.fn(),
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...args: unknown[]) => ({ _op: 'and', args }),
}));

const {
  mockSelect,
  mockSelectFrom,
  mockSelectWhere,
  mockSelectLimit,
} = vi.hoisted(() => {
  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn(() => ({ limit: mockSelectLimit }));
  const mockSelectFrom = vi.fn(() => ({ where: mockSelectWhere }));
  const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));
  return { mockSelect, mockSelectFrom, mockSelectWhere, mockSelectLimit };
});

vi.mock('@/db/client', () => ({
  db: { select: mockSelect },
  schema: {
    cohortApplications: {
      id: { name: 'id' },
      cohortSlug: { name: 'cohort_slug' },
      userId: { name: 'user_id' },
    },
  },
}));

vi.mock('@/components/cohorts/CohortDetailHero', () => ({
  CohortDetailHero: ({ cohort }: { cohort: { title: string } }) => (
    <div data-testid="cohort-detail-hero">{cohort.title}</div>
  ),
}));

vi.mock('@/components/cohorts/ApplicationForm', () => ({
  ApplicationForm: ({ cohortSlug }: { cohortSlug: string }) => (
    <div data-testid="application-form" data-cohort-slug={cohortSlug}>
      ApplicationForm
    </div>
  ),
}));

import { notFound, redirect } from 'next/navigation';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { auth } from '@/auth';

import ApplyPage, { metadata } from '../page';

const mockGetCohortBySlug = vi.mocked(getCohortBySlug);
const mockAuth = vi.mocked(auth);
const mockNotFound = vi.mocked(notFound);
const mockRedirect = vi.mocked(redirect);

const MOCK_COHORT_OPEN = {
  meta: {
    id: 'cohort-001',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    summary: 'Ship real AI projects in 6 weeks.',
    series: 'AI Delivery',
    tagline: 'tagline',
    status: 'open' as const,
    pillar: 'delivery' as const,
    startDate: '2026-09-14',
    endDate: '2026-10-26',
    durationWeeks: 6,
    capacity: 12,
    priceCents: 249900,
    currency: 'usd',
    stripePriceId: 'price_REPLACE_ME_ai_delivery',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'ai-delivery-2026-q3',
  Component: () => null,
};

const MOCK_COHORT_ANNOUNCED = {
  ...MOCK_COHORT_OPEN,
  meta: { ...MOCK_COHORT_OPEN.meta, status: 'announced' as const },
};

const MOCK_COHORT_CLOSED = {
  ...MOCK_COHORT_OPEN,
  meta: { ...MOCK_COHORT_OPEN.meta, status: 'closed' as const },
};

const VALID_SESSION = {
  user: { id: 'user-1', email: 'applicant@example.com' },
} as Awaited<ReturnType<typeof auth>>;

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderApply(slug = 'ai-delivery-2026-q3') {
  const jsx = await ApplyPage(makeParams(slug));
  if (jsx === undefined) return null;
  return render(jsx);
}

describe('ApplyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockSelectWhere.mockClear();
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValue([]); // no existing application
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_OPEN);
    mockAuth.mockResolvedValue(VALID_SESSION);
  });

  // --- Unit ---

  it('unit_apply_page_metadata_robots_is_noindex', () => {
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots).toBeDefined();
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it('unit_apply_page_renders_signed_in_email', async () => {
    await renderApply();
    expect(screen.getByText(/applicant@example\.com/i)).toBeInTheDocument();
  });

  it('unit_apply_page_renders_cohort_detail_hero', async () => {
    await renderApply();
    expect(screen.getByTestId('cohort-detail-hero')).toBeInTheDocument();
  });

  // --- Integration ---

  it('integration_apply_page_unknown_slug_calls_not_found', async () => {
    mockGetCohortBySlug.mockResolvedValueOnce(null);
    // notFound() throws/short-circuits; in our mock it doesn't throw, so
    // the page may return undefined or render nothing.
    await ApplyPage(makeParams('nonexistent')).catch(() => undefined);
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('integration_apply_page_no_session_redirects_to_login', async () => {
    mockAuth.mockResolvedValueOnce(null);
    await ApplyPage(makeParams('ai-delivery-2026-q3')).catch(() => undefined);
    expect(mockRedirect).toHaveBeenCalled();
    const calledWith = mockRedirect.mock.calls[0]?.[0] as string | undefined;
    expect(calledWith).toContain('/login');
    expect(calledWith).toContain('callbackUrl');
    expect(calledWith).toContain('%2Fcohorts%2Fai-delivery-2026-q3%2Fapply');
  });

  it('integration_apply_page_status_announced_renders_not_open_panel', async () => {
    mockGetCohortBySlug.mockResolvedValueOnce(MOCK_COHORT_ANNOUNCED);
    await renderApply();
    expect(
      screen.getByText(/not currently open|applications.*not.*open/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('application-form')).not.toBeInTheDocument();
  });

  it('integration_apply_page_status_closed_renders_not_open_panel', async () => {
    mockGetCohortBySlug.mockResolvedValueOnce(MOCK_COHORT_CLOSED);
    await renderApply();
    expect(
      screen.getByText(/not currently open|applications.*not.*open/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('application-form')).not.toBeInTheDocument();
  });

  it('integration_apply_page_existing_application_renders_already_applied', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'existing-app-uuid' }]);
    await renderApply();
    expect(
      screen.getByText(/already applied|you've applied|application.*on file/i),
    ).toBeInTheDocument();
    expect(screen.queryByTestId('application-form')).not.toBeInTheDocument();
  });

  it('integration_apply_page_renders_application_form_when_open_no_existing', async () => {
    await renderApply();
    const form = screen.getByTestId('application-form');
    expect(form).toBeInTheDocument();
    expect(form.getAttribute('data-cohort-slug')).toBe('ai-delivery-2026-q3');
  });

  // --- Security ---

  it('sec_information_disclosure_apply_page_robots_noindex', () => {
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  it('sec_elevation_apply_page_redirects_unauthenticated_defense_in_depth', async () => {
    mockAuth.mockResolvedValueOnce(null);
    await ApplyPage(makeParams('ai-delivery-2026-q3')).catch(() => undefined);
    expect(mockRedirect).toHaveBeenCalled();
  });

  // --- Permission ---

  it('perm_owner_filter_existing_application_lookup_uses_session_user_id', async () => {
    await renderApply();
    // The select chain was called and where() received an argument that
    // references the session user id.
    expect(mockSelect).toHaveBeenCalled();
    const whereArg = mockSelectWhere.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized).toContain('user-1');
  });

  // --- Edge ---

  it('edge_state_existing_application_before_submit', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'existing-uuid' }]);
    await renderApply();
    expect(screen.queryByTestId('application-form')).not.toBeInTheDocument();
  });

  it('edge_input_callback_url_special_chars_encoded', async () => {
    mockAuth.mockResolvedValueOnce(null);
    await ApplyPage(makeParams('lll-launch-cohort-1')).catch(() => undefined);
    const calledWith = mockRedirect.mock.calls[0]?.[0] as string | undefined;
    expect(calledWith).toContain('%2Fcohorts%2Flll-launch-cohort-1%2Fapply');
  });

  // --- Error Recovery ---

  it('err_db_select_failure_in_apply_page_throws_500', async () => {
    mockSelectLimit.mockRejectedValueOnce(new Error('PG connection refused'));
    await expect(
      ApplyPage(makeParams('ai-delivery-2026-q3')),
    ).rejects.toThrow();
  });

  // --- Accessibility ---

  it('a11y_apply_page_has_heading', async () => {
    await renderApply();
    const heading = screen.getByRole('heading', { level: 2 });
    expect(heading.textContent).toMatch(/application|your application/i);
  });

  // --- Infrastructure ---

  it('infra_apply_page_has_dynamic_params_false', async () => {
    const mod = await import('../page');
    expect(mod.dynamicParams).toBe(false);
    expect(typeof mod.generateStaticParams).toBe('function');
  });
});
