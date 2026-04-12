import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { Header } from '../Header';

describe('Header', () => {
  // --- Unit ---

  it('unit_header_brand_mark', () => {
    render(<Header />);
    expect(screen.getByText('fabled')).toBeInTheDocument();
    expect(screen.getByText('10x')).toBeInTheDocument();
  });

  it('unit_header_nav_items_count', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const items = nav.querySelectorAll('li');
    expect(items).toHaveLength(3);
  });

  it('unit_header_nav_hrefs', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Episodes' })).toHaveAttribute('href', '/episodes');
    expect(screen.getByRole('link', { name: 'Cases' })).toHaveAttribute('href', '/cases');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  // --- Accessibility ---

  it('a11y_header_landmark', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('a11y_header_nav_label', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Primary');
  });

  it('a11y_header_nav_list', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const ul = nav.querySelector('ul');
    expect(ul).toBeInTheDocument();
    const lis = ul!.querySelectorAll('li');
    expect(lis.length).toBeGreaterThanOrEqual(3);
  });

  // --- Data integrity ---

  it('data_header_nav_items', () => {
    render(<Header />);
    const links = screen.getAllByRole('link').filter(
      (el) => el.closest('nav')
    );
    const items = links.map((link) => ({
      href: link.getAttribute('href'),
      label: link.textContent,
    }));
    expect(items).toEqual([
      { href: '/episodes', label: 'Episodes' },
      { href: '/cases', label: 'Cases' },
      { href: '/about', label: 'About' },
    ]);
  });

  // --- Integration ---

  it('i_header_uses_container', () => {
    const { container } = render(<Header />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
  });
});
