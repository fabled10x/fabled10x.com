import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    'aria-current': ariaCurrent,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    'aria-current'?: string;
    className?: string;
  }) => (
    <a href={href} aria-current={ariaCurrent} className={className}>
      {children}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PhaseNav } from '../PhaseNav';
import type { JobPhase } from '@/content/schemas';

const phases: readonly JobPhase[] = [
  {
    slug: 'phase-1-foundation',
    filename: 'phase-1-foundation.md',
    header: { phaseNumber: 1, title: 'Foundation' },
    body: '# body',
  },
  {
    slug: 'phase-2-pages',
    filename: 'phase-2-pages.md',
    header: { phaseNumber: 2, title: 'Pages' },
    body: '# body',
  },
  {
    slug: 'phase-3-untitled',
    filename: 'phase-3-untitled.md',
    header: {},
    body: '# body',
  },
] as const;

describe('PhaseNav', () => {
  it('unit_phase_nav_renders_one_link_per_phase', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const nav = screen.getByRole('navigation');
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(3);
  });

  it('unit_phase_nav_phase_title_format', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    expect(screen.getByText('Phase 1: Foundation')).toBeInTheDocument();
    expect(screen.getByText('Phase 2: Pages')).toBeInTheDocument();
  });

  it('unit_phase_nav_falls_back_to_slug_when_title_missing', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    expect(screen.getByText('phase-3-untitled')).toBeInTheDocument();
  });

  it('edge_input_phase_nav_empty_phases_renders_null', () => {
    const { container } = render(<PhaseNav jobSlug="demo" phases={[] as readonly JobPhase[]} />);
    expect(container.querySelector('nav')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('a11y_phase_nav_aria_current_on_active', () => {
    render(
      <PhaseNav
        jobSlug="demo"
        phases={phases}
        activePhaseSlug="phase-2-pages"
      />,
    );
    const activeLink = screen.getByText('Phase 2: Pages').closest('a');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    const inactiveLink = screen.getByText('Phase 1: Foundation').closest('a');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('a11y_phase_nav_landmark_aria_label', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Phases');
  });

  it('data_consistency_phase_nav_active_phase_styling_matches_active_slug', () => {
    render(
      <PhaseNav
        jobSlug="demo"
        phases={phases}
        activePhaseSlug="phase-1-foundation"
      />,
    );
    const links = screen.getAllByRole('link');
    const activeLinks = links.filter((l) => l.getAttribute('aria-current') === 'page');
    expect(activeLinks).toHaveLength(1);
    expect(activeLinks[0]).toHaveTextContent('Phase 1: Foundation');
    expect(activeLinks[0].className).toMatch(/bg-accent/);
    const inactiveLinks = links.filter(
      (l) => l.getAttribute('aria-current') !== 'page',
    );
    for (const link of inactiveLinks) {
      expect(link.className).not.toMatch(/bg-accent/);
    }
  });
});
