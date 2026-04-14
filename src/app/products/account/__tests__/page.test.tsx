import { vi, describe, it, expect, beforeEach } from 'vitest';
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

// Mock the db chain: select → from → where → orderBy
const mockOrderBy = vi.fn();
vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          orderBy: () => mockOrderBy(),
        }),
      }),
    }),
  },
  schema: {
    purchases: {
      userId: 'user_id',
      purchasedAt: 'purchased_at',
    },
  },
}));

const mockGetAllProducts = vi.fn();
vi.mock('@/lib/content/products', () => ({
  getAllProducts: () => mockGetAllProducts(),
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

describe('AccountPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'test@example.com' },
    });
    mockOrderBy.mockResolvedValue(MOCK_PURCHASES);
    mockGetAllProducts.mockResolvedValue([MOCK_PRODUCT]);
  });

  // --- Batch 1: Functional (unit) ---

  it('unit_account_empty: authenticated user with zero purchases sees empty state', async () => {
    mockOrderBy.mockResolvedValue([]);
    await renderAccountPage();
    expect(screen.getByTestId('purchase-list')).toHaveAttribute('data-count', '0');
  });

  it('unit_account_list: authenticated user with two purchases renders list', async () => {
    await renderAccountPage();
    expect(screen.getByTestId('purchase-list')).toHaveAttribute('data-count', '2');
  });

  it('unit_account_purchased_banner: searchParams.purchased shows success banner', async () => {
    await renderAccountPage({ purchased: 'workflow-templates' });
    expect(screen.getByRole('status')).toHaveTextContent(/confirmed/i);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Agent Workflow Templates',
    );
  });

  it('unit_account_canceled_banner: searchParams.canceled shows cancellation notice', async () => {
    await renderAccountPage({ canceled: '1' });
    expect(screen.getByRole('status')).toHaveTextContent(/canceled/i);
  });

  it('unit_account_metadata: page metadata excludes from indexing', async () => {
    const { metadata } = await import('../page');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // --- Batch 2: Security ---

  it('sec_spoofing_account_anon: anonymous request redirects to login', async () => {
    mockAuth.mockResolvedValue(null);
    await renderAccountPage();
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount',
    );
  });

  // --- Batch 6: Accessibility ---

  it('a11y_status_banners: success banner has role="status"', async () => {
    await renderAccountPage({ purchased: 'workflow-templates' });
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
