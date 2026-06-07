import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

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

const HEADER_SOURCE = readFileSync(
  join(process.cwd(), 'src/components/site/Header.tsx'),
  'utf8',
);

describe('Header', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  // ─── Unit: brand mark ──────────────────────────────────────────────

  it('unit_header_renders_logo_component', () => {
    render(<Header />);
    expect(screen.getByLabelText('Fabled 10X')).toBeInTheDocument();
  });

  it('unit_header_home_link_wraps_logo', () => {
    render(<Header />);
    const home = screen.getByRole('link', { name: 'Fabled 10X' });
    expect(home).toHaveAttribute('href', '/');
  });

  // ─── Unit: Marble surface ──────────────────────────────────────────

  it('unit_header_marble_surface', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    expect(banner.className).toMatch(/bg-\(--color-marble\)/);
    expect(banner.className).toMatch(/text-\(--pair-text-on-marble\)/);
  });

  it('unit_header_marble_edge_rule', () => {
    render(<Header />);
    const banner = screen.getByRole('banner');
    expect(banner.className).toMatch(/border-b\s+border-\(--edge-color\)/);
    // Legacy `border-mist` rule must be gone
    expect(banner.className).not.toMatch(/border-mist/);
  });

  // ─── Unit: container & layout ──────────────────────────────────────

  it('unit_header_container_uses_space_padding', () => {
    const { container } = render(<Header />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
    expect(inner!.className).toMatch(/py-\(--space-4\)/);
    expect(inner!.className).toMatch(/flex/);
    expect(inner!.className).toMatch(/items-center/);
    expect(inner!.className).toMatch(/justify-between/);
    // Legacy fixed height is gone
    expect(inner!.className).not.toMatch(/\bh-16\b/);
  });

  it('unit_header_nav_ul_gap_token', () => {
    render(<Header />);
    const ul = screen.getByRole('navigation').querySelector('ul');
    expect(ul).not.toBeNull();
    expect(ul!.className).toMatch(/gap-\(--space-5\)/);
    expect(ul!.className).toMatch(/items-center/);
    expect(ul!.className).not.toMatch(/\bgap-8\b/);
  });

  // ─── Unit: NAV_ITEMS preservation ──────────────────────────────────

  it('unit_header_nav_items_count_preserved', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const items = nav.querySelectorAll('li');
    expect(items).toHaveLength(6);
  });

  it('unit_header_nav_hrefs', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Episodes' })).toHaveAttribute(
      'href',
      '/episodes',
    );
    expect(screen.getByRole('link', { name: 'Cases' })).toHaveAttribute('href', '/cases');
    expect(screen.getByRole('link', { name: 'About' })).toHaveAttribute('href', '/about');
  });

  it('unit_header_has_build_log_link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('href', '/build-log');
  });

  it('unit_header_build_log_label_capitalized', () => {
    render(<Header />);
    expect(screen.getByRole('link', { name: 'Build Log' })).toBeInTheDocument();
    // The lowercase legacy form must be gone
    expect(screen.queryByRole('link', { name: 'Build log' })).toBeNull();
  });

  it('unit_header_has_products_link', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Products' });
    expect(link).toHaveAttribute('href', '/products');
  });

  it('unit_header_nav_includes_cohorts', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Cohorts' });
    expect(link).toHaveAttribute('href', '/cohorts');
  });

  // ─── Integration ───────────────────────────────────────────────────

  it('int_header_uses_container', () => {
    const { container } = render(<Header />);
    const inner = container.querySelector('.mx-auto.max-w-5xl');
    expect(inner).toBeInTheDocument();
  });

  it('int_header_nav_items_use_label_utility', () => {
    render(<Header />);
    const navLinks = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    // Every nav link must carry the `.label` utility class (from so-2.2)
    expect(navLinks.length).toBe(6);
    navLinks.forEach((link) => {
      expect(link.className).toMatch(/\blabel\b/);
    });
  });

  it('int_header_active_on_build_log', () => {
    mockUsePathname.mockReturnValue('/build-log');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_header_active_on_nested_build_log', () => {
    mockUsePathname.mockReturnValue('/build-log/jobs/website-foundation');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_header_not_active_on_other_routes', () => {
    mockUsePathname.mockReturnValue('/episodes');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  it('a11y_header_banner_landmark_preserved', () => {
    render(<Header />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('a11y_header_nav_aria_label_preserved', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Primary');
  });

  it('a11y_header_logo_accessible_name', () => {
    render(<Header />);
    expect(screen.getByLabelText('Fabled 10X')).toBeInTheDocument();
  });

  it('a11y_header_nav_list', () => {
    render(<Header />);
    const nav = screen.getByRole('navigation');
    const ul = nav.querySelector('ul');
    expect(ul).toBeInTheDocument();
    const lis = ul!.querySelectorAll('li');
    expect(lis.length).toBeGreaterThanOrEqual(3);
  });

  it('a11y_header_nav_build_log_has_label', () => {
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAccessibleName('Build Log');
  });

  it('a11y_header_nav_aria_current_when_active', () => {
    mockUsePathname.mockReturnValue('/build-log/status');
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  // ─── Data integrity ────────────────────────────────────────────────

  it('data_header_nav_items_shape', () => {
    render(<Header />);
    const links = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'));
    const items = links.map((link) => ({
      href: link.getAttribute('href'),
      label: link.textContent,
    }));
    expect(items).toEqual([
      { href: '/episodes', label: 'Episodes' },
      { href: '/cases', label: 'Cases' },
      { href: '/build-log', label: 'Build Log' },
      { href: '/cohorts', label: 'Cohorts' },
      { href: '/products', label: 'Products' },
      { href: '/about', label: 'About' },
    ]);
  });

  // ─── Edge ──────────────────────────────────────────────────────────

  it('edge_header_active_state_with_null_pathname', () => {
    mockUsePathname.mockReturnValue(null as unknown as string);
    render(<Header />);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // ─── Infra ─────────────────────────────────────────────────────────

  it('infra_header_no_legacy_classes', () => {
    expect(HEADER_SOURCE).not.toMatch(/border-mist/);
    expect(HEADER_SOURCE).not.toMatch(/\btext-accent\b/);
    expect(HEADER_SOURCE).not.toMatch(/\btext-muted\b/);
    expect(HEADER_SOURCE).not.toMatch(/\btext-foreground\b/);
    expect(HEADER_SOURCE).not.toMatch(/\bh-16\b/);
  });

  it('infra_header_nav_ordering', () => {
    render(<Header />);
    const links = screen
      .getAllByRole('link')
      .filter((el) => el.closest('nav'))
      .map((el) => el.getAttribute('href'));
    const buildLogIdx = links.indexOf('/build-log');
    const cohortsIdx = links.indexOf('/cohorts');
    const productsIdx = links.indexOf('/products');
    expect(cohortsIdx).toBeGreaterThan(buildLogIdx);
    expect(cohortsIdx).toBeLessThan(productsIdx);
  });
});
