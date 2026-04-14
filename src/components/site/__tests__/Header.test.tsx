import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
  } & Record<string, unknown>) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { usePathname } from 'next/navigation';
import { Header } from '../Header';

const mockUsePathname = vi.mocked(usePathname);

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

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
    expect(items).toHaveLength(5);
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
      { href: '/build-log', label: 'Build log' },
      { href: '/products', label: 'Products' },
      { href: '/about', label: 'About' },
    ]);
  });

  // --- Phase 3.1: Build-log nav + active state ---

  it('unit_header_has_build_log_link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).toHaveAttribute('href', '/build-log');
  });

  it('unit_header_nav_items_count_updated', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const items = nav.querySelectorAll('li');
    expect(items).toHaveLength(5);
  });

  it('int_header_active_on_build_log', () => {
    mockUsePathname.mockReturnValue('/build-log');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_header_active_on_nested_build_log', () => {
    mockUsePathname.mockReturnValue('/build-log/jobs/website-foundation');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_header_not_active_on_other_routes', () => {
    mockUsePathname.mockReturnValue('/episodes');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  it('a11y_header_nav_build_log_has_label', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).toHaveAccessibleName('Build log');
  });

  it('a11y_header_nav_aria_current_when_active', () => {
    mockUsePathname.mockReturnValue('/build-log/status');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('edge_header_active_state_with_null_pathname', () => {
    mockUsePathname.mockReturnValue(null as unknown as string);
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // --- storefront-auth-4.2: Products nav item ---

  it('unit_header_has_products_link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Products' });
    expect(link).toHaveAttribute('href', '/products');
  });

  // --- Integration ---

  it('i_header_uses_container', () => {
    const { container } = render(<Header />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
  });
});
