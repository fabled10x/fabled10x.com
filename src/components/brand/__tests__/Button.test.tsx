import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';

import { Button } from '..';
import * as brandBarrel from '..';
import { Marble } from '..';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const BUTTON_SOURCE = 'src/components/brand/Button.tsx';
const GLOBALS_CSS = readSource('src/app/globals.css');

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

describe('Button primitive', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_default_renders_button_tag', () => {
    const { container } = render(<Button>Save</Button>);
    const el = rootElement(container);
    expect(el.tagName).toBe('BUTTON');
  });

  it('unit_default_variant_is_primary', () => {
    const { container } = render(<Button>x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-ink\)/);
    expect(el.className).toMatch(/text-\(--color-marble\)/);
  });

  it('unit_default_size_is_md', () => {
    const { container } = render(<Button>x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/py-\(--space-2\)/);
    expect(el.className).toMatch(/px-\(--space-4\)/);
  });

  it('unit_variant_primary_classes', () => {
    const { container } = render(<Button variant="primary">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-ink\)/);
    expect(el.className).toMatch(/text-\(--color-marble\)/);
    expect(el.className).toMatch(/border-\(--color-ink\)/);
    expect(el.className).toMatch(/hover:bg-\(--color-oxblood\)/);
    expect(el.className).toMatch(/hover:border-\(--color-oxblood\)/);
  });

  it('unit_variant_ghost_classes', () => {
    const { container } = render(<Button variant="ghost">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-transparent/);
    expect(el.className).toMatch(/text-\(--color-ink\)/);
    expect(el.className).toMatch(/border-\(--color-ink\)/);
    expect(el.className).toMatch(/hover:bg-\(--color-ink\)/);
    expect(el.className).toMatch(/hover:text-\(--color-marble\)/);
  });

  it('unit_variant_quiet_classes', () => {
    const { container } = render(<Button variant="quiet">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-transparent/);
    expect(el.className).toMatch(/text-\(--color-ink\)/);
    expect(el.className).toMatch(/border-\(--edge-color-subtle\)/);
    expect(el.className).toMatch(/hover:border-\(--color-ink\)/);
  });

  it('unit_size_sm_classes', () => {
    const { container } = render(<Button size="sm">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\blabel\b/);
    expect(el.className).toMatch(/py-\(--space-1\)/);
    expect(el.className).toMatch(/px-\(--space-3\)/);
  });

  it('unit_size_md_classes', () => {
    const { container } = render(<Button size="md">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\blabel\b/);
    expect(el.className).toMatch(/py-\(--space-2\)/);
    expect(el.className).toMatch(/px-\(--space-4\)/);
  });

  it('unit_size_lg_classes', () => {
    const { container } = render(<Button size="lg">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\blabel\b/);
    expect(el.className).toMatch(/py-\(--space-3\)/);
    expect(el.className).toMatch(/px-\(--space-5\)/);
    expect(el.className).toMatch(/\btext-sm\b/);
  });

  it('unit_base_classes_present_on_every_variant_size', () => {
    const variants = ['primary', 'ghost', 'quiet'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const variant of variants) {
      for (const size of sizes) {
        const { container, unmount } = render(
          <Button variant={variant} size={size}>x</Button>
        );
        const el = rootElement(container);
        expect(el.className, `${variant}/${size} missing inline-flex`).toMatch(/\binline-flex\b/);
        expect(el.className, `${variant}/${size} missing items-center`).toMatch(/\bitems-center\b/);
        expect(el.className, `${variant}/${size} missing justify-center`).toMatch(/\bjustify-center\b/);
        expect(el.className, `${variant}/${size} missing gap`).toMatch(/gap-\(--space-2\)/);
        expect(el.className, `${variant}/${size} missing transition-colors`).toMatch(/\btransition-colors\b/);
        expect(el.className, `${variant}/${size} missing duration-150`).toMatch(/\bduration-150\b/);
        expect(el.className, `${variant}/${size} missing cursor-pointer`).toMatch(/\bcursor-pointer\b/);
        unmount();
      }
    }
  });

  it('unit_disabled_styling_classes', () => {
    const { container } = render(<Button>x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/disabled:opacity-50/);
    expect(el.className).toMatch(/disabled:cursor-not-allowed/);
  });

  it('unit_focus_visible_ring_classes', () => {
    const { container } = render(<Button>x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/focus-visible:outline\b/);
    expect(el.className).toMatch(/focus-visible:outline-2/);
    expect(el.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
    expect(el.className).toMatch(/focus-visible:outline-offset-2/);
  });

  it('unit_renders_children', () => {
    const { container } = render(<Button>Save changes</Button>);
    const el = rootElement(container);
    expect(el.textContent).toBe('Save changes');
  });

  it('unit_classname_passthrough_appended', () => {
    const { container } = render(<Button className="extra-class custom">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-ink\)/);
    expect(el.className).toMatch(/\bextra-class\b/);
    expect(el.className).toMatch(/\bcustom\b/);
  });

  it('unit_rest_props_passthrough_onclick', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Button onClick={onClick}>x</Button>);
    const el = rootElement(container) as HTMLButtonElement;
    await user.click(el);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('unit_rest_props_passthrough_type_submit', () => {
    const { container } = render(<Button type="submit">x</Button>);
    const el = rootElement(container) as HTMLButtonElement;
    expect(el.type).toBe('submit');
  });

  it('unit_rest_props_passthrough_data_attr', () => {
    const { getByTestId } = render(<Button data-testid="my-btn">x</Button>);
    expect(getByTestId('my-btn')).toBeInTheDocument();
  });

  it('unit_polymorphic_as_a_tag', () => {
    const { container } = render(<Button as="a" href="/somewhere">link</Button>);
    const el = rootElement(container) as HTMLAnchorElement;
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/somewhere');
  });

  it('unit_polymorphic_as_span', () => {
    const { container } = render(<Button as="span">x</Button>);
    const el = rootElement(container);
    expect(el.tagName).toBe('SPAN');
  });

  it('unit_no_rounded_corners_class', () => {
    const variants = ['primary', 'ghost', 'quiet'] as const;
    const sizes = ['sm', 'md', 'lg'] as const;
    for (const variant of variants) {
      for (const size of sizes) {
        const { container, unmount } = render(
          <Button variant={variant} size={size}>x</Button>
        );
        const el = rootElement(container);
        expect(el.className, `${variant}/${size} contains rounded-*`).not.toMatch(/\brounded(?:-\w+)?\b/);
        unmount();
      }
    }
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_button_barrel_export', () => {
    expect(brandBarrel.Button).toBe(Button);
  });

  it('integration_brand_barrel_still_exports_predecessors', () => {
    const expected = ['DropAccent', 'Marble', 'Parchment', 'Bone', 'Shadow', 'BrushstrokeSeam', 'HeroBackdrop', 'Logo', 'Section', 'SectionDivider'];
    for (const name of expected) {
      expect(brandBarrel, `barrel missing predecessor ${name}`).toHaveProperty(name);
    }
  });

  it('integration_button_inside_form_as_submit', async () => {
    const onSubmit = vi.fn((e: React.FormEvent) => e.preventDefault());
    const user = userEvent.setup();
    const { container } = render(
      <form onSubmit={onSubmit}>
        <Button type="submit">Send</Button>
      </form>
    );
    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();
    await user.click(btn!);
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('integration_button_with_marble_surface_composition', () => {
    const { container } = render(
      <Marble data-testid="surface">
        <Button data-testid="cta">Go</Button>
      </Marble>
    );
    const surface = container.querySelector('[data-testid="surface"]') as HTMLElement | null;
    const cta = container.querySelector('[data-testid="cta"]') as HTMLElement | null;
    expect(surface).not.toBeNull();
    expect(cta).not.toBeNull();
    expect(surface!.className).toMatch(/bg-\(--color-marble\)/);
    expect(cta!.tagName).toBe('BUTTON');
    expect(surface!.contains(cta)).toBe(true);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_focus_visible_ring_oxblood', () => {
    const { container } = render(<Button>x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
  });

  it('a11y_disabled_button_announces_disabled', () => {
    const { container } = render(<Button disabled>x</Button>);
    const el = rootElement(container) as HTMLButtonElement;
    expect(el.disabled).toBe(true);
  });

  it('a11y_polymorphic_a_keeps_link_semantics', () => {
    const { container } = render(<Button as="a" href="/x">link</Button>);
    const el = rootElement(container) as HTMLAnchorElement;
    expect(el.tagName).toBe('A');
    expect(el.getAttribute('href')).toBe('/x');
  });

  it('a11y_no_aria_hidden_default', () => {
    const { container } = render(<Button>visible</Button>);
    const el = rootElement(container);
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_no_use_client_directive', () => {
    const src = readSource(BUTTON_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_no_forbidden_shadow_class', () => {
    const src = readSource(BUTTON_SOURCE);
    const FORBIDDEN = /\b(?:shadow-md|shadow-lg|shadow-xl|shadow-2xl|drop-shadow|box-shadow)\b/;
    expect(src).not.toMatch(FORBIDDEN);
  });

  it('infra_tailwind4_paren_syntax_not_bracket', () => {
    const src = readSource(BUTTON_SOURCE);
    expect(src).toMatch(/bg-\(--color-[a-z-]+\)/);
    expect(src).toMatch(/text-\(--color-[a-z-]+\)/);
    expect(src).not.toMatch(/bg-\[/);
    expect(src).not.toMatch(/text-\[color:/);
  });

  it('infra_barrel_export_count_includes_button', () => {
    const expected = new Set([
      'DropAccent',
      'Marble',
      'Parchment',
      'Bone',
      'Shadow',
      'BrushstrokeSeam',
      'HeroBackdrop',
      'Logo',
      'Section',
      'SectionDivider',
      'Button',
    ]);
    const actual = new Set(
      Object.keys(brandBarrel).filter((key) => /^[A-Z]/.test(key))
    );
    expect(actual).toEqual(expected);
  });

  it('infra_sibling_surfaces_whitelist_includes_button', () => {
    // Sibling sentinel sync: Surfaces.test.tsx whitelist Set must include 'Button'.
    const surfacesSrc = readSource('src/components/brand/__tests__/Surfaces.test.tsx');
    // Pull the multi-element Set literal from the source and assert it lists Button.
    expect(surfacesSrc).toMatch(/new Set\(\[[\s\S]*?'Button'[\s\S]*?\]\)/);
  });

  it('infra_sibling_brushstroke_whitelist_includes_button', () => {
    const brushSrc = readSource('src/components/brand/__tests__/BrushstrokeSeam.test.tsx');
    expect(brushSrc).toMatch(/new Set\(\[[\s\S]*?'Button'[\s\S]*?\]\)/);
  });

  it('infra_sibling_logo_whitelist_includes_button', () => {
    const logoSrc = readSource('src/components/brand/__tests__/Logo.test.tsx');
    expect(logoSrc).toMatch(/new Set\(\[[\s\S]*?'Button'[\s\S]*?\]\)/);
  });

  it('infra_tokens_resolve_in_globals_css', () => {
    const src = readSource(BUTTON_SOURCE);
    const tokens = new Set<string>();
    for (const m of src.matchAll(/--(?:color|edge-color|space|pair)[a-z0-9-]*/g)) {
      tokens.add(m[0]);
    }
    expect(tokens.size).toBeGreaterThan(0);
    for (const token of tokens) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing declaration for ${token}`).toMatch(declRegex);
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_undefined_classname', () => {
    const { container } = render(<Button>x</Button>);
    const el = rootElement(container);
    expect(el.className).not.toMatch(/\s\s+/);
    expect(el.className).toBe(el.className.trim());
  });

  it('edge_input_empty_string_classname', () => {
    const { container } = render(<Button className="">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-ink\)/);
    expect(el.className).not.toMatch(/\s\s+/);
    expect(el.className).toBe(el.className.trim());
  });

  it('edge_input_no_children', () => {
    const { container } = render(<Button />);
    const el = rootElement(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.textContent).toBe('');
  });

  it('edge_input_complex_jsx_children', () => {
    const { container } = render(
      <Button>
        <span data-testid="icon">★</span>
        Save
      </Button>
    );
    const el = rootElement(container);
    expect(el.querySelector('[data-testid="icon"]')?.textContent).toBe('★');
    expect(el.textContent).toContain('Save');
  });

  it('edge_input_disabled_true', async () => {
    const onClick = vi.fn();
    const user = userEvent.setup();
    const { container } = render(<Button disabled onClick={onClick}>x</Button>);
    const el = rootElement(container) as HTMLButtonElement;
    expect(el.disabled).toBe(true);
    await user.click(el);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('edge_input_caller_classname_does_not_strip_base', () => {
    const { container } = render(<Button className="bg-(--color-bone)">x</Button>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-ink\)/);
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_globals_check', () => {
    const REQUIRED_TOKENS = [
      '--color-ink',
      '--color-marble',
      '--color-oxblood',
      '--edge-color-subtle',
      '--space-1',
      '--space-2',
      '--space-3',
      '--space-4',
      '--space-5',
    ];
    for (const token of REQUIRED_TOKENS) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing token ${token}`).toMatch(declRegex);
    }
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_serialization_classname_construction_deterministic', () => {
    const renders = [
      render(<Button variant="primary" size="md" className="foo">x</Button>),
      render(<Button variant="primary" size="md" className="foo">x</Button>),
      render(<Button variant="primary" size="md" className="foo">x</Button>),
      render(<Button variant="primary" size="md" className="foo">x</Button>),
      render(<Button variant="primary" size="md" className="foo">x</Button>),
    ];
    const classNames = renders.map((r) => rootElement(r.container).className);
    const unique = new Set(classNames);
    expect(unique.size).toBe(1);
    renders.forEach((r) => r.unmount());
  });

  it('data_consistency_variant_class_record_keys_match_union', () => {
    const src = readSource(BUTTON_SOURCE);
    // Source declares Variant union with exactly: primary | ghost | quiet
    expect(src).toMatch(/Variant\s*=\s*['"]primary['"]\s*\|\s*['"]ghost['"]\s*\|\s*['"]quiet['"]/);
    // Source declares variantClass Record with all three keys
    expect(src).toMatch(/variantClass[\s\S]{0,200}primary\s*:/);
    expect(src).toMatch(/variantClass[\s\S]{0,400}ghost\s*:/);
    expect(src).toMatch(/variantClass[\s\S]{0,600}quiet\s*:/);
  });

  it('data_consistency_size_class_record_keys_match_union', () => {
    const src = readSource(BUTTON_SOURCE);
    // Source declares Size union with exactly: sm | md | lg
    expect(src).toMatch(/Size\s*=\s*['"]sm['"]\s*\|\s*['"]md['"]\s*\|\s*['"]lg['"]/);
    // Source declares sizeClass Record with all three keys
    expect(src).toMatch(/sizeClass[\s\S]{0,200}sm\s*:/);
    expect(src).toMatch(/sizeClass[\s\S]{0,400}md\s*:/);
    expect(src).toMatch(/sizeClass[\s\S]{0,600}lg\s*:/);
  });
});
