import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen, within } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { JobCard } from '../JobCard';
import type { JobRollupEntry } from '@/content/schemas';

const baseRollup: JobRollupEntry = {
  slug: 'demo-job',
  title: 'Demo Job',
  alias: 'dj',
  totalFeatures: 6,
  completedFeatures: 3,
  percentComplete: 50,
  status: 'in-progress',
};

describe('JobCard', () => {
  it('unit_job_card_title_link_to_job_page', () => {
    render(<JobCard rollup={baseRollup} excerpt="An excerpt." />);
    const titleLink = screen.getByRole('link', { name: /Demo Job/ });
    expect(titleLink).toHaveAttribute('href', '/build-log/jobs/demo-job');
  });

  it('unit_job_card_renders_alias_when_present', () => {
    render(<JobCard rollup={baseRollup} excerpt="An excerpt." />);
    expect(screen.getByText(/Alias:/i)).toBeInTheDocument();
    expect(screen.getByText('dj')).toBeInTheDocument();
  });

  it('unit_job_card_omits_alias_when_undefined', () => {
    const { alias: _omit, ...rest } = baseRollup;
    void _omit;
    render(<JobCard rollup={rest as JobRollupEntry} excerpt="An excerpt." />);
    expect(screen.queryByText(/Alias:/i)).toBeNull();
  });

  it('unit_job_card_renders_status_badge', () => {
    render(<JobCard rollup={baseRollup} excerpt="An excerpt." />);
    expect(
      document.querySelector('[data-testid="status-badge-in-progress"]'),
    ).toBeInTheDocument();
  });

  it('unit_job_card_excerpt_with_line_clamp', () => {
    const { container } = render(
      <JobCard rollup={baseRollup} excerpt="The whole excerpt." />,
    );
    const clamped = container.querySelector('.line-clamp-3');
    expect(clamped).toBeInTheDocument();
    expect(clamped?.textContent).toBe('The whole excerpt.');
  });

  it('unit_job_card_feature_counts_with_percent', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    expect(screen.getByText(/3 \/ 6 features/)).toBeInTheDocument();
    expect(screen.getByText(/50%/)).toBeInTheDocument();
  });

  it('unit_job_card_omits_percent_when_null', () => {
    render(
      <JobCard
        rollup={{ ...baseRollup, percentComplete: null, totalFeatures: 0, completedFeatures: 0 }}
        excerpt="x"
      />,
    );
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('edge_input_job_card_zero_total_features', () => {
    render(
      <JobCard
        rollup={{
          ...baseRollup,
          totalFeatures: 0,
          completedFeatures: 0,
          percentComplete: null,
          status: 'unknown',
        }}
        excerpt="x"
      />,
    );
    expect(screen.getByText(/0 \/ 0 features/)).toBeInTheDocument();
    expect(screen.queryByText(/%/)).toBeNull();
  });

  it('a11y_job_card_uses_semantic_article', () => {
    const { container } = render(
      <JobCard rollup={baseRollup} excerpt="An excerpt." />,
    );
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    const heading = within(article as HTMLElement).getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent(/Demo Job/);
  });
});
