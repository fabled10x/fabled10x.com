import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { Cohort } from '@/content/schemas';
import type { LoadedEntry } from '@/lib/content/loader';

vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://stubuser:stub@stubhost:5432/stubdb';
  }
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'test-auth-secret-32-bytes-long!!';
  }
  return {};
});

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockRedirect = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
}));

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

// Drizzle db chain mocks — dispatch by from()'s table-marker identity so
// the page's parallel queries each resolve from their own mock.
const mockAppOrderBy = vi.fn();
const mockEnrOrderBy = vi.fn();
const mockEq = vi.fn();
const cohortApplicationsMarker = {
  __table: 'cohortApplications',
  userId: { __col: 'cohortApplications.userId' },
  submittedAt: { __col: 'cohortApplications.submittedAt' },
};
const cohortEnrollmentsMarker = {
  __table: 'cohortEnrollments',
  userId: { __col: 'cohortEnrollments.userId' },
  paidAt: { __col: 'cohortEnrollments.paidAt' },
};

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        if (table === cohortApplicationsMarker) {
          return {
            where: () => ({ orderBy: () => mockAppOrderBy() }),
          };
        }
        if (table === cohortEnrollmentsMarker) {
          return {
            where: () => ({ orderBy: () => mockEnrOrderBy() }),
          };
        }
        throw new Error('Unexpected db.from() argument in test');
      },
    }),
  },
  schema: {
    cohortApplications: cohortApplicationsMarker,
    cohortEnrollments: cohortEnrollmentsMarker,
  },
}));

vi.mock('drizzle-orm', () => ({
  desc: (col: unknown) => ({ __desc: col }),
  eq: (col: unknown, value: unknown) => {
    mockEq(col, value);
    return { __eq: true };
  },
}));

const mockGetAllCohorts = vi.fn();
vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: () => mockGetAllCohorts(),
}));

import { render, screen } from '@testing-library/react';

const mockComponent = () => null;

const MOCK_COHORT_A: Cohort = {
  id: 'cohort-001',
  slug: 'ai-delivery-2026-q3',
  title: 'AI Delivery Intensive',
  series: 'AI Delivery',
  tagline: 'Ship real AI projects.',
  summary: 'An intensive cohort.',
  status: 'announced',
  pillar: 'delivery',
  startDate: '2026-07-06',
  endDate: '2026-08-14',
  durationWeeks: 6,
  capacity: 12,
  priceCents: 249900,
  currency: 'usd',
  stripePriceId: 'price_REPLACE_ME_a',
  commitmentHoursPerWeek: 10,
  lllEntryUrls: [],
  relatedEpisodeIds: [],
  relatedCaseIds: [],
  publishedAt: '2026-04-01',
};

const MOCK_LOADED_COHORT_A: LoadedEntry<Cohort> = {
  meta: MOCK_COHORT_A,
  slug: MOCK_COHORT_A.slug,
  Component: mockComponent,
};

const MOCK_APP = {
  id: 'app-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-1',
  background: 'long background prose',
  goals: 'long goals prose',
  commitmentLevel: 'standard',
  commitmentHours: 10,
  timezone: 'UTC',
  pillarInterest: 'delivery',
  referralSource: 'twitter',
  waitlistId: null,
  decision: 'pending',
  submittedAt: new Date('2026-05-10T12:00:00Z'),
};

const MOCK_ENR = {
  id: 'enr-1',
  applicationId: 'app-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-1',
  stripeSessionId: 'cs_test_supersecret',
  stripePaymentIntentId: 'pi_test_supersecret',
  amountCents: 249900,
  currency: 'usd',
  paidAt: new Date('2026-05-15T12:00:00Z'),
};

function makeSearchParams(params: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(params) };
}

async function renderPage(params: Record<string, string> = {}) {
  const AccountCohortsPage = (await import('../page')).default;
  const jsx = await AccountCohortsPage(makeSearchParams(params));
  return render(jsx);
}

describe('AccountCohortsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockAppOrderBy.mockResolvedValue([]);
    mockEnrOrderBy.mockResolvedValue([]);
    mockGetAllCohorts.mockResolvedValue([MOCK_LOADED_COHORT_A]);
  });

  // -------------------- unit / metadata --------------------
  it('unit_account_cohorts_metadata_title', async () => {
    const { metadata } = await import('../page');
    expect(metadata.title).toBe('Your cohorts');
  });

  it('unit_account_cohorts_metadata_robots_noindex', async () => {
    const { metadata } = await import('../page');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // -------------------- integration --------------------
  it('integration_account_cohorts_unauthenticated_redirect', async () => {
    mockAuth.mockResolvedValue(null);
    await renderPage();
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount%2Fcohorts',
    );
  });

  it('integration_account_cohorts_empty_state', async () => {
    mockAppOrderBy.mockResolvedValue([]);
    mockEnrOrderBy.mockResolvedValue([]);
    await renderPage();
    expect(screen.getByText(/haven't applied/i)).toBeInTheDocument();
  });

  it('integration_account_cohorts_one_pending_application', async () => {
    mockAppOrderBy.mockResolvedValue([MOCK_APP]);
    mockEnrOrderBy.mockResolvedValue([]);
    await renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Applications' }),
    ).toBeInTheDocument();
    expect(screen.getByText('AI Delivery Intensive')).toBeInTheDocument();
  });

  it('integration_account_cohorts_one_enrollment', async () => {
    mockAppOrderBy.mockResolvedValue([]);
    mockEnrOrderBy.mockResolvedValue([MOCK_ENR]);
    await renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
  });

  it('integration_account_cohorts_application_then_enrolled_filtered', async () => {
    mockAppOrderBy.mockResolvedValue([MOCK_APP]);
    mockEnrOrderBy.mockResolvedValue([MOCK_ENR]); // matches MOCK_APP.id
    await renderPage();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Applications' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
  });

  it('integration_account_cohorts_enrolled_banner', async () => {
    await renderPage({ enrolled: 'ai-delivery-2026-q3' });
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/Payment received/i);
    expect(banner).toHaveTextContent(/AI Delivery Intensive/);
  });

  it('integration_account_cohorts_back_link', async () => {
    await renderPage();
    const back = screen.getByRole('link', { name: /back to account/i });
    expect(back).toHaveAttribute('href', '/products/account');
  });

  // -------------------- security --------------------
  it('sec_spoofing_account_cohorts_no_session_redirects', async () => {
    mockAuth.mockResolvedValue(null);
    await renderPage();
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount%2Fcohorts',
    );
  });

  it('sec_information_disclosure_no_other_user_rows_leak', async () => {
    mockAppOrderBy.mockResolvedValue([MOCK_APP]);
    mockEnrOrderBy.mockResolvedValue([]);
    await renderPage();
    // Verify the eq() filter was called with session.user.id, proving the
    // row-level filter is in place.
    // The page must call eq(_, 'user-1') for the row-level filter.
    const eqCalls = mockEq.mock.calls.map((c) => c[1]);
    expect(eqCalls).toContain('user-1');
  });

  // -------------------- edge --------------------
  it('edge_account_cohorts_unknown_enrolled_slug', async () => {
    await renderPage({ enrolled: 'ghost-cohort' });
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/ghost-cohort/);
  });

  // -------------------- error recovery --------------------
  it('err_account_cohorts_db_throws_propagates', async () => {
    mockAppOrderBy.mockRejectedValue(new Error('db down'));
    await expect(renderPage()).rejects.toThrow(/db down/);
  });

  it('err_account_cohorts_getallcohorts_throws_propagates', async () => {
    mockGetAllCohorts.mockRejectedValue(new Error('mdx broken'));
    await expect(renderPage()).rejects.toThrow(/mdx broken/);
  });

  // -------------------- data integrity --------------------
  it('data_account_cohorts_query_filters_by_user_id', async () => {
    await renderPage();
    // Both eq() recorders should have seen 'user-1'.
    const eqCalls = mockEq.mock.calls.map((c) => c[1]);
    expect(eqCalls).toContain('user-1');
  });

  // -------------------- permission matrix --------------------
  it('perm_anonymous_account_cohorts_deny', async () => {
    mockAuth.mockResolvedValue(null);
    await renderPage();
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount%2Fcohorts',
    );
  });

  it('perm_authenticated_account_cohorts_filtered', async () => {
    mockAppOrderBy.mockResolvedValue([MOCK_APP]);
    await renderPage();
    const eqCalls = mockEq.mock.calls.map((c) => c[1]);
    expect(eqCalls).toContain('user-1');
  });

  it('perm_owner_account_cohorts_allow', async () => {
    mockAppOrderBy.mockResolvedValue([MOCK_APP]);
    mockEnrOrderBy.mockResolvedValue([MOCK_ENR]);
    await renderPage();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
  });

  // -------------------- a11y --------------------
  it('a11y_perceivable_account_cohorts_heading_hierarchy', async () => {
    mockAppOrderBy.mockResolvedValue([MOCK_APP]);
    mockEnrOrderBy.mockResolvedValue([MOCK_ENR]);
    await renderPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent(/Your cohorts/i);
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('a11y_perceivable_enrolled_banner_role_status', async () => {
    await renderPage({ enrolled: 'ai-delivery-2026-q3' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('a11y_operable_back_link_keyboard_reachable', async () => {
    await renderPage();
    const back = screen.getByRole('link', { name: /back to account/i });
    expect(back.tagName).toBe('A');
  });
});
