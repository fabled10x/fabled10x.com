import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { StatusBadge } from '../StatusBadge';
import * as buildLogBarrel from '..';

describe('StatusBadge', () => {
  it('unit_status_badge_renders_label_per_status', () => {
    const cases: Array<['planned' | 'in-progress' | 'complete' | 'unknown', string]> = [
      ['planned', 'Planned'],
      ['in-progress', 'In progress'],
      ['complete', 'Complete'],
      ['unknown', 'No data'],
    ];
    for (const [status, label] of cases) {
      const { unmount } = render(<StatusBadge status={status} />);
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    }
  });

  it('unit_status_badge_applies_correct_class_per_status', () => {
    const expectations: Array<['planned' | 'in-progress' | 'complete' | 'unknown', RegExp]> = [
      ['planned', /bg-mist/],
      ['in-progress', /bg-accent/],
      ['complete', /bg-signal/],
      ['unknown', /bg-mist/],
    ];
    for (const [status, classRe] of expectations) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const badge = container.querySelector(`[data-testid="status-badge-${status}"]`);
      expect(badge).toBeTruthy();
      expect(badge?.className).toMatch(classRe);
      unmount();
    }
  });

  it('infra_barrel_re_exports_three_new_components', () => {
    expect(buildLogBarrel).toHaveProperty('StatusBadge');
    expect(buildLogBarrel).toHaveProperty('JobCard');
    expect(buildLogBarrel).toHaveProperty('PhaseNav');
    expect(buildLogBarrel).toHaveProperty('MarkdownDocument');
  });
});
