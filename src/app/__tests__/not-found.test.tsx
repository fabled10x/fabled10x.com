import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import NotFound from '../not-found';

describe('NotFound', () => {
  // --- Unit ---

  it('unit_notfound_404_text', () => {
    render(<NotFound />);
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('unit_notfound_heading', () => {
    render(<NotFound />);
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });

  it('unit_notfound_home_link', () => {
    render(<NotFound />);
    const link = screen.getByRole('link', { name: /homepage/i });
    expect(link).toHaveAttribute('href', '/');
  });

  // --- Accessibility ---

  it('a11y_notfound_heading_hierarchy', () => {
    render(<NotFound />);
    const heading = screen.getByRole('heading');
    expect(heading.tagName).toBe('H1');
  });
});
