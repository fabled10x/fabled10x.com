import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { DropAccent, type AccentGlyph } from '../DropAccent';
import * as brandBarrel from '..';

const GLYPHS: AccentGlyph[] = ['?', '.', '!', '→', '✕', '✓', '—'];

const baseClasses = [
  /text-\(--color-oxblood\)/,
  /align-baseline/,
  /font-display/,
];

function getGlyphSpan(container: HTMLElement): HTMLSpanElement | null {
  return container.querySelector('span[aria-hidden="true"]');
}

describe('DropAccent', () => {
  // --- Unit ---

  it('unit_drop_accent_renders_each_glyph', () => {
    for (const glyph of GLYPHS) {
      const { container, unmount } = render(<DropAccent glyph={glyph}>headline</DropAccent>);
      const span = getGlyphSpan(container);
      expect(span).not.toBeNull();
      expect(span?.textContent).toBe(glyph);
      unmount();
    }
  });

  it('unit_drop_accent_renders_children_before_glyph', () => {
    const { container } = render(
      <h1>
        <DropAccent glyph="?">Build a 10x agency</DropAccent>
      </h1>
    );
    const h1 = container.querySelector('h1');
    expect(h1?.textContent).toBe('Build a 10x agency?');
    const childNodes = Array.from(h1!.childNodes);
    expect(childNodes[0]?.textContent).toBe('Build a 10x agency');
    expect(childNodes[childNodes.length - 1]).toBe(getGlyphSpan(container));
  });

  it('unit_drop_accent_glyph_span_aria_hidden', () => {
    const { container } = render(<DropAccent glyph="!">title</DropAccent>);
    const span = getGlyphSpan(container);
    expect(span).not.toBeNull();
    expect(span?.getAttribute('aria-hidden')).toBe('true');
  });

  it('unit_drop_accent_glyph_span_has_oxblood_color_class', () => {
    const { container } = render(<DropAccent glyph=".">title</DropAccent>);
    const span = getGlyphSpan(container);
    expect(span?.className).toMatch(/text-\(--color-oxblood\)/);
  });

  it('unit_drop_accent_glyph_span_has_font_display_class', () => {
    const { container } = render(<DropAccent glyph="→">title</DropAccent>);
    const span = getGlyphSpan(container);
    expect(span?.className).toMatch(/font-display/);
  });

  it('unit_drop_accent_glyph_span_has_align_baseline_class', () => {
    const { container } = render(<DropAccent glyph="✓">title</DropAccent>);
    const span = getGlyphSpan(container);
    expect(span?.className).toMatch(/align-baseline/);
  });

  it('unit_drop_accent_size_inline_class', () => {
    const { container } = render(
      <DropAccent glyph="?" size="inline">headline</DropAccent>
    );
    const span = getGlyphSpan(container);
    expect(span?.className).toMatch(/text-\[1\.5em\]/);
    expect(span?.className).toMatch(/leading-none/);
    expect(span?.className).not.toMatch(/ml-\[/);
  });

  it('unit_drop_accent_size_large_class', () => {
    const { container } = render(
      <DropAccent glyph="?" size="large">headline</DropAccent>
    );
    const span = getGlyphSpan(container);
    expect(span?.className).toMatch(/text-\[1\.8em\]/);
    expect(span?.className).toMatch(/leading-none/);
    expect(span?.className).toMatch(/ml-\[0\.1em\]/);
  });

  it('unit_drop_accent_size_thumbnail_class', () => {
    const { container } = render(
      <DropAccent glyph="?" size="thumbnail">headline</DropAccent>
    );
    const span = getGlyphSpan(container);
    expect(span?.className).toMatch(/text-\[2\.2em\]/);
    expect(span?.className).toMatch(/leading-none/);
    expect(span?.className).toMatch(/ml-\[0\.05em\]/);
  });

  it('unit_drop_accent_size_defaults_to_large', () => {
    const { container: defaulted } = render(<DropAccent glyph="?">a</DropAccent>);
    const { container: explicit } = render(
      <DropAccent glyph="?" size="large">a</DropAccent>
    );
    expect(getGlyphSpan(defaulted)?.className).toBe(getGlyphSpan(explicit)?.className);
  });

  it('unit_drop_accent_returns_fragment_not_wrapper_element', () => {
    const { container } = render(
      <h1>
        foo
        <DropAccent glyph="?" />
      </h1>
    );
    const h1 = container.querySelector('h1');
    // h1 directly contains: "foo" text node + glyph span sibling
    const childCount = h1!.childNodes.length;
    expect(childCount).toBe(2);
    expect(h1!.childNodes[0]?.nodeType).toBe(Node.TEXT_NODE);
    expect(h1!.childNodes[0]?.textContent).toBe('foo');
    expect((h1!.childNodes[1] as HTMLElement).tagName).toBe('SPAN');
  });

  // --- Integration ---

  it('integration_drop_accent_inside_headline_context', () => {
    const { container } = render(
      <h1 className="display-1">
        <DropAccent glyph="?">Build a 10x agency</DropAccent>
      </h1>
    );
    const h1 = container.querySelector('h1');
    expect(h1?.className).toContain('display-1');
    expect(h1?.textContent).toBe('Build a 10x agency?');
    const span = getGlyphSpan(container);
    expect(span?.textContent).toBe('?');
    for (const classRe of baseClasses) {
      expect(span?.className).toMatch(classRe);
    }
  });

  it('integration_drop_accent_barrel_export', () => {
    expect(brandBarrel).toHaveProperty('DropAccent');
    expect(brandBarrel.DropAccent).toBe(DropAccent);
  });

  // --- Accessibility ---

  it('a11y_drop_accent_glyph_aria_hidden_from_screen_readers', () => {
    const { container } = render(<DropAccent glyph="?">Build a 10x agency</DropAccent>);
    const span = getGlyphSpan(container);
    expect(span?.getAttribute('aria-hidden')).toBe('true');
    // No aria-label or role that would re-introduce announced content
    expect(span?.getAttribute('aria-label')).toBeNull();
  });

  it('a11y_drop_accent_no_text_alternative_required', () => {
    const { container } = render(<DropAccent glyph="✕">Stop</DropAccent>);
    const span = getGlyphSpan(container);
    expect(span?.getAttribute('aria-label')).toBeNull();
    expect(span?.getAttribute('role')).toBeNull();
    expect(span?.getAttribute('title')).toBeNull();
  });

  // --- Infrastructure ---

  it('infra_brand_barrel_re_exports_drop_accent', () => {
    expect(brandBarrel).toHaveProperty('DropAccent');
  });

  it('infra_drop_accent_no_use_client_directive', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/components/brand/DropAccent.tsx'),
      'utf8'
    );
    // First non-empty, non-comment line must NOT be 'use client'
    expect(source).not.toMatch(/^['"]use client['"]/m);
  });

  // --- Edge case ---

  it('edge_drop_accent_no_children_renders_only_glyph', () => {
    const { container } = render(
      <div data-testid="host">
        <DropAccent glyph="?" />
      </div>
    );
    const host = container.querySelector('[data-testid="host"]');
    // host should contain exactly the glyph span (no preceding text nodes)
    expect(host?.childNodes.length).toBe(1);
    const span = host?.childNodes[0] as HTMLElement;
    expect(span.tagName).toBe('SPAN');
    expect(span.getAttribute('aria-hidden')).toBe('true');
  });

  it('edge_drop_accent_empty_string_children', () => {
    const { container } = render(
      <div data-testid="host">
        <DropAccent glyph="!">{''}</DropAccent>
      </div>
    );
    const host = container.querySelector('[data-testid="host"]');
    const span = getGlyphSpan(container);
    expect(span).not.toBeNull();
    expect(span?.textContent).toBe('!');
    // Empty string children must not introduce a stray text node with whitespace
    expect((host?.textContent ?? '').trim()).toBe('!');
  });

  it('edge_drop_accent_complex_jsx_children', () => {
    const { container } = render(
      <p>
        <DropAccent glyph="→">
          <strong>Bold</strong> text
        </DropAccent>
      </p>
    );
    const p = container.querySelector('p');
    expect(p?.querySelector('strong')?.textContent).toBe('Bold');
    expect(p?.textContent).toBe('Bold text→');
    expect(getGlyphSpan(container)?.textContent).toBe('→');
  });

  it('edge_drop_accent_all_glyphs_share_base_classes', () => {
    const classNames = GLYPHS.map((glyph) => {
      const { container, unmount } = render(
        <DropAccent glyph={glyph} size="large">a</DropAccent>
      );
      const cls = getGlyphSpan(container)?.className ?? '';
      unmount();
      return cls;
    });
    // All 7 spans must produce identical class strings
    const unique = new Set(classNames);
    expect(unique.size).toBe(1);
  });
});
