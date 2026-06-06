import { vi, describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Cohort } from '@/content/schemas';
import type {
  CohortApplicationRow,
  CohortEnrollmentRow,
} from '@/db/schema';

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

import { CohortList } from '../CohortList';

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
  stripePriceId: 'price_REPLACE_ME_ai_delivery',
  commitmentHoursPerWeek: 10,
  lllEntryUrls: [],
  relatedEpisodeIds: [],
  relatedCaseIds: [],
  publishedAt: '2026-04-01',
};

const MOCK_COHORT_B: Cohort = {
  ...MOCK_COHORT_A,
  id: 'cohort-002',
  slug: 'workflow-mastery-2026-q4',
  title: 'Workflow Mastery',
  status: 'open',
  pillar: 'workflow',
  startDate: '2026-10-05',
  endDate: '2026-11-27',
  durationWeeks: 8,
  priceCents: 349900,
  commitmentHoursPerWeek: 12,
};

function makeApp(
  overrides: Partial<CohortApplicationRow> = {},
): CohortApplicationRow {
  return {
    id: 'app-1',
    cohortSlug: 'ai-delivery-2026-q3',
    userId: 'user-1',
    background: 'long background prose that should never render here',
    goals: 'long goals prose that should never render here',
    commitmentLevel: 'standard',
    commitmentHours: 10,
    timezone: 'UTC',
    pillarInterest: 'delivery',
    referralSource: 'referral source string',
    waitlistId: null,
    decision: 'pending',
    submittedAt: new Date('2026-05-10T12:00:00Z'),
    ...overrides,
  } as CohortApplicationRow;
}

function makeEnr(
  overrides: Partial<CohortEnrollmentRow> = {},
): CohortEnrollmentRow {
  return {
    id: 'enr-1',
    applicationId: 'app-1',
    cohortSlug: 'ai-delivery-2026-q3',
    userId: 'user-1',
    stripeSessionId: 'cs_test_supersecret_DO_NOT_LEAK',
    stripePaymentIntentId: 'pi_test_supersecret_DO_NOT_LEAK',
    amountCents: 249900,
    currency: 'usd',
    paidAt: new Date('2026-05-15T12:00:00Z'),
    ...overrides,
  } as CohortEnrollmentRow;
}

function makeCohortsBySlug(...cohorts: Cohort[]): Map<string, Cohort> {
  return new Map(cohorts.map((c) => [c.slug, c]));
}

describe('CohortList', () => {
  // -------------------- unit --------------------
  it('unit_cohortlist_empty_state', () => {
    render(
      <CohortList
        applications={[]}
        enrollments={[]}
        cohortsBySlug={makeCohortsBySlug()}
      />,
    );
    expect(screen.getByText(/haven't applied/i)).toBeInTheDocument();
    const link = screen.getByRole('link', { name: /open cohorts/i });
    expect(link).toHaveAttribute('href', '/cohorts');
  });

  it('unit_cohortlist_enrolled_section', () => {
    render(
      <CohortList
        applications={[]}
        enrollments={[makeEnr()]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
    expect(screen.getByText('AI Delivery Intensive')).toBeInTheDocument();
    expect(screen.getByText(/Paid/i)).toBeInTheDocument();
    expect(screen.getByText(/2499/)).toBeInTheDocument();
    expect(screen.getByText(/USD/)).toBeInTheDocument();
  });

  it('unit_cohortlist_applications_section', () => {
    render(
      <CohortList
        applications={[makeApp()]}
        enrollments={[]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Applications' }),
    ).toBeInTheDocument();
    expect(screen.getByText('AI Delivery Intensive')).toBeInTheDocument();
    expect(screen.getByText(/Submitted/i)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
  });

  it('unit_cohortlist_paid_application_filter', () => {
    const app = makeApp({ id: 'app-paid' });
    const enr = makeEnr({ id: 'enr-paid', applicationId: 'app-paid' });
    render(
      <CohortList
        applications={[app]}
        enrollments={[enr]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Applications' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
  });

  it('unit_cohortlist_unknown_slug_fallback', () => {
    const app = makeApp({ cohortSlug: 'ghost-cohort' });
    render(
      <CohortList
        applications={[app]}
        enrollments={[]}
        cohortsBySlug={makeCohortsBySlug()}
      />,
    );
    expect(screen.getByText('ghost-cohort')).toBeInTheDocument();
  });

  it('unit_cohortlist_format_date_iso_string', () => {
    const app = makeApp({
      submittedAt: '2026-05-10' as unknown as Date,
    });
    render(
      <CohortList
        applications={[app]}
        enrollments={[]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(screen.getByText(/May 10, 2026/)).toBeInTheDocument();
  });

  // -------------------- security / info disclosure --------------------
  it('sec_information_disclosure_no_stripe_ids_in_dom', () => {
    const { container } = render(
      <CohortList
        applications={[]}
        enrollments={[
          makeEnr({
            stripeSessionId: 'cs_test_supersecret_DO_NOT_LEAK',
            stripePaymentIntentId: 'pi_test_supersecret_DO_NOT_LEAK',
          }),
        ]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(container.innerHTML).not.toMatch(/cs_test_supersecret/);
    expect(container.innerHTML).not.toMatch(/pi_test_supersecret/);
  });

  // -------------------- edge cases --------------------
  it('edge_cohortlist_only_enrollments_no_applications', () => {
    render(
      <CohortList
        applications={[]}
        enrollments={[makeEnr()]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Applications' }),
    ).not.toBeInTheDocument();
  });

  it('edge_cohortlist_all_applications_paid', () => {
    render(
      <CohortList
        applications={[makeApp({ id: 'A' })]}
        enrollments={[makeEnr({ id: 'E', applicationId: 'A' })]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Applications' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
  });

  it('edge_cohortlist_multiple_applications_one_enrolled', () => {
    const apps = [
      makeApp({ id: 'A', cohortSlug: MOCK_COHORT_A.slug }),
      makeApp({ id: 'B', cohortSlug: MOCK_COHORT_B.slug }),
      makeApp({ id: 'C', cohortSlug: MOCK_COHORT_A.slug }),
    ];
    const enrs = [
      makeEnr({ id: 'enr-B', applicationId: 'B', cohortSlug: MOCK_COHORT_B.slug }),
    ];
    render(
      <CohortList
        applications={apps}
        enrollments={enrs}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A, MOCK_COHORT_B)}
      />,
    );
    expect(
      screen.getByRole('heading', { level: 2, name: 'Enrolled' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Applications' }),
    ).toBeInTheDocument();
    // Enrolled section shows cohort B title
    expect(screen.getByText('Workflow Mastery')).toBeInTheDocument();
    // Applications section shows two cohort A titles (A + C apps both reference A)
    const aTitles = screen.getAllByText('AI Delivery Intensive');
    expect(aTitles.length).toBeGreaterThanOrEqual(2);
  });

  // -------------------- data integrity --------------------
  it('data_cohortlist_render_boundary_no_sensitive_fields', () => {
    const { container } = render(
      <CohortList
        applications={[
          makeApp({
            background: 'PRIVATE_BACKGROUND_DO_NOT_LEAK',
            goals: 'PRIVATE_GOALS_DO_NOT_LEAK',
            referralSource: 'PRIVATE_REFERRAL_DO_NOT_LEAK',
          }),
        ]}
        enrollments={[
          makeEnr({
            stripeSessionId: 'cs_test_PRIVATE_DO_NOT_LEAK',
            stripePaymentIntentId: 'pi_test_PRIVATE_DO_NOT_LEAK',
          }),
        ]}
        cohortsBySlug={makeCohortsBySlug(MOCK_COHORT_A)}
      />,
    );
    expect(container.innerHTML).not.toMatch(/PRIVATE_BACKGROUND/);
    expect(container.innerHTML).not.toMatch(/PRIVATE_GOALS/);
    expect(container.innerHTML).not.toMatch(/PRIVATE_REFERRAL/);
    expect(container.innerHTML).not.toMatch(/cs_test_PRIVATE/);
    expect(container.innerHTML).not.toMatch(/pi_test_PRIVATE/);
  });

  // -------------------- a11y --------------------
  it('a11y_perceivable_empty_state_link_to_cohorts', () => {
    render(
      <CohortList
        applications={[]}
        enrollments={[]}
        cohortsBySlug={makeCohortsBySlug()}
      />,
    );
    const link = screen.getByRole('link', { name: /open cohorts/i });
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/cohorts');
  });
});
