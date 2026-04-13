import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { JobsRollupTable } from '../JobsRollupTable';
import type { JobRollupEntry } from '@/content/schemas';

function makeRow(overrides: Partial<JobRollupEntry> = {}): JobRollupEntry {
  return {
    slug: 'demo',
    title: 'Demo Job',
    alias: 'dj',
    totalFeatures: 6,
    completedFeatures: 3,
    percentComplete: 50,
    status: 'in-progress',
    ...overrides,
  };
}

describe('JobsRollupTable', () => {
  it('unit_table_renders_one_row_per_entry', () => {
    const rows = [
      makeRow({ slug: 'a', title: 'Job A' }),
      makeRow({ slug: 'b', title: 'Job B' }),
      makeRow({ slug: 'c', title: 'Job C' }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(3);
  });

  it('unit_table_title_links_to_job_detail', () => {
    const rows = [makeRow({ slug: 'community-showcase', title: 'Community Showcase' })];
    render(<JobsRollupTable rows={rows} />);
    const link = screen.getByRole('link', { name: /Community Showcase/ });
    expect(link).toHaveAttribute('href', '/build-log/jobs/community-showcase');
  });

  it('unit_table_alias_renders_in_parens_when_present', () => {
    const rows = [makeRow({ slug: 'community-showcase', title: 'Community Showcase', alias: 'cs' })];
    render(<JobsRollupTable rows={rows} />);
    expect(screen.getByText('(cs)')).toBeInTheDocument();
  });

  it('unit_table_alias_omitted_when_absent', () => {
    const { alias: _omit, ...rest } = makeRow();
    void _omit;
    render(<JobsRollupTable rows={[rest as JobRollupEntry]} />);
    expect(screen.queryByText(/^\(/)).toBeNull();
  });

  it('unit_table_status_badge_per_row', () => {
    const rows = [
      makeRow({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRow({ slug: 'b', title: 'B', status: 'complete', percentComplete: 100, completedFeatures: 6 }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    expect(container.querySelector('[data-testid="status-badge-in-progress"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="status-badge-complete"]')).toBeInTheDocument();
  });

  it('unit_table_features_count_renders', () => {
    const rows = [makeRow({ totalFeatures: 17, completedFeatures: 12 })];
    render(<JobsRollupTable rows={rows} />);
    expect(screen.getByText(/12 \/ 17/)).toBeInTheDocument();
  });

  it('a11y_progressbar_has_correct_aria_attributes', () => {
    const rows = [makeRow({ title: 'Demo Job', percentComplete: 42 })];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-valuenow')).toBe('42');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
    const label = bar?.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/Demo Job/);
    expect(label).toMatch(/42/);
  });

  it('edge_input_progressbar_renders_dash_when_percent_null', () => {
    const rows = [
      makeRow({
        slug: 'unknown-job',
        title: 'Unknown Job',
        percentComplete: null,
        status: 'unknown',
        totalFeatures: 0,
        completedFeatures: 0,
      }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('edge_input_progressbar_renders_zero_for_planned', () => {
    const rows = [
      makeRow({
        slug: 'planned-job',
        title: 'Planned Job',
        percentComplete: 0,
        status: 'planned',
        completedFeatures: 0,
      }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-valuenow')).toBe('0');
  });
});
