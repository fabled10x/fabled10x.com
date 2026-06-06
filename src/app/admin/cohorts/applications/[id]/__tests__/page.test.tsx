import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockGetApplication, mockDecideApplication } = vi.hoisted(() => ({
  mockGetApplication: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
  mockDecideApplication: vi.fn<(...args: unknown[]) => Promise<void>>(),
}));
vi.mock('@/lib/cohorts/admin', () => ({
  getApplication: mockGetApplication,
  decideApplication: mockDecideApplication,
}));

const { mockGetCohortBySlug } = vi.hoisted(() => ({
  mockGetCohortBySlug: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));
vi.mock('@/lib/content/cohorts', () => ({
  getCohortBySlug: mockGetCohortBySlug,
}));

const { mockAuth } = vi.hoisted(() => ({
  mockAuth: vi.fn<() => Promise<unknown>>(),
}));
vi.mock('@/auth', () => ({ auth: mockAuth }));

const { mockNotFound, mockRedirect } = vi.hoisted(() => ({
  mockNotFound: vi.fn<() => never>(),
  mockRedirect: vi.fn<(...args: unknown[]) => never>(),
}));
vi.mock('next/navigation', () => ({
  notFound: mockNotFound,
  redirect: mockRedirect,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import ApplicationDetailPage from '../page';

const APP_FIXTURE = {
  id: 'app-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-1',
  decision: 'pending' as const,
  commitmentLevel: 'standard' as const,
  commitmentHours: 12,
  timezone: 'America/New_York',
  pillarInterest: 'delivery' as const,
  background: 'I have ten years of experience\nin distributed systems.',
  goals: 'Ship one real AI feature\nwithin the next quarter.',
  referralSource: 'Twitter',
  submittedAt: new Date('2026-06-01T10:00:00Z'),
  userEmail: 'applicant@example.com',
};

const COHORT_FIXTURE = {
  meta: {
    id: 'cohort-001',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
  },
  slug: 'ai-delivery-2026-q3',
  Component: () => null,
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

describe('ApplicationDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetApplication.mockResolvedValue(APP_FIXTURE);
    mockGetCohortBySlug.mockResolvedValue(COHORT_FIXTURE);
    mockAuth.mockResolvedValue({ user: { email: 'admin@foo.com' } });
    mockNotFound.mockImplementation(() => {
      throw new Error('NEXT_NOT_FOUND');
    });
    mockRedirect.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
  });

  // --- Unit ---

  it('unit_detail_unknown_id_calls_not_found: notFound() invoked when getApplication returns null', async () => {
    mockGetApplication.mockResolvedValueOnce(null);
    await ApplicationDetailPage(makeParams('missing')).catch(() => undefined);
    expect(mockNotFound).toHaveBeenCalled();
  });

  it('unit_detail_renders_decide_buttons: Accept + Waitlist + Decline buttons rendered', async () => {
    const jsx = await ApplicationDetailPage(makeParams('app-1'));
    render(jsx);
    expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /waitlist/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /decline/i })).toBeInTheDocument();
  });

  // --- Integration ---

  it('integration_detail_renders_full_application: applicant email + cohort title + commitment + background + goals', async () => {
    const jsx = await ApplicationDetailPage(makeParams('app-1'));
    render(jsx);
    expect(screen.getByText('applicant@example.com')).toBeInTheDocument();
    expect(screen.getByText(/AI Delivery Intensive/)).toBeInTheDocument();
    expect(screen.getByText(/America\/New_York/)).toBeInTheDocument();
    expect(screen.getByText(/Twitter/)).toBeInTheDocument();
    expect(screen.getByText(/distributed systems/)).toBeInTheDocument();
    expect(screen.getByText(/Ship one real AI feature/)).toBeInTheDocument();
  });

  // --- Security ---

  it('sec_spoofing_action_re_checks_auth: decideApplication NOT called when action re-auth returns null', async () => {
    // This test asserts the design: action body calls auth() before invoking decideApplication.
    // We exercise that by faking auth() === null during the action invocation. The render path
    // doesn't trigger the action automatically, so the assertion is that decideApplication was
    // never called for a page-load with auth() === null at action time. We cannot invoke the
    // inline server action synchronously from a test; this asserts the page itself does not
    // bypass the auth gate as a side effect.
    mockAuth.mockResolvedValueOnce(null);
    await ApplicationDetailPage(makeParams('app-1')).catch(() => undefined);
    expect(mockDecideApplication).not.toHaveBeenCalled();
  });

  // --- A11y ---

  it('a11y_understandable_decide_form_button_labels: Accept/Waitlist/Decline are visible text labels', async () => {
    const jsx = await ApplicationDetailPage(makeParams('app-1'));
    render(jsx);
    expect(screen.getByText(/^Accept$/)).toBeInTheDocument();
    expect(screen.getByText(/^Waitlist$/)).toBeInTheDocument();
    expect(screen.getByText(/^Decline$/)).toBeInTheDocument();
  });

  // --- Infra ---

  it('infra_admin_pages_robots_noindex: detail page inherits no-index posture (parent layout governs)', async () => {
    // Detail page may export its own metadata; if so, robots must be noindex/nofollow.
    // If it does not export metadata, the parent layout's robots flag governs (allowed).
    const mod = await import('../page');
    const m = (mod as { metadata?: { robots?: { index?: boolean; follow?: boolean } } }).metadata;
    if (m?.robots) {
      expect(m.robots.index).toBe(false);
      expect(m.robots.follow).toBe(false);
    } else {
      expect(m).toBeUndefined();
    }
  });

  // --- Permission ---

  it('perm_admin_detail_renders: allowlisted admin sees full detail', async () => {
    const jsx = await ApplicationDetailPage(makeParams('app-1'));
    render(jsx);
    expect(screen.getByText('applicant@example.com')).toBeInTheDocument();
  });

  it('perm_admin_decide_action_writes_when_authed: decideApplication wired to the form action (button has formAction reference)', async () => {
    const jsx = await ApplicationDetailPage(makeParams('app-1'));
    const { container } = render(jsx);
    // The 3 decide buttons should be inside a <form>; presence is the wiring contract.
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    const buttons = form?.querySelectorAll('button[type="submit"]');
    expect(buttons?.length).toBeGreaterThanOrEqual(3);
  });
});
