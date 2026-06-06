import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';

const { mockListApplications } = vi.hoisted(() => ({
  mockListApplications: vi.fn<(...args: unknown[]) => Promise<unknown>>(),
}));
vi.mock('@/lib/cohorts/admin', () => ({
  listApplications: mockListApplications,
}));

const { mockGetAllCohorts } = vi.hoisted(() => ({
  mockGetAllCohorts: vi.fn<() => Promise<unknown>>(),
}));
vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: mockGetAllCohorts,
}));

vi.mock('next/link', () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import AdminApplicationsPage, { metadata } from '../page';

const COHORT_ENTRIES = [
  {
    meta: { slug: 'ai-delivery-2026-q3', title: 'AI Delivery Intensive' },
  },
  {
    meta: { slug: 'workflow-mastery-2026-q4', title: 'Workflow Mastery' },
  },
];

const APP_ROW = {
  id: 'app-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-1',
  decision: 'pending' as const,
  commitmentLevel: 'standard' as const,
  commitmentHours: 12,
  timezone: 'America/New_York',
  pillarInterest: 'delivery' as const,
  background: 'background text',
  goals: 'detailed goals — ship a feature this quarter',
  referralSource: null,
  submittedAt: new Date('2026-06-01T10:00:00Z'),
  userEmail: 'applicant@example.com',
};

function makeParams(searchParams: Record<string, string> = {}) {
  return { searchParams: Promise.resolve(searchParams) };
}

describe('AdminApplicationsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllCohorts.mockResolvedValue(COHORT_ENTRIES);
    mockListApplications.mockResolvedValue([APP_ROW]);
  });

  // --- Unit / functional ---

  it('unit_list_default_filter_is_pending: default decision filter is "pending" when query absent', async () => {
    const jsx = await AdminApplicationsPage(makeParams({}));
    render(jsx);
    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'pending' }),
    );
  });

  it('unit_list_renders_heading_and_form: heading + filter form with cohort + decision selects', async () => {
    const jsx = await AdminApplicationsPage(makeParams({}));
    render(jsx);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/applications/i);
    expect(screen.getByLabelText(/cohort/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/decision/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /filter/i })).toBeInTheDocument();
  });

  it('unit_list_renders_review_link_per_row: each row has Review link to /admin/cohorts/applications/{id}', async () => {
    const jsx = await AdminApplicationsPage(makeParams({}));
    render(jsx);
    const reviewLink = screen.getByRole('link', { name: /review/i });
    expect(reviewLink).toHaveAttribute('href', '/admin/cohorts/applications/app-1');
  });

  // --- Integration ---

  it('integration_list_renders_row_per_application: one <li> per application from listApplications', async () => {
    mockListApplications.mockResolvedValueOnce([
      { ...APP_ROW, id: 'app-1' },
      { ...APP_ROW, id: 'app-2', userEmail: 'two@example.com' },
    ]);
    const jsx = await AdminApplicationsPage(makeParams({}));
    const { container } = render(jsx);
    const items = container.querySelectorAll('ul li');
    expect(items.length).toBe(2);
  });

  it('integration_list_empty_renders_empty_state: empty list shows the "No applications match" panel', async () => {
    mockListApplications.mockResolvedValueOnce([]);
    const jsx = await AdminApplicationsPage(makeParams({}));
    render(jsx);
    expect(screen.getByText(/no applications match/i)).toBeInTheDocument();
  });

  // --- Security ---

  it('sec_tampering_invalid_decision_query_param: unknown decision falls back to pending (no script injection)', async () => {
    const jsx = await AdminApplicationsPage(makeParams({ decision: '<script>alert(1)</script>' }));
    const { container } = render(jsx);
    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'pending' }),
    );
    expect(container.innerHTML).not.toContain('<script>alert');
  });

  it('sec_info_disclosure_robots_noindex: metadata.robots = index:false, follow:false', () => {
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });

  // --- Edge ---

  it('edge_input_decision_param_unknown_value: decision=mystery → effective filter = pending', async () => {
    const jsx = await AdminApplicationsPage(makeParams({ decision: 'mystery' }));
    render(jsx);
    expect(mockListApplications).toHaveBeenCalledWith(
      expect.objectContaining({ decision: 'pending' }),
    );
  });

  it('edge_state_empty_application_list: zero applications matching → empty state, no <li>', async () => {
    mockListApplications.mockResolvedValueOnce([]);
    const jsx = await AdminApplicationsPage(makeParams({}));
    const { container } = render(jsx);
    expect(container.querySelectorAll('ul li').length).toBe(0);
    expect(screen.getByText(/no applications match/i)).toBeInTheDocument();
  });

  // --- A11y ---

  it('a11y_operable_filter_form_keyboard_submittable: submit button + method=get + no JS required', async () => {
    const jsx = await AdminApplicationsPage(makeParams({}));
    const { container } = render(jsx);
    const form = container.querySelector('form');
    expect(form).toBeTruthy();
    expect(form?.getAttribute('method')?.toLowerCase()).toBe('get');
    const submit = within(form as HTMLElement).getByRole('button', { name: /filter/i });
    expect(submit.getAttribute('type')).toBe('submit');
  });

  it('a11y_robust_filter_selects_have_labels: cohort + decision selects each have a <label>', async () => {
    const jsx = await AdminApplicationsPage(makeParams({}));
    render(jsx);
    const cohortLabel = screen.getByText('Cohort');
    const decisionLabel = screen.getByText('Decision');
    expect(cohortLabel.tagName.toLowerCase()).toBe('label');
    expect(decisionLabel.tagName.toLowerCase()).toBe('label');
  });

  // --- Infra ---

  it('infra_admin_pages_robots_noindex: list page metadata.robots noindex/nofollow', () => {
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(false);
    expect(robots.follow).toBe(false);
  });
});
