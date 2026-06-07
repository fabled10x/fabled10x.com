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

  // ─── so-4.2 ratification pins ──────────────────────────────────────
  //
  // Hybrid red-phase posture (per so-5.3 EmailCapture precedent): the
  // tests above PRESERVE the NavLink behavior; the tests below pin the
  // so-4.2 design-doc decisions (no-transform, no-underline, use-client
  // boundary, transition-colors-only, focus-outline integrity).

  it('unit_navlink_is_use_client', () => {
    // First line of the source must be the 'use client' directive
    // (or the directive must be the first non-whitespace token).
    expect(NAVLINK_SOURCE).toMatch(/^\s*['"]use client['"]/);
  });

  it('unit_navlink_no_hover_transform_in_source', () => {
    expect(NAVLINK_SOURCE).not.toMatch(/hover:scale-/);
    expect(NAVLINK_SOURCE).not.toMatch(/hover:translate-/);
    expect(NAVLINK_SOURCE).not.toMatch(/hover:rotate-/);
    expect(NAVLINK_SOURCE).not.toMatch(/hover:skew-/);
    expect(NAVLINK_SOURCE).not.toMatch(/hover:transform\b/);
  });

  it('unit_navlink_no_hover_underline_in_source', () => {
    expect(NAVLINK_SOURCE).not.toMatch(/hover:underline/);
  });

  it('unit_navlink_uses_transition_colors_only', () => {
    // transition-colors (specific) ≠ transition-all (sweeps in transform,
    // opacity, etc. that brand discipline doesn't want animated).
    expect(NAVLINK_SOURCE).toMatch(/\btransition-colors\b/);
    expect(NAVLINK_SOURCE).not.toMatch(/\btransition-all\b/);
    expect(NAVLINK_SOURCE).not.toMatch(/\btransition\s/);
  });

  it('a11y_navlink_inactive_color_distinguishable_from_active', () => {
    mockUsePathname.mockReturnValue('/cases');

    // Inactive route — must carry the marble-text token, NOT bare oxblood
    render(
      <NavLink href="/episodes" className="label">
        Episodes
      </NavLink>,
    );
    const inactive = screen.getByRole('link', { name: 'Episodes' });
    expect(inactive.className).toMatch(/text-\(--pair-text-on-marble\)/);
    expect(inactive.className).not.toMatch(
      /(?<!hover:)text-\(--color-oxblood\)/,
    );
  });

  it('infra_navlink_pair_text_on_marble_resolves', () => {
    const globalsCss = readFileSync(
      join(process.cwd(), 'src/app/globals.css'),
      'utf8',
    );
    expect(globalsCss).toMatch(/--pair-text-on-marble:\s*[^;]+;/);
  });

  it('infra_navlink_no_hover_transform_classes', () => {
    // Compound regex variant of the unit pin — covers any
    // hover:(scale|translate|rotate|transform|skew)-* token in any order.
    expect(NAVLINK_SOURCE).not.toMatch(
      /hover:(scale|translate|rotate|transform|skew)-/,
    );
  });

  it('infra_navlink_no_focus_outline_override', () => {
    // No focus:outline-none without a focus-visible: replacement.
    // Brand discipline keeps the browser default outline until the a11y
    // polish section (9.x) ships focus-visible:outline-(--color-oxblood).
    const hasFocusOutlineNone = /focus:outline-none/.test(NAVLINK_SOURCE);
    const hasFocusVisibleReplacement = /focus-visible:outline/.test(
      NAVLINK_SOURCE,
    );
    if (hasFocusOutlineNone) {
      expect(hasFocusVisibleReplacement).toBe(true);
    } else {
      expect(hasFocusOutlineNone).toBe(false);
    }
  });

  it('err_navlink_renders_with_empty_class', () => {
    // No className prop — defensive default '' must produce a valid <a>
    // with the active/inactive token classes still applied.
    mockUsePathname.mockReturnValue('/cases');
    render(<NavLink href="/episodes">Episodes</NavLink>);
    const link = screen.getByRole('link', { name: 'Episodes' });
    expect(link.tagName).toBe('A');
    expect(link.className).toMatch(/text-\(--pair-text-on-marble\)/);
  });
});
