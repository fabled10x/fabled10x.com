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
import { NavLink } from '../NavLink';

const mockUsePathname = vi.mocked(usePathname);

const NAVLINK_SOURCE = readFileSync(
  join(process.cwd(), 'src/components/site/NavLink.tsx'),
  'utf8',
);

describe('NavLink', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUsePathname.mockReturnValue('/');
  });

  // ─── Unit: API shape ───────────────────────────────────────────────

  it('unit_navlink_renders_children', () => {
    render(
      <NavLink href="/episodes">
        Episodes
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link).toHaveAttribute('href', '/episodes');
    expect(link.textContent).toBe('Episodes');
  });

  it('unit_navlink_passes_classname_through', () => {
    render(
      <NavLink href="/episodes" className="label">
        Episodes
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link.className).toMatch(/\blabel\b/);
  });

  // ─── Unit: brand-token color discipline ────────────────────────────

  it('unit_navlink_default_color_token', () => {
    mockUsePathname.mockReturnValue('/cases');
    render(
      <NavLink href="/episodes" className="label">
        Episodes
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link.className).toMatch(/text-\(--pair-text-on-marble\)/);
    expect(link.className).toMatch(/hover:text-\(--color-oxblood\)/);
    expect(link.className).not.toMatch(/\btext-accent\b/);
    expect(link.className).not.toMatch(/\btext-muted\b/);
    expect(link.className).not.toMatch(/\btext-foreground\b/);
  });

  it('unit_navlink_active_color_token', () => {
    mockUsePathname.mockReturnValue('/episodes');
    render(
      <NavLink href="/episodes" className="label">
        Episodes
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link.className).toMatch(/text-\(--color-oxblood\)/);
    expect(link.className).not.toMatch(/\btext-accent\b/);
  });

  it('unit_navlink_transition_present', () => {
    render(
      <NavLink href="/episodes" className="label">
        Episodes
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link.className).toMatch(/transition-colors/);
    expect(link.className).toMatch(/duration-150/);
  });

  // ─── Integration: active-state matching ────────────────────────────

  it('int_navlink_active_on_exact_match', () => {
    mockUsePathname.mockReturnValue('/build-log');
    render(<NavLink href="/build-log">Build Log</NavLink>);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_navlink_active_on_nested', () => {
    mockUsePathname.mockReturnValue('/build-log/jobs/website-foundation');
    render(<NavLink href="/build-log">Build Log</NavLink>);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('int_navlink_inactive_on_sibling_route', () => {
    mockUsePathname.mockReturnValue('/build-log-other');
    render(<NavLink href="/build-log">Build Log</NavLink>);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // ─── Accessibility ─────────────────────────────────────────────────

  it('a11y_navlink_aria_current_on_active', () => {
    mockUsePathname.mockReturnValue('/episodes');
    render(<NavLink href="/episodes">Episodes</NavLink>);
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('a11y_navlink_no_aria_current_on_inactive', () => {
    mockUsePathname.mockReturnValue('/cases');
    render(<NavLink href="/episodes">Episodes</NavLink>);
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link).not.toHaveAttribute('aria-current');
  });

  // ─── Edge cases ────────────────────────────────────────────────────

  it('edge_navlink_null_pathname', () => {
    mockUsePathname.mockReturnValue(null as unknown as string);
    render(
      <NavLink href="/episodes" className="label">
        Episodes
      </NavLink>,
    );
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link).not.toHaveAttribute('aria-current');
    expect(link.className).toMatch(/text-\(--pair-text-on-marble\)/);
    // Active color token only appears in the `hover:` modifier — never as a
    // standalone token (would mean active state).
    expect(link.className).not.toMatch(/(?<!hover:)text-\(--color-oxblood\)/);
  });

  it('edge_navlink_root_pathname', () => {
    mockUsePathname.mockReturnValue('/');
    render(<NavLink href="/episodes">Episodes</NavLink>);
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link).not.toHaveAttribute('aria-current');
  });

  it('edge_navlink_trailing_slash_pathname', () => {
    mockUsePathname.mockReturnValue('/build-log/');
    render(<NavLink href="/build-log">Build Log</NavLink>);
    const link = screen.getByRole('link', { name: 'Build Log' });
    expect(link).toHaveAttribute('aria-current', 'page');
  });

  it('edge_navlink_substring_route_not_active', () => {
    mockUsePathname.mockReturnValue('/products-roadmap');
    render(<NavLink href="/products">Products</NavLink>);
    const link = screen.getByRole('link', { name: 'Products' });
    expect(link).not.toHaveAttribute('aria-current', 'page');
  });

  // ─── Infra ─────────────────────────────────────────────────────────

  it('infra_navlink_no_legacy_classes', () => {
    expect(NAVLINK_SOURCE).not.toMatch(/\btext-muted\b/);
    expect(NAVLINK_SOURCE).not.toMatch(/\btext-accent\b/);
    expect(NAVLINK_SOURCE).not.toMatch(/\btext-foreground\b/);
  });
});
