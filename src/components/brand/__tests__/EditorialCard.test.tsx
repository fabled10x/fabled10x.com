import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { EditorialCard } from '..';
import * as brandBarrel from '..';
import { Marble } from '..';
import type { AccentGlyph } from '..';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const EDITORIAL_SOURCE = 'src/components/brand/EditorialCard.tsx';
const GLOBALS_CSS = readSource('src/app/globals.css');

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

function findArticle(container: HTMLElement): HTMLElement {
  const article = container.querySelector('article');
  expect(article).not.toBeNull();
  return article as HTMLElement;
}

describe('EditorialCard primitive', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_renders_article_root', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const el = rootElement(container);
    expect(el.tagName).toBe('ARTICLE');
  });

  it('unit_root_has_marble_surface_classes', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    expect(article.className).toMatch(/bg-\(--color-marble\)/);
    expect(article.className).toMatch(/text-\(--pair-text-on-marble\)/);
  });

  it('unit_root_has_ink_border', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    expect(article.className).toMatch(/\bborder\b/);
    expect(article.className).toMatch(/border-\(--color-ink\)/);
  });

  it('unit_root_has_padding_and_flex_layout', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    expect(article.className).toMatch(/p-\(--space-5\)/);
    expect(article.className).toMatch(/\bflex\b/);
    expect(article.className).toMatch(/\bflex-col\b/);
    expect(article.className).toMatch(/gap-\(--space-3\)/);
  });

  it('unit_root_has_transition_classes', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    expect(article.className).toMatch(/\btransition-colors\b/);
    expect(article.className).toMatch(/\bduration-150\b/);
  });

  it('unit_renders_headline_in_h3_with_display3', () => {
    const { container } = render(<EditorialCard headline="My Headline" />);
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.className).toMatch(/\bdisplay-3\b/);
    expect(h3!.textContent).toContain('My Headline');
  });

  it('unit_renders_tag_when_provided', () => {
    const { container } = render(<EditorialCard tag="Build Log" headline="X" />);
    const span = container.querySelector('span.label');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('Build Log');
  });

  it('unit_omits_tag_span_when_tag_absent', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const span = container.querySelector('span.label');
    expect(span).toBeNull();
  });

  it('unit_renders_subtitle_in_p_with_body2_muted', () => {
    const { container } = render(<EditorialCard headline="X" subtitle="A one-liner." />);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.className).toMatch(/\bbody-2\b/);
    expect(p!.className).toMatch(/text-\(--color-muted\)/);
    expect(p!.textContent).toBe('A one-liner.');
  });

  it('unit_omits_subtitle_p_when_absent', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const p = container.querySelector('p');
    expect(p).toBeNull();
  });

  it('unit_renders_footer_when_provided', () => {
    const { container } = render(
      <EditorialCard headline="X" footer={<span data-testid="foot-content">Footer A</span>} />
    );
    const foot = container.querySelector('[data-testid="foot-content"]') as HTMLElement | null;
    expect(foot).not.toBeNull();
    const footerDiv = foot!.parentElement as HTMLElement;
    expect(footerDiv.tagName).toBe('DIV');
    expect(footerDiv.className).toMatch(/mt-\(--space-2\)/);
    expect(footerDiv.className).toMatch(/\bflex\b/);
    expect(footerDiv.className).toMatch(/\bitems-center\b/);
    expect(footerDiv.className).toMatch(/gap-\(--space-3\)/);
  });

  it('unit_omits_footer_div_when_absent', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    // Avoid :scope selector — jsdom's nwsapi mis-parses Tailwind 4 paren tokens
    // in the parent compound. Iterate direct children instead.
    const divs = Array.from(article.children).filter((c) => c.tagName === 'DIV');
    expect(divs.length).toBe(0);
  });

  it('unit_accent_renders_dropaccent_in_headline', () => {
    const { container } = render(<EditorialCard headline="Hello" accent="?" />);
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.textContent).toContain('Hello');
    // DropAccent emits an aria-hidden Oxblood span carrying the glyph
    const accentSpan = h3.querySelector('span[aria-hidden="true"]') as HTMLElement | null;
    expect(accentSpan).not.toBeNull();
    expect(accentSpan!.textContent).toBe('?');
    expect(accentSpan!.className).toMatch(/text-\(--color-oxblood\)/);
  });

  it('unit_accent_uses_inline_size', () => {
    const { container } = render(<EditorialCard headline="X" accent="?" />);
    const accentSpan = container.querySelector(
      'h3 span[aria-hidden="true"]'
    ) as HTMLElement | null;
    expect(accentSpan).not.toBeNull();
    // DropAccent size="inline" → text-[1.5em] leading-none
    expect(accentSpan!.className).toMatch(/\btext-\[1\.5em\]/);
    expect(accentSpan!.className).toMatch(/\bleading-none\b/);
  });

  it('unit_no_accent_when_accent_absent', () => {
    const { container } = render(<EditorialCard headline="Just Text" />);
    const h3 = container.querySelector('h3') as HTMLElement;
    const accentSpan = h3.querySelector('span[aria-hidden="true"]');
    expect(accentSpan).toBeNull();
    expect(h3.textContent).toBe('Just Text');
  });

  it('unit_href_wraps_article_in_link', () => {
    const { container } = render(<EditorialCard headline="X" href="/x" />);
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    const article = root.querySelector('article');
    expect(article).not.toBeNull();
  });

  it('unit_link_href_attribute_set', () => {
    const { container } = render(<EditorialCard headline="X" href="/some/path" />);
    const root = rootElement(container) as HTMLAnchorElement;
    expect(root.getAttribute('href')).toBe('/some/path');
  });

  it('unit_link_has_focus_visible_outline_classes', () => {
    const { container } = render(<EditorialCard headline="X" href="/x" />);
    const root = rootElement(container);
    expect(root.className).toMatch(/focus-visible:outline\b/);
    expect(root.className).toMatch(/focus-visible:outline-2/);
    expect(root.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
    expect(root.className).toMatch(/focus-visible:outline-offset-2/);
  });

  it('unit_link_has_block_class', () => {
    const { container } = render(<EditorialCard headline="X" href="/x" />);
    const root = rootElement(container);
    expect(root.className).toMatch(/\bblock\b/);
  });

  it('unit_href_present_adds_hover_bone_and_cursor', () => {
    const { container } = render(<EditorialCard headline="X" href="/x" />);
    const article = findArticle(container);
    expect(article.className).toMatch(/hover:bg-\(--color-bone\)/);
    expect(article.className).toMatch(/\bcursor-pointer\b/);
  });

  it('unit_href_absent_omits_hover_bone_and_cursor', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    expect(article.className).not.toMatch(/hover:bg-\(--color-bone\)/);
    expect(article.className).not.toMatch(/\bcursor-pointer\b/);
  });

  it('unit_classname_passthrough_appended', () => {
    const { container } = render(<EditorialCard headline="X" className="extra-class custom" />);
    const article = findArticle(container);
    expect(article.className).toMatch(/bg-\(--color-marble\)/);
    expect(article.className).toMatch(/\bextra-class\b/);
    expect(article.className).toMatch(/\bcustom\b/);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_editorial_card_barrel_export', () => {
    expect(brandBarrel.EditorialCard).toBe(EditorialCard);
  });

  it('integration_brand_barrel_still_exports_predecessors', () => {
    const expected = [
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
    ];
    for (const name of expected) {
      expect(brandBarrel, `barrel missing predecessor ${name}`).toHaveProperty(name);
    }
  });

  it('integration_composes_with_dropaccent', () => {
    const { container } = render(<EditorialCard headline="The Q" accent="?" />);
    const h3 = container.querySelector('h3') as HTMLElement;
    // Both the text and DropAccent's aria-hidden span are present
    expect(h3.textContent).toContain('The Q');
    expect(h3.textContent).toContain('?');
    const accentSpan = h3.querySelector('span[aria-hidden="true"]');
    expect(accentSpan).not.toBeNull();
  });

  it('integration_link_composes_inside_marble_grid', () => {
    const { container } = render(
      <Marble data-testid="surface">
        <EditorialCard headline="X" href="/x" />
      </Marble>
    );
    const surface = container.querySelector('[data-testid="surface"]') as HTMLElement;
    expect(surface).not.toBeNull();
    const link = surface.querySelector('a') as HTMLAnchorElement | null;
    expect(link).not.toBeNull();
    const article = link!.querySelector('article');
    expect(article).not.toBeNull();
    // No nested <a> or <button> inside the wrapping <a>
    expect(link!.querySelectorAll('a, button').length).toBe(0);
  });

  // ─── Security ──────────────────────────────────────────────────────────

  it('sec_info_disclosure_no_dangerously_set_inner_html', () => {
    const src = readSource(EDITORIAL_SOURCE);
    expect(src).not.toMatch(/dangerouslySetInnerHTML/);
  });

  it('sec_tampering_text_content_escapes_html_tags', () => {
    const malicious = '<script>alert(1)</script>';
    const { container } = render(<EditorialCard headline={malicious} />);
    const h3 = container.querySelector('h3') as HTMLElement;
    // The malicious string is text content, not a parsed <script>
    expect(h3.textContent).toContain('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_root_uses_article_semantic', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
  });

  it('a11y_headline_uses_h3', () => {
    const { container } = render(<EditorialCard headline="Title" />);
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.textContent).toContain('Title');
  });

  it('a11y_link_focus_visible_outline_oxblood', () => {
    const { container } = render(<EditorialCard headline="X" href="/x" />);
    const link = rootElement(container);
    expect(link.tagName).toBe('A');
    expect(link.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
  });

  it('a11y_accent_glyph_aria_hidden', () => {
    const { container } = render(<EditorialCard headline="X" accent="?" />);
    const accentSpan = container.querySelector('h3 span[aria-hidden="true"]');
    expect(accentSpan).not.toBeNull();
    expect(accentSpan!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a11y_no_nested_interactive_elements', () => {
    const { container } = render(
      <EditorialCard
        headline="X"
        href="/x"
        footer={<span data-testid="status">Open</span>}
      />
    );
    const link = rootElement(container);
    expect(link.tagName).toBe('A');
    // No nested anchor or button inside the wrapping link
    expect(link.querySelectorAll('a').length).toBe(0);
    expect(link.querySelectorAll('button').length).toBe(0);
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_no_use_client_directive', () => {
    const src = readSource(EDITORIAL_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_no_forbidden_shadow_class', () => {
    const src = readSource(EDITORIAL_SOURCE);
    const FORBIDDEN = /\b(?:shadow-md|shadow-lg|shadow-xl|shadow-2xl|drop-shadow|box-shadow)\b/;
    expect(src).not.toMatch(FORBIDDEN);
  });

  it('infra_no_rounded_corners_class', () => {
    const src = readSource(EDITORIAL_SOURCE);
    expect(src).not.toMatch(/\brounded(?:-\w+)?\b/);
  });

  it('infra_tailwind4_paren_syntax_not_bracket', () => {
    const src = readSource(EDITORIAL_SOURCE);
    expect(src).toMatch(/bg-\(--color-[a-z-]+\)/);
    expect(src).toMatch(/text-\(--color-[a-z-]+\)|text-\(--pair-[a-z-]+\)/);
    expect(src).not.toMatch(/bg-\[--/);
    expect(src).not.toMatch(/text-\[color:/);
  });

  it('infra_tokens_resolve_in_globals_css', () => {
    const src = readSource(EDITORIAL_SOURCE);
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

  it('infra_barrel_export_count_includes_editorial_card', () => {
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
      'EditorialCard',
    ]);
    const actual = new Set(
      Object.keys(brandBarrel).filter((key) => /^[A-Z]/.test(key))
    );
    expect(actual).toEqual(expected);
  });

  it('infra_sibling_surfaces_whitelist_includes_editorial_card', () => {
    const src = readSource('src/components/brand/__tests__/Surfaces.test.tsx');
    expect(src).toMatch(/new Set\(\[[\s\S]*?'EditorialCard'[\s\S]*?\]\)/);
  });

  it('infra_sibling_brushstroke_whitelist_includes_editorial_card', () => {
    const src = readSource('src/components/brand/__tests__/BrushstrokeSeam.test.tsx');
    expect(src).toMatch(/new Set\(\[[\s\S]*?'EditorialCard'[\s\S]*?\]\)/);
  });

  it('infra_sibling_logo_whitelist_includes_editorial_card', () => {
    const src = readSource('src/components/brand/__tests__/Logo.test.tsx');
    expect(src).toMatch(/new Set\(\[[\s\S]*?'EditorialCard'[\s\S]*?\]\)/);
  });

  it('infra_sibling_button_whitelist_includes_editorial_card', () => {
    const src = readSource('src/components/brand/__tests__/Button.test.tsx');
    expect(src).toMatch(/new Set\(\[[\s\S]*?'EditorialCard'[\s\S]*?\]\)/);
  });

  it('infra_sibling_section_whitelist_includes_editorial_card', () => {
    const src = readSource('src/components/brand/__tests__/Section.test.tsx');
    expect(src).toMatch(/new Set\(\[[\s\S]*?'EditorialCard'[\s\S]*?\]\)/);
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_minimal_props_headline_only', () => {
    const { container } = render(<EditorialCard headline="X" />);
    const article = findArticle(container);
    // No label span, no body-2 p, no footer div, no <a> wrapper
    expect(article.querySelector('span.label')).toBeNull();
    expect(article.querySelector('p')).toBeNull();
    // Avoid :scope selector — jsdom's nwsapi mis-parses Tailwind 4 paren tokens
    // in the parent compound. Iterate direct children instead.
    const directDivs = Array.from(article.children).filter((c) => c.tagName === 'DIV');
    expect(directDivs.length).toBe(0);
    expect(rootElement(container).tagName).toBe('ARTICLE');
  });

  it('edge_input_all_props_present', () => {
    const { container } = render(
      <EditorialCard
        tag="Tag"
        headline="Head"
        accent="?"
        subtitle="Sub"
        footer={<span data-testid="ft">f</span>}
        href="/x"
        className="extra"
      />
    );
    // Wrapped in <a>
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    const article = root.querySelector('article') as HTMLElement;
    expect(article).not.toBeNull();
    // Hierarchy in DOM order: tag span → h3 (with accent) → p subtitle → footer div
    const children = Array.from(article.children) as HTMLElement[];
    expect(children[0].tagName).toBe('SPAN');
    expect(children[0].className).toMatch(/\blabel\b/);
    expect(children[1].tagName).toBe('H3');
    expect(children[2].tagName).toBe('P');
    expect(children[3].tagName).toBe('DIV');
    // Accent present inside the h3
    expect(children[1].querySelector('span[aria-hidden="true"]')).not.toBeNull();
    // Footer content present
    expect(container.querySelector('[data-testid="ft"]')).not.toBeNull();
    expect(article.className).toMatch(/\bextra\b/);
  });

  it('edge_input_very_long_headline_does_not_break_layout', () => {
    const long = 'A'.repeat(500);
    const { container } = render(<EditorialCard headline={long} />);
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.className).toMatch(/\bdisplay-3\b/);
    expect(h3.textContent!.length).toBeGreaterThanOrEqual(500);
    const article = findArticle(container);
    expect(article.className).toMatch(/bg-\(--color-marble\)/);
  });

  it('edge_input_empty_string_headline', () => {
    const { container } = render(<EditorialCard headline="" />);
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3).not.toBeNull();
    expect(h3.className).toMatch(/\bdisplay-3\b/);
  });

  it('edge_input_complex_footer_jsx', () => {
    const { container } = render(
      <EditorialCard
        headline="X"
        footer={
          <>
            <span data-testid="a">A</span>
            <span data-testid="b">B</span>
          </>
        }
      />
    );
    const a = container.querySelector('[data-testid="a"]');
    const b = container.querySelector('[data-testid="b"]');
    expect(a).not.toBeNull();
    expect(b).not.toBeNull();
    const footerDiv = a!.parentElement as HTMLElement;
    expect(footerDiv.tagName).toBe('DIV');
    expect(footerDiv.contains(b!)).toBe(true);
  });

  it('edge_input_all_accent_glyph_variants_render', () => {
    const glyphs: AccentGlyph[] = ['?', '.', '!', '→', '✕', '✓', '—'];
    for (const glyph of glyphs) {
      const { container, unmount } = render(
        <EditorialCard headline="Title" accent={glyph} />
      );
      const h3 = container.querySelector('h3') as HTMLElement;
      const accentSpan = h3.querySelector('span[aria-hidden="true"]') as HTMLElement | null;
      expect(accentSpan, `glyph ${glyph} did not render`).not.toBeNull();
      expect(accentSpan!.textContent).toBe(glyph);
      expect(h3.textContent).toContain('Title');
      unmount();
    }
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_globals_check', () => {
    const REQUIRED_TOKENS = [
      '--color-marble',
      '--color-ink',
      '--color-bone',
      '--color-oxblood',
      '--color-muted',
      '--pair-text-on-marble',
      '--space-2',
      '--space-3',
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
      render(<EditorialCard headline="X" tag="T" subtitle="S" className="foo" />),
      render(<EditorialCard headline="X" tag="T" subtitle="S" className="foo" />),
      render(<EditorialCard headline="X" tag="T" subtitle="S" className="foo" />),
      render(<EditorialCard headline="X" tag="T" subtitle="S" className="foo" />),
      render(<EditorialCard headline="X" tag="T" subtitle="S" className="foo" />),
    ];
    const classNames = renders.map((r) => findArticle(r.container).className);
    expect(new Set(classNames).size).toBe(1);
    renders.forEach((r) => r.unmount());
  });

  it('data_consistency_props_interface_matches_planned_shape', () => {
    const src = readSource(EDITORIAL_SOURCE);
    // EditorialCardProps interface must declare exactly these field names
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}tag\?:\s*string/);
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}headline:\s*string/);
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}accent\?:\s*AccentGlyph/);
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}subtitle\?:\s*string/);
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}footer\?:\s*ReactNode/);
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}href\?:\s*string/);
    expect(src).toMatch(/EditorialCardProps[\s\S]{0,800}className\?:\s*string/);
  });

  it('data_consistency_classname_no_duplicate_spaces', () => {
    const { container } = render(<EditorialCard headline="X" className="" />);
    const article = findArticle(container);
    expect(article.className).not.toMatch(/\s\s+/);
    expect(article.className).toBe(article.className.trim());
  });
});
