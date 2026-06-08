// PurchaseDetailPage (styling-overhaul-7.5) — Storefront reskin hybrid red.
//
// Preserves behavior pins: auth redirect with encoded callbackUrl,
// ownership notFound, download anchor href, back-to-account link, metadata
// noindex. Adds brand-aware assertions per phase-7-pages.md Feature 7.5:
//   - <Bone> surface + <Container width="prose">
//   - .label kicker "Receipt"
//   - h1 has .display-2 class and reads product.title (fallback to slug)
//   - <dl> spec sheet for Order / Date / Amount / Stripe with
//     <dt class="label"> + <dd class="mono ...">
//   - Amount formatted via Intl.NumberFormat USD; Date via Intl.DateTimeFormat
//
// Source-level sentinels (infra_*) read the page.tsx via readFileSync.

import { vi, describe, it, expect, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

// db chain: select → from → where → limit
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

describe('PurchaseDetailPage (styling-overhaul-7.5) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner-id', email: 'owner@example.com' },
    });
    mockLimit.mockResolvedValue([MOCK_PURCHASE]);
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_ENTRY);
  });

  // ─────────────────────────────────────────────────────────────
  // Unit — brand chrome
  // ─────────────────────────────────────────────────────────────

  it('unit_purchase_detail_bone_mount: page renders within Bone surface and Container width="prose"', async () => {
    const { container } = await renderDetailPage();
    expect(container.querySelector('.bg-\\(--color-bone\\)')).toBeInTheDocument();
    expect(container.querySelector('.max-w-prose')).toBeInTheDocument();
  });

  it('unit_purchase_detail_label_kicker_receipt: a .label element reads "Receipt"', async () => {
    const { container } = await renderDetailPage();
    const labels = Array.from(container.querySelectorAll('.label'));
    const kicker = labels.find((el) =>
      /^Receipt$/i.test((el.textContent ?? '').trim()),
    );
    expect(kicker).toBeDefined();
  });

  it('unit_purchase_detail_display_2_title: h1 has .display-2 class and text === product.title', async () => {
    await renderDetailPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1.className).toMatch(/\bdisplay-2\b/);
    expect((h1.textContent ?? '').trim()).toBe('Agent Workflow Templates');
  });

  it('unit_purchase_detail_dl_spec_sheet: <dl> contains Order / Date / Amount / Stripe rows with .label dt + .mono dd', async () => {
    const { container } = await renderDetailPage();
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    const dts = Array.from(dl!.querySelectorAll('dt'));
    const dtLabels = dts.map((d) => (d.textContent ?? '').trim().toLowerCase());
    expect(dtLabels).toContain('order');
    expect(dtLabels).toContain('date');
    expect(dtLabels).toContain('amount');
    expect(dtLabels.some((t) => /stripe/.test(t))).toBe(true);
    // Each dt uses .label
    for (const dt of dts) {
      expect(dt.className).toMatch(/\blabel\b/);
    }
    // Each row's dd uses .mono
    const dds = Array.from(dl!.querySelectorAll('dd'));
    expect(dds.length).toBeGreaterThanOrEqual(4);
    for (const dd of dds) {
      expect(dd.className).toMatch(/\bmono\b/);
    }
  });

  it('unit_purchase_detail_amount_formatted: amount renders as Intl.NumberFormat USD currency string', async () => {
    await renderDetailPage();
    // amountCents 4900 / currency usd → $49 (or $49.00)
    expect(screen.getByText(/\$49(?:\.00)?\b/)).toBeInTheDocument();
  });

  it('unit_purchase_detail_date_formatted_long: date renders via Intl.DateTimeFormat year+month+day', async () => {
    await renderDetailPage();
    // 2026-04-10 in en-US long form → "April 10, 2026" (timezone-tolerant: also allow April 9)
    expect(screen.getByText(/April \d{1,2}, 2026/)).toBeInTheDocument();
  });

  it('unit_purchase_detail_download_link_preserved: Download anchor href=/api/products/downloads/{id}', async () => {
    await renderDetailPage();
    const link = screen.getByRole('link', { name: /download/i });
    expect(link).toHaveAttribute(
      'href',
      '/api/products/downloads/purchase-abc-123',
    );
  });

  it('unit_purchase_detail_back_link_preserved: Back-to-account link href=/products/account', async () => {
    await renderDetailPage();
    const link = screen.getByRole('link', { name: /back to account/i });
    expect(link).toHaveAttribute('href', '/products/account');
  });

  // ─────────────────────────────────────────────────────────────
  // Integration — preserved auth + ownership
  // ─────────────────────────────────────────────────────────────

  it('int_purchase_detail_auth_redirect_preserved: null session redirects with encoded callbackUrl', async () => {
    mockAuth.mockResolvedValue(null);
    await renderDetailPage('purchase-abc-123');
    expect(mockRedirect).toHaveBeenCalledWith(
      '/login?callbackUrl=%2Fproducts%2Faccount%2Fpurchases%2Fpurchase-abc-123',
    );
  });

  it('int_purchase_detail_ownership_not_found_preserved: userId mismatch triggers notFound()', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'different-user-id', email: 'other@example.com' },
    });
    await renderDetailPage('purchase-abc-123');
    expect(mockNotFound).toHaveBeenCalled();
  });

  // ─────────────────────────────────────────────────────────────
  // Accessibility
  // ─────────────────────────────────────────────────────────────

  it('a11y_purchase_detail_dl_semantic: page contains semantic dl > dt + dd elements', async () => {
    const { container } = await renderDetailPage();
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    expect(dl!.querySelectorAll('dt').length).toBeGreaterThanOrEqual(4);
    expect(dl!.querySelectorAll('dd').length).toBeGreaterThanOrEqual(4);
  });

  // ─────────────────────────────────────────────────────────────
  // Edge cases
  // ─────────────────────────────────────────────────────────────

  it('edge_purchase_detail_missing_product_entry: falls back to productSlug as h1 when getProductBySlug returns undefined', async () => {
    mockGetProductBySlug.mockResolvedValue(undefined);
    await renderDetailPage();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect((h1.textContent ?? '').trim()).toBe('workflow-templates');
  });

  // ─────────────────────────────────────────────────────────────
  // Data integrity
  // ─────────────────────────────────────────────────────────────

  it('data_purchase_detail_amount_formatted_correctly: amountCents=4900 currency=usd → text matches $49', async () => {
    await renderDetailPage();
    expect(screen.getByText(/\$49(?:\.00)?\b/)).toBeInTheDocument();
  });

  it('data_purchase_detail_date_formatted_long: date stringified via Intl.DateTimeFormat year+month+day', async () => {
    await renderDetailPage();
    expect(screen.getByText(/(?:January|February|March|April|May|June|July|August|September|October|November|December) \d{1,2}, \d{4}/)).toBeInTheDocument();
  });

  // ─────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels
  // ─────────────────────────────────────────────────────────────

  it('infra_purchase_detail_no_placeholder_tokens: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_purchase_detail_adopts_brand_utilities: page source contains Bone AND Section AND .display-2 AND .label AND .mono', () => {
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-2\b/);
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bmono\b/);
  });

  it('infra_purchase_detail_brand_imports: page imports Bone + Section from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bBone\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
  });
});
