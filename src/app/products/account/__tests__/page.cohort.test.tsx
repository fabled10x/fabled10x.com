import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Product, Cohort } from '@/content/schemas';

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

// Dispatch db chain by table marker so each parallel query returns its own mock.
const mockPurchasesOrderBy = vi.fn();
const mockAppWhere = vi.fn();
const mockEnrWhere = vi.fn();
const purchasesMarker = { __table: 'purchases', userId: '_', purchasedAt: '_' };
const cohortApplicationsMarker = { __table: 'cohortApplications', userId: '_' };
const cohortEnrollmentsMarker = { __table: 'cohortEnrollments', userId: '_' };

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        if (table === purchasesMarker) {
          return {
            where: () => ({ orderBy: () => mockPurchasesOrderBy() }),
          };
        }
        if (table === cohortApplicationsMarker) {
          return { where: () => mockAppWhere() };
        }
        if (table === cohortEnrollmentsMarker) {
          return { where: () => mockEnrWhere() };
        }
        throw new Error('Unexpected db.from() argument in page.cohort.test');
      },
    }),
  },
  schema: {
    purchases: purchasesMarker,
    cohortApplications: cohortApplicationsMarker,
    cohortEnrollments: cohortEnrollmentsMarker,
  },
}));

vi.mock('drizzle-orm', () => ({
  desc: (col: unknown) => ({ __desc: col }),
  eq: () => ({ __eq: true }),
}));

const mockGetAllProducts = vi.fn();
vi.mock('@/lib/content/products', () => ({
  getAllProducts: () => mockGetAllProducts(),
}));

const mockGetAllCohorts = vi.fn();
vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: () => mockGetAllCohorts(),
}));

vi.mock('@/components/account/PurchaseList', () => ({
  PurchaseList: ({ purchases }: { purchases: unknown[] }) => (
    <div data-testid="purchase-list" data-count={purchases.length}>
      {purchases.length === 0 ? 'No purchases' : `${purchases.length} purchases`}
    </div>
  ),
}));

vi.mock('@/components/account/SignOutButton', () => ({
  SignOutButton: () => <button data-testid="sign-out-button">Sign out</button>,
}));

// CohortList stub — surface the props as data-attrs so we can assert visibility.
vi.mock('@/components/account/CohortList', () => ({
  CohortList: ({
    applications,
    enrollments,
  }: {
    applications: unknown[];
    enrollments: unknown[];
  }) => (
    <div
      data-testid="cohort-list-stub"
      data-app-count={applications.length}
      data-enr-count={enrollments.length}
    />
  ),
}));

import { render, screen } from '@testing-library/react';

const mockComponent: ComponentType = () => null;

const MOCK_PRODUCT: LoadedEntry<Product> = {
  meta: {
    id: 'prod-wf',
    slug: 'workflow-templates',
    title: 'Agent Workflow Templates',
    tagline: 'Ship faster.',
    summary: 'Summary.',
    category: 'workflow-templates',
    licenseType: 'single-user',
    priceCents: 4900,
    currency: 'usd',
    stripePriceId: 'price_wf',
    assetFilename: 'workflow-templates.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'workflow-templates',
  Component: mockComponent,
};

const MOCK_COHORT_A: Cohort = {
  id: 'cohort-001',
  slug: 'ai-delivery-2026-q3',
  title: 'AI Delivery Intensive',
  series: 'AI Delivery',
  tagline: '',
  summary: '',
  status: 'announced',
  pillar: 'delivery',
  startDate: '2026-07-06',
  endDate: '2026-08-14',
  durationWeeks: 6,
  capacity: 12,
  priceCents: 249900,
  currency: 'usd',
  stripePriceId: 'price_REPLACE_ME',
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
  decision: 'pending',
  submittedAt: new Date('2026-05-10T12:00:00Z'),
};

const MOCK_ENR = {
  id: 'enr-1',
  applicationId: 'app-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-1',
  amountCents: 249900,
  currency: 'usd',
  paidAt: new Date('2026-05-15T12:00:00Z'),
};

function makeSearchParams(params: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(params) };
}

async function renderAccountPage(params: Record<string, string> = {}) {
  const AccountPage = (await import('../page')).default;
  const jsx = await AccountPage(makeSearchParams(params));
  return render(jsx);
}

describe('AccountPage — My cohorts card', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockPurchasesOrderBy.mockResolvedValue([]);
    mockAppWhere.mockResolvedValue([]);
    mockEnrWhere.mockResolvedValue([]);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT]);
    mockGetAllCohorts.mockResolvedValue([MOCK_LOADED_COHORT_A]);
  });

  it('integration_account_overview_card_visible_with_activity', async () => {
    mockAppWhere.mockResolvedValue([MOCK_APP]);
    await renderAccountPage();
    expect(
      screen.getByRole('heading', { level: 2, name: /My cohorts/i }),
    ).toBeInTheDocument();
    const viewAll = screen.getByRole('link', { name: /view all/i });
    expect(viewAll).toHaveAttribute('href', '/products/account/cohorts');
    expect(screen.getByTestId('cohort-list-stub')).toBeInTheDocument();
  });

  it('integration_account_overview_card_hidden_no_activity', async () => {
    mockAppWhere.mockResolvedValue([]);
    mockEnrWhere.mockResolvedValue([]);
    await renderAccountPage();
    expect(
      screen.queryByRole('heading', { level: 2, name: /My cohorts/i }),
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('cohort-list-stub')).not.toBeInTheDocument();
  });

  it('integration_account_overview_card_before_purchases', async () => {
    mockEnrWhere.mockResolvedValue([MOCK_ENR]);
    const { container } = await renderAccountPage();
    const headings = Array.from(
      container.querySelectorAll<HTMLHeadingElement>('h2'),
    ).map((h) => h.textContent ?? '');
    const cohortsIdx = headings.findIndex((t) => /My cohorts/i.test(t));
    const purchasesIdx = headings.findIndex((t) => /Purchases/i.test(t));
    expect(cohortsIdx).toBeGreaterThanOrEqual(0);
    expect(purchasesIdx).toBeGreaterThanOrEqual(0);
    expect(cohortsIdx).toBeLessThan(purchasesIdx);
  });

  it('a11y_operable_view_all_link_keyboard_reachable', async () => {
    mockAppWhere.mockResolvedValue([MOCK_APP]);
    await renderAccountPage();
    const viewAll = screen.getByRole('link', { name: /view all/i });
    expect(viewAll.tagName).toBe('A');
    expect(viewAll).toHaveAttribute('href', '/products/account/cohorts');
  });
});
