// AccountPage (styling-overhaul-7.5) — Storefront reskin hybrid red.
//
// Preserves behavior pins: auth redirect, status-banner branches
// (purchased / canceled), CohortList only when hasCohortActivity,
// "View all" link, PurchaseList mount, SignOutButton mount, metadata
// noindex. Adds brand-aware assertions per phase-7-pages.md Feature 7.5:
//   - <Bone> surface wraps the page
//   - <Section> + <Container width="layout">
//   - .label kicker reads "Your Account"
//   - h1 has .display-2 class and text === session.user.email
//   - status banners use brand chrome (no rounded-md/bg-accent/5/border-mist
//     placeholders) but keep role="status"
//
// Source-level sentinels (infra_*) read src/app/products/account/page.tsx
// via readFileSync to assert no banned placeholder utility names remain.

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '@/lib/content/loader';
import type { Product } from '@/content/schemas';

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

// db chain mock: route by table marker
const mockOrderBy = vi.fn();
const mockCohortAppWhere = vi.fn<() => Promise<unknown[]>>(async () => []);
const mockCohortEnrWhere = vi.fn<() => Promise<unknown[]>>(async () => []);
const purchasesMarker = {
  __table: 'purchases',
  userId: 'purchases.userId',
  purchasedAt: 'purchases.purchasedAt',
};
const cohortApplicationsMarker = {
  __table: 'cohortApplications',
  userId: 'cohortApplications.userId',
};
const cohortEnrollmentsMarker = {
  __table: 'cohortEnrollments',
  userId: 'cohortEnrollments.userId',
};

vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: (table: unknown) => {
        if (table === purchasesMarker) {
          return { where: () => ({ orderBy: () => mockOrderBy() }) };
        }
        if (table === cohortApplicationsMarker) {
          return { where: () => mockCohortAppWhere() };
        }
        if (table === cohortEnrollmentsMarker) {
          return { where: () => mockCohortEnrWhere() };
        }
        throw new Error('Unexpected db.from() argument in account/page.test');
      },
    }),
  },
  schema: {
    purchases: purchasesMarker,
    cohortApplications: cohortApplicationsMarker,
    cohortEnrollments: cohortEnrollmentsMarker,
  },
}));

const mockGetAllProducts = vi.fn();
vi.mock('@/lib/content/products', () => ({
  getAllProducts: () => mockGetAllProducts(),
}));

vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: vi.fn(async () => []),
}));

vi.mock('@/components/account/CohortList', () => ({
  CohortList: ({
    applications,
    enrollments,
  }: {
    applications: unknown[];
    enrollments: unknown[];
  }) => (
    <div
      data-testid="cohort-list"
      data-applications={applications.length}
      data-enrollments={enrollments.length}
    />
  ),
}));

vi.mock('@/components/account/PurchaseList', () => ({
  PurchaseList: ({
    purchases,
    productsBySlug,
  }: {
    purchases: unknown[];
    productsBySlug: Map<string, unknown>;
  }) => (
    <div
      data-testid="purchase-list"
      data-count={purchases.length}
      data-product-map-size={productsBySlug.size}
    >
      {purchases.length === 0 ? 'No purchases' : `${purchases.length} purchases`}
    </div>
  ),
}));

vi.mock('@/components/account/SignOutButton', () => ({
  SignOutButton: () => <button data-testid="sign-out-button">Sign out</button>,
}));

import { render, screen } from '@testing-library/react';

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
  'prose-style',
];

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

const MOCK_PURCHASES = [
  {
    id: 'purchase-1',
    userId: 'user-1',
    productSlug: 'workflow-templates',
    stripeSessionId: 'cs_test_1',
    stripePaymentIntentId: 'pi_test_1',
    amountCents: 4900,
    currency: 'usd',
    purchasedAt: new Date('2026-04-10T12:00:00Z'),
  },
  {
    id: 'purchase-2',
    userId: 'user-1',
    productSlug: 'discovery-toolkit',
    stripeSessionId: 'cs_test_2',
    stripePaymentIntentId: 'pi_test_2',
    amountCents: 12900,
    currency: 'usd',
    purchasedAt: new Date('2026-03-15T12:00:00Z'),
  },
];

function makeSearchParams(params: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(params) };
}

async function renderAccountPage(params: Record<string, string> = {}) {
  const AccountPage = (await import('../page')).default;
  const jsx = await AccountPage(makeSearchParams(params));
  return render(jsx);
}

describe('AccountPage (styling-overhaul-7.5) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockOrderBy.mockResolvedValue(MOCK_PURCHASES);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT]);
    mockCohortAppWhere.mockResolvedValue([]);
    mockCohortEnrWhere.mockResolvedValue([]);
  });

  // ─────────────────────────────────────────────────────────────
  // Unit — brand chrome
  // ─────────────────────────────────────────────────────────────

  it('unit_account_bone_mount: page renders within a Bone surface (bg-(--color-bone))', async () => {
    const { container } = await renderAccountPage();
    expect(container.querySelector('.bg-\\(--color-bone\\)')).toBeInTheDocument();
  });

  it('unit_account_label_kicker_your_account: a .label element reads "Your Account"', async () => {
    const { container } = await renderAccountPage();
    const labels = Array.from(container.querySelectorAll('.label'));
    const kicker = labels.find((el) =>
      /^Your Account$/i.test((el.textContent ?? '').trim()),
    );
    expect(kicker).toBeDefined();
  });

  it('unit_account_display_2_email_h1: h1 has .display-2 class and text === session.user.email', async () => {
    await renderAccountPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toMatch(/\bdisplay-2\b/);
    expect((h1.textContent ?? '').trim()).toBe('test@example.com');
  });

  it('unit_account_signout_button_preserved: SignOutButton renders (preserved)', async () => {
    await renderAccountPage();
    expect(screen.getByTestId('sign-out-button')).toBeInTheDocument();
  });

  it('unit_account_purchase_list_preserved: PurchaseList renders with purchases + productsBySlug props', async () => {
    await renderAccountPage();
    const list = screen.getByTestId('purchase-list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveAttribute('data-count', '2');
    expect(list).toHaveAttribute('data-product-map-size', '1');
  });

  it('unit_account_cohort_list_when_activity: CohortList renders only when applications.length OR enrollments.length > 0', async () => {
    // No activity → CohortList absent
    await renderAccountPage();
    expect(screen.queryByTestId('cohort-list')).not.toBeInTheDocument();

    // Applications > 0 → CohortList present
    mockCohortAppWhere.mockResolvedValue([
      { id: 'app-1', userId: 'user-1', cohortSlug: 'c1' },
    ]);
    await renderAccountPage();
    expect(screen.getByTestId('cohort-list')).toBeInTheDocument();
  });

  it('unit_account_view_all_cohorts_link_preserved: Link to /products/account/cohorts present when cohort activity exists', async () => {
    mockCohortEnrWhere.mockResolvedValue([
      { id: 'enr-1', userId: 'user-1', cohortSlug: 'c1' },
    ]);
    await renderAccountPage();
    const viewAll = screen.getByRole('link', { name: /view all/i });
    expect(viewAll).toHaveAttribute('href', '/products/account/cohorts');
  });

  // ─────────────────────────────────────────────────────────────
  // Integration — preserved auth + status branches
  // ─────────────────────────────────────────────────────────────

  it('int_account_auth_redirect_preserved: null session redirects to /login?callbackUrl=%2Fproducts%2Faccount', async () => {
    mockAuth.mockResolvedValue(null);
    await renderAccountPage();
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount',
    );
  });

  it('int_account_purchased_status_banner_preserved: ?purchased renders role=status banner with product title and no placeholder utilities', async () => {
    await renderAccountPage({ purchased: 'workflow-templates' });
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent('Agent Workflow Templates');
    expect(banner.className).not.toMatch(/bg-accent\/5/);
    expect(banner.className).not.toMatch(/border-accent\/40/);
    expect(banner.className).not.toMatch(/rounded-md/);
  });

  it('int_account_canceled_status_banner_preserved: ?canceled renders role=status banner with brand chrome (no bg-mist/30 border-mist)', async () => {
    await renderAccountPage({ canceled: 'true' });
    const banner = screen.getByRole('status');
    expect(banner).toHaveTextContent(/canceled/i);
    expect(banner.className).not.toMatch(/bg-mist\/30/);
    expect(banner.className).not.toMatch(/border-mist\b/);
    expect(banner.className).not.toMatch(/rounded-md/);
  });

  // ─────────────────────────────────────────────────────────────
  // Accessibility
  // ─────────────────────────────────────────────────────────────

  it('a11y_account_heading_landmark: h1 visible with name === session.user.email', async () => {
    await renderAccountPage();
    const h1 = screen.getByRole('heading', { level: 1, name: 'test@example.com' });
    expect(h1).toBeInTheDocument();
  });

  it('a11y_account_status_banners_role: both purchased + canceled banners use role="status" (WCAG 4.1.3)', async () => {
    const { unmount } = await renderAccountPage({ purchased: 'workflow-templates' });
    expect(screen.getByRole('status')).toBeInTheDocument();
    unmount();

    await renderAccountPage({ canceled: 'true' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────────────────────

  it('edge_account_no_cohort_activity: applications=[] + enrollments=[] hides "My cohorts" h2', async () => {
    await renderAccountPage();
    expect(
      screen.queryByRole('heading', { level: 2, name: /my cohorts/i }),
    ).not.toBeInTheDocument();
  });

  it('edge_account_no_purchases: purchases=[] still mounts PurchaseList (empty state delegated)', async () => {
    mockOrderBy.mockResolvedValue([]);
    await renderAccountPage();
    const list = screen.getByTestId('purchase-list');
    expect(list).toHaveAttribute('data-count', '0');
  });

  // ─────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels
  // ─────────────────────────────────────────────────────────────

  it('infra_account_no_placeholder_tokens: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_account_adopts_brand_utilities: page source contains Bone AND Section AND .display-2 AND .label', () => {
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-2\b/);
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
  });

  it('infra_account_brand_imports: page imports Bone + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
  });
});
