import { vi, describe, it, expect, beforeEach } from 'vitest';

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
const mockNotFound = vi.fn();
vi.mock('next/navigation', () => ({
  redirect: (...args: unknown[]) => mockRedirect(...args),
  notFound: (...args: unknown[]) => mockNotFound(...args),
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

// Mock the db chain: select → from → where → limit
const mockLimit = vi.fn();
vi.mock('@/db/client', () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => ({
          limit: () => mockLimit(),
        }),
      }),
    }),
  },
  schema: {
    purchases: {
      id: 'id',
    },
  },
}));

const mockGetProductBySlug = vi.fn();
vi.mock('@/lib/content/products', () => ({
  getProductBySlug: (...args: unknown[]) => mockGetProductBySlug(...args),
}));

import { render, screen } from '@testing-library/react';

const MOCK_PURCHASE = {
  id: 'purchase-abc-123',
  userId: 'user-owner-id',
  productSlug: 'workflow-templates',
  stripeSessionId: 'cs_test_abc',
  stripePaymentIntentId: 'pi_test_abc',
  amountCents: 4900,
  currency: 'usd',
  purchasedAt: new Date('2026-04-10T12:00:00Z'),
};

const MOCK_PRODUCT_ENTRY = {
  meta: {
    title: 'Agent Workflow Templates',
    slug: 'workflow-templates',
  },
  slug: 'workflow-templates',
  Component: () => null,
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

async function renderDetailPage(id = 'purchase-abc-123') {
  const PurchaseDetailPage = (await import('../page')).default;
  const jsx = await PurchaseDetailPage(makeParams(id));
  return render(jsx);
}

describe('PurchaseDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner-id', email: 'owner@example.com' },
    });
    mockLimit.mockResolvedValue([MOCK_PURCHASE]);
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_ENTRY);
  });

  // --- Batch 1: Functional (unit) ---

  it('unit_detail_renders: owning user sees title, amount, date, order ID, Stripe session, download, back link', async () => {
    await renderDetailPage();

    expect(screen.getByText('Agent Workflow Templates')).toBeInTheDocument();
    expect(screen.getByText(/\$49\.00/)).toBeInTheDocument();
    expect(screen.getByText(/April 10, 2026/)).toBeInTheDocument();
    expect(screen.getByText('purchase-abc-123')).toBeInTheDocument();
    expect(screen.getByText('cs_test_abc')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /download/i }),
    ).toHaveAttribute('href', '/api/products/downloads/purchase-abc-123');
    expect(
      screen.getByRole('link', { name: /back to account/i }),
    ).toHaveAttribute('href', '/products/account');
  });

  it('unit_detail_params_awaited: page accepts params as Promise<{ id: string }>', async () => {
    // This test verifies the Next.js 16 pattern — if params wasn't awaited,
    // the page would fail to destructure `id` from the Promise object
    await renderDetailPage('purchase-abc-123');
    expect(screen.getByText('Agent Workflow Templates')).toBeInTheDocument();
  });

  it('unit_detail_metadata: page metadata excludes from indexing', async () => {
    const { metadata } = await import('../page');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // --- Batch 2: Security ---

  it('sec_spoofing_detail_anon: anonymous request redirects to login with callbackUrl', async () => {
    mockAuth.mockResolvedValue(null);
    await renderDetailPage('purchase-abc-123');
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount%2Fpurchases%2Fpurchase-abc-123',
    );
  });

  it('sec_elevation_detail_unknown: unknown purchase ID returns notFound()', async () => {
    mockLimit.mockResolvedValue([]);
    await renderDetailPage('nonexistent-id');
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('sec_elevation_detail_mismatch: userId mismatch returns notFound()', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'different-user-id', email: 'other@example.com' },
    });
    await renderDetailPage('purchase-abc-123');
    expect(mockNotFound).toHaveBeenCalled();
  });
});
