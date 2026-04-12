import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { Footer } from '../Footer';

describe('Footer', () => {
  // --- Unit ---

  it('unit_footer_brand_mark', () => {
    render(<Footer />);
    expect(screen.getByText('fabled')).toBeInTheDocument();
    expect(screen.getByText('10x')).toBeInTheDocument();
  });

  it('unit_footer_lll_callout', () => {
    render(<Footer />);
    expect(screen.getByText('largelanguagelibrary.ai')).toBeInTheDocument();
  });

  it('unit_footer_tagline', () => {
    render(<Footer />);
    expect(
      screen.getByText('One person. An agent team. Full SaaS delivery.')
    ).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_footer_landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  // --- Data integrity ---

  it('data_footer_lll_url', () => {
    render(<Footer />);
    const lllLink = screen.getByText('largelanguagelibrary.ai');
    expect(lllLink).toHaveAttribute('href', 'https://largelanguagelibrary.ai');
  });

  // --- Integration ---

  it('i_footer_uses_container', () => {
    const { container } = render(<Footer />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
  });
});
