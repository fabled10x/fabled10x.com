import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { SectionDivider } from '../SectionDivider';
import { Section } from '../Section';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const SOURCE_FILES: Record<string, string> = {
  Container: 'src/components/site/Container.tsx',
  Section: 'src/components/brand/Section.tsx',
  SectionDivider: 'src/components/brand/SectionDivider.tsx',
};
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const GLOBALS_CSS = readSource('src/app/globals.css');

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

/** SectionDivider's outer wrapper <div> is the rendered root. */
function dividerRoot(container: HTMLElement): HTMLElement {
  return rootElement(container);
}

/** The masked foreground layer inside the BrushstrokeSeam: an SVG-bearing div. */
function brushstrokeMaskedLayer(root: HTMLElement): HTMLElement {
  const svg = root.querySelector('svg[aria-hidden="true"]');
  expect(svg, 'expected aria-hidden SVG inside divider').not.toBeNull();
  const masked = svg!.parentElement as HTMLElement | null;
  expect(masked).not.toBeNull();
  return masked!;
}

/** The BrushstrokeSeam root: parent of the masked foreground layer. */
function brushstrokeRoot(dividerRootEl: HTMLElement): HTMLElement {
  const svg = dividerRootEl.querySelector('svg[aria-hidden="true"]');
  expect(svg, 'expected BrushstrokeSeam SVG').not.toBeNull();
  // SVG.parent = masked foreground layer. masked.parent = BrushstrokeSeam root.
  const masked = svg!.parentElement as HTMLElement | null;
  expect(masked).not.toBeNull();
  const seam = masked!.parentElement as HTMLElement | null;
  expect(seam).not.toBeNull();
  return seam!;
}

describe('SectionDivider — brushstroke seam between page sections', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_divider_outer_div_height_token', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    expect(root.tagName).toBe('DIV');
    expect(root.className).toMatch(/h-\(--space-7\)/);
  });

  it('unit_divider_aria_hidden_true', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    expect(root.getAttribute('aria-hidden')).toBe('true');
  });

  it('unit_divider_mounts_brushstroke_seam', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    // BrushstrokeSeam's signature is an aria-hidden SVG with defs/mask/filter.
    const svg = root.querySelector('svg[aria-hidden="true"]');
    expect(svg).not.toBeNull();
    expect(svg!.querySelector('mask')).not.toBeNull();
    expect(svg!.querySelector('filter')).not.toBeNull();
  });

  it('unit_divider_default_top_marble', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    const masked = brushstrokeMaskedLayer(root);
    // Default top → BrushstrokeSeam foreground → inline style on masked layer
    expect(masked.style.background).toBe('var(--color-marble)');
  });

  it('unit_divider_default_bottom_parchment', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    const seam = brushstrokeRoot(root);
    // Default bottom → BrushstrokeSeam background → inline style on seam root
    expect(seam.style.background).toBe('var(--color-parchment)');
  });

  it('unit_divider_custom_top_bottom_override_defaults', () => {
    const { container } = render(
      <SectionDivider top="var(--color-bone)" bottom="var(--color-shadow)" />
    );
    const root = dividerRoot(container);
    const seam = brushstrokeRoot(root);
    const masked = brushstrokeMaskedLayer(root);
    expect(masked.style.background).toBe('var(--color-bone)');
    expect(seam.style.background).toBe('var(--color-shadow)');
  });

  it('unit_divider_brushstroke_direction_bottom_feather_3rem', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    const masked = brushstrokeMaskedLayer(root);
    // BrushstrokeSeam composes `maskImage` from feather + gradient direction.
    // direction='bottom' → 'to top'; feather='3rem' must appear in maskImage.
    const maskImage = (masked.style.maskImage || (masked.style as CSSStyleDeclaration & { webkitMaskImage?: string }).webkitMaskImage || '') as string;
    expect(maskImage).toMatch(/to top/);
    expect(maskImage).toMatch(/3rem/);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_section_divider_section_sandwich', () => {
    const { container } = render(
      <>
        <Section data-testid="sec-a">A</Section>
        <SectionDivider />
        <Section data-testid="sec-b">B</Section>
      </>
    );
    const a = container.querySelector('[data-testid="sec-a"]') as HTMLElement | null;
    const b = container.querySelector('[data-testid="sec-b"]') as HTMLElement | null;
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    // A divider sits between the two sections in document order.
    const divider = a!.nextElementSibling as HTMLElement | null;
    expect(divider).not.toBeNull();
    expect(divider!.getAttribute('aria-hidden')).toBe('true');
    expect(divider!.querySelector('svg[aria-hidden="true"]')).not.toBeNull();
    expect(divider!.nextElementSibling).toBe(b);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_divider_aria_hidden_decorative', () => {
    // Reinforces unit_divider_aria_hidden_true in the a11y category:
    // headings on either side of a divider — not the divider itself — carry
    // document structure, so the divider must opt out of the accessibility
    // tree.
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.getAttribute('role')).toBeNull();
    expect(root.getAttribute('aria-label')).toBeNull();
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_no_use_client_directive_layout_primitives', () => {
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      expect(src, `${relPath} must NOT start with a 'use client' directive`).not.toMatch(
        /^['"]use client['"]/m
      );
    }
  });

  it('infra_no_forbidden_shadow_or_gradient_classes', () => {
    const FORBIDDEN_TOKENS = [
      /\bshadow-md\b/,
      /\bshadow-lg\b/,
      /\bshadow-xl\b/,
      /\bshadow-2xl\b/,
      /\bdrop-shadow\b/,
      /\bbox-shadow\b/,
      /\bbg-gradient-to-[a-z]\b/,
    ];
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      for (const pattern of FORBIDDEN_TOKENS) {
        expect(src, `${relPath} contains forbidden token ${pattern}`).not.toMatch(pattern);
      }
    }
  });

  it('infra_tailwind4_paren_syntax_not_bracket', () => {
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      // Anti-pattern absent — none of the layout primitives may use bracket
      // syntax for arbitrary token values.
      expect(src, `${relPath} uses bracket Tailwind syntax`).not.toMatch(
        /\b(?:bg|text|px|py|h|w|max-w)-\[var\(/
      );
    }
    // Paren syntax present somewhere in the layout-primitive surface area.
    const allSrc = Object.values(SOURCE_FILES).map(readSource).join('\n');
    expect(allSrc).toMatch(/px-\(--space-5\)/);
    expect(allSrc).toMatch(/md:px-\(--space-7\)/);
    expect(allSrc).toMatch(/h-\(--space-7\)/);
    expect(allSrc).toMatch(/py-\(--section-y-(?:sm|md|lg)\)/);
  });

  it('infra_referenced_tokens_resolve_in_globals_css', () => {
    const REQUIRED_TOKENS = [
      '--space-5',
      '--space-7',
      '--section-y-sm',
      '--section-y-md',
      '--section-y-lg',
      '--color-marble',
      '--color-parchment',
    ];
    for (const token of REQUIRED_TOKENS) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(
        GLOBALS_CSS,
        `globals.css missing declaration for ${token}`
      ).toMatch(declRegex);
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_divider_omit_both_color_props', () => {
    const { container } = render(<SectionDivider />);
    const root = dividerRoot(container);
    const seam = brushstrokeRoot(root);
    const masked = brushstrokeMaskedLayer(root);
    expect(masked.style.background).toBe('var(--color-marble)');
    expect(seam.style.background).toBe('var(--color-parchment)');
  });

  it('edge_divider_color_props_as_hex_strings', () => {
    // Brand-spec Ink (#1c1814) for top, Marble (#f7f4ec) for bottom — verifies
    // the prop type is `string`, NOT a `var(--...)`-only restriction.
    const { container } = render(<SectionDivider top="#1c1814" bottom="#f7f4ec" />);
    const root = dividerRoot(container);
    const seam = brushstrokeRoot(root);
    const masked = brushstrokeMaskedLayer(root);
    expect(masked.style.background).toMatch(/(?:#1c1814|rgb\(28,\s*24,\s*20\))/i);
    expect(seam.style.background).toMatch(/(?:#f7f4ec|rgb\(247,\s*244,\s*236\))/i);
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_missing_from_globals_caught_at_test_time', () => {
    // If any required token were silently removed from globals.css, this
    // suite would fail rather than the consumer rendering an invisible
    // (0-height / no-bg) divider in production.
    const REQUIRED_TOKENS = [
      '--space-5',
      '--space-7',
      '--section-y-sm',
      '--section-y-md',
      '--section-y-lg',
      '--color-marble',
      '--color-parchment',
    ];
    for (const token of REQUIRED_TOKENS) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing required token ${token}`).toMatch(declRegex);
    }
  });
});
