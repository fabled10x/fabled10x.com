import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Marble, Parchment, Bone, Shadow } from '..';
import * as brandBarrel from '..';

const SOURCE_FILES = {
  Marble: 'src/components/brand/Marble.tsx',
  Parchment: 'src/components/brand/Parchment.tsx',
  Bone: 'src/components/brand/Bone.tsx',
  Shadow: 'src/components/brand/Shadow.tsx',
} as const;

type SurfaceName = keyof typeof SOURCE_FILES;
type SurfaceComponent = typeof Marble;

interface SurfaceSpec {
  name: SurfaceName;
  Component: SurfaceComponent;
  bgClass: RegExp;
  textClass: RegExp;
  bgToken: string;
  textToken: string;
}

const SURFACES: SurfaceSpec[] = [
  {
    name: 'Marble',
    Component: Marble,
    bgClass: /bg-\(--color-marble\)/,
    textClass: /text-\(--pair-text-on-marble\)/,
    bgToken: '--color-marble',
    textToken: '--pair-text-on-marble',
  },
  {
    name: 'Parchment',
    Component: Parchment,
    bgClass: /bg-\(--color-parchment\)/,
    textClass: /text-\(--pair-text-on-parchment\)/,
    bgToken: '--color-parchment',
    textToken: '--pair-text-on-parchment',
  },
  {
    name: 'Bone',
    Component: Bone,
    bgClass: /bg-\(--color-bone\)/,
    textClass: /text-\(--pair-text-on-bone\)/,
    bgToken: '--color-bone',
    textToken: '--pair-text-on-bone',
  },
  {
    name: 'Shadow',
    Component: Shadow,
    bgClass: /bg-\(--color-shadow\)/,
    textClass: /text-\(--pair-text-on-shadow\)/,
    bgToken: '--color-shadow',
    textToken: '--pair-text-on-shadow',
  },
];

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const GLOBALS_CSS = readSource('src/app/globals.css');

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

describe('Surface primitives — Marble / Parchment / Bone / Shadow', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it.each(SURFACES)('unit_surface_$name_renders_default_div', ({ Component, bgClass, textClass }) => {
    const { container } = render(<Component>x</Component>);
    const el = rootElement(container);
    expect(el.tagName).toBe('DIV');
    expect(el.className).toMatch(bgClass);
    expect(el.className).toMatch(textClass);
  });

  it('unit_surface_renders_children', () => {
    for (const { Component, name } of SURFACES) {
      const { container, unmount } = render(<Component>hello-{name}</Component>);
      const el = rootElement(container);
      expect(el.textContent).toBe(`hello-${name}`);
      unmount();
    }
  });

  it('unit_surface_edge_none_omits_border', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component edge="none">x</Component>);
      const el = rootElement(container);
      expect(el.className).not.toMatch(/border-\(--edge-color/);
      expect(el.className).not.toMatch(/\bborder\b/);
      unmount();
    }
  });

  it('unit_surface_edge_subtle_adds_subtle_border', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component edge="subtle">x</Component>);
      const el = rootElement(container);
      expect(el.className).toMatch(/border-\(--edge-color-subtle\)/);
      expect(el.className).toMatch(/\bborder\b/);
      unmount();
    }
  });

  it('unit_surface_edge_strong_adds_strong_border', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component edge="strong">x</Component>);
      const el = rootElement(container);
      // edge=strong uses --edge-color (NOT -subtle). Match the bare token with a negative lookahead.
      expect(el.className).toMatch(/border-\(--edge-color\)/);
      expect(el.className).toMatch(/\bborder\b/);
      unmount();
    }
  });

  it('unit_surface_edge_defaults_to_none', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component>x</Component>);
      const el = rootElement(container);
      expect(el.className).not.toMatch(/border-\(--edge-color/);
      unmount();
    }
  });

  it('unit_surface_classname_passthrough_concats', () => {
    for (const { Component, bgClass } of SURFACES) {
      const { container, unmount } = render(<Component className="extra-class custom">x</Component>);
      const el = rootElement(container);
      expect(el.className).toMatch(bgClass);
      expect(el.className).toMatch(/\bextra-class\b/);
      expect(el.className).toMatch(/\bcustom\b/);
      unmount();
    }
  });

  it('unit_surface_polymorphic_as_section', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component as="section">x</Component>);
      const el = rootElement(container);
      expect(el.tagName).toBe('SECTION');
      unmount();
    }
  });

  it('unit_surface_polymorphic_as_article', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component as="article">x</Component>);
      const el = rootElement(container);
      expect(el.tagName).toBe('ARTICLE');
      unmount();
    }
  });

  it('unit_surface_polymorphic_as_aside', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component as="aside">x</Component>);
      const el = rootElement(container);
      expect(el.tagName).toBe('ASIDE');
      unmount();
    }
  });

  it('unit_surface_rest_props_passthrough_id', () => {
    for (const { Component, name } of SURFACES) {
      const id = `hero-${name.toLowerCase()}`;
      const { container, unmount } = render(<Component id={id}>x</Component>);
      const el = rootElement(container);
      expect(el.id).toBe(id);
      unmount();
    }
  });

  it('unit_surface_rest_props_passthrough_data_attr', () => {
    for (const { Component, name } of SURFACES) {
      const testid = `${name.toLowerCase()}-hero`;
      const { getByTestId, unmount } = render(<Component data-testid={testid}>x</Component>);
      expect(getByTestId(testid)).toBeInTheDocument();
      unmount();
    }
  });

  it('unit_surface_no_padding_prop_accepted', () => {
    // TypeScript-level check: surface prop type EXCLUDES a `padding` field.
    // If a `padding` prop existed it would be passed through as a DOM attribute.
    // We assert at runtime that even when `padding` is forced via cast, it does NOT
    // appear as a meaningful surface API — but the canonical assertion is that the
    // SOURCE files do not declare a `padding` field on the props interface.
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      expect(src).not.toMatch(/\bpadding\??:\s*string/);
      expect(src).not.toMatch(/\bpadding\s*=/);
    }
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_surface_barrel_reexports_all_four', () => {
    expect(brandBarrel.Marble).toBe(Marble);
    expect(brandBarrel.Parchment).toBe(Parchment);
    expect(brandBarrel.Bone).toBe(Bone);
    expect(brandBarrel.Shadow).toBe(Shadow);
  });

  it('integration_surface_barrel_still_exports_dropaccent', () => {
    // so-2.3 sibling — must not regress
    expect(brandBarrel).toHaveProperty('DropAccent');
    expect(typeof (brandBarrel as { DropAccent?: unknown }).DropAccent).toBe('function');
  });

  it('integration_surface_composition_marble_wraps_bone', () => {
    const { container } = render(
      <Marble data-testid="outer">
        <Bone data-testid="inner">nested</Bone>
      </Marble>
    );
    const outer = container.querySelector('[data-testid="outer"]') as HTMLElement | null;
    const inner = container.querySelector('[data-testid="inner"]') as HTMLElement | null;
    expect(outer).not.toBeNull();
    expect(inner).not.toBeNull();
    expect(outer!.className).toMatch(/bg-\(--color-marble\)/);
    expect(inner!.className).toMatch(/bg-\(--color-bone\)/);
    expect(outer!.contains(inner)).toBe(true);
  });

  it('integration_surface_composition_shadow_with_marble_section_child', () => {
    const { container } = render(
      <Shadow as="section" data-testid="dark-frame">
        <Marble as="div" data-testid="marble-inset">inset content</Marble>
      </Shadow>
    );
    const outer = container.querySelector('[data-testid="dark-frame"]') as HTMLElement | null;
    const inner = container.querySelector('[data-testid="marble-inset"]') as HTMLElement | null;
    expect(outer).not.toBeNull();
    expect(outer!.tagName).toBe('SECTION');
    expect(outer!.className).toMatch(/bg-\(--color-shadow\)/);
    expect(inner).not.toBeNull();
    expect(inner!.tagName).toBe('DIV');
    expect(inner!.className).toMatch(/bg-\(--color-marble\)/);
    expect(inner!.textContent).toBe('inset content');
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_surface_polymorphic_preserves_semantic_role', () => {
    // <section> has implicit role of region only when it has an accessible name —
    // but the underlying tag must still be SECTION (not stripped to DIV). The
    // surface should not interfere with whatever role the consumer's `as` choice
    // confers natively.
    const { container } = render(
      <Marble as="section" aria-label="hero">content</Marble>
    );
    const el = rootElement(container);
    expect(el.tagName).toBe('SECTION');
    expect(el.getAttribute('aria-label')).toBe('hero');
  });

  it('a11y_surface_contrast_pair_matches_token_decl', () => {
    // Every --pair-text-on-X token must be declared in globals.css and point
    // at a sensible high-contrast partner (ink for light surfaces, parchment
    // for the dark shadow surface).
    const pairings: { token: string; expectedValueRegex: RegExp }[] = [
      { token: '--pair-text-on-marble', expectedValueRegex: /var\(--color-ink\)/ },
      { token: '--pair-text-on-parchment', expectedValueRegex: /var\(--color-ink\)/ },
      { token: '--pair-text-on-bone', expectedValueRegex: /var\(--color-ink\)/ },
      { token: '--pair-text-on-shadow', expectedValueRegex: /var\(--color-parchment\)/ },
    ];
    for (const { token, expectedValueRegex } of pairings) {
      const declRegex = new RegExp(`${token}\\s*:\\s*([^;]+);`);
      const m = GLOBALS_CSS.match(declRegex);
      expect(m, `globals.css missing declaration for ${token}`).not.toBeNull();
      expect(m![1].trim()).toMatch(expectedValueRegex);
    }
  });

  it('a11y_surface_no_aria_hidden_on_default', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component>visible content</Component>);
      const el = rootElement(container);
      expect(el.getAttribute('aria-hidden')).toBeNull();
      unmount();
    }
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_surface_no_use_client_directive', () => {
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      expect(src).not.toMatch(/^['"]use client['"]/m);
    }
  });

  it('infra_surface_no_forbidden_shadow_class', () => {
    const FORBIDDEN = /\b(?:shadow-md|shadow-lg|shadow-xl|shadow-2xl|drop-shadow|box-shadow)\b/;
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      expect(src, `${relPath} contains forbidden shadow class`).not.toMatch(FORBIDDEN);
    }
  });

  it('infra_surface_tailwind4_paren_syntax_not_bracket', () => {
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      // canonical paren syntax present
      expect(src).toMatch(/bg-\(--color-[a-z-]+\)/);
      expect(src).toMatch(/text-\(--pair-text-on-[a-z-]+\)/);
      // anti-pattern absent
      expect(src).not.toMatch(/bg-\[/);
      expect(src).not.toMatch(/text-\[color:/);
    }
  });

  it('infra_surface_barrel_export_count', () => {
    // Whitelist of expected named exports after this section ships.
    const expected = new Set(['DropAccent', 'Marble', 'Parchment', 'Bone', 'Shadow', 'BrushstrokeSeam', 'HeroBackdrop', 'Logo', 'Section', 'SectionDivider', 'Button', 'EditorialCard']);
    const actual = new Set(
      Object.keys(brandBarrel).filter(k => k !== 'default' && typeof (brandBarrel as Record<string, unknown>)[k] !== 'undefined')
    );
    // Every expected runtime export present
    for (const name of expected) {
      expect(actual.has(name), `barrel missing runtime export ${name}`).toBe(true);
    }
    // No surprise extras
    for (const name of actual) {
      expect(expected.has(name), `barrel has unexpected runtime export ${name}`).toBe(true);
    }
  });

  it('infra_surface_tokens_referenced_resolve_in_globals_css', () => {
    const tokens = new Set<string>();
    for (const relPath of Object.values(SOURCE_FILES)) {
      const src = readSource(relPath);
      for (const m of src.matchAll(/--(?:color|pair-text-on|edge-color)[a-z-]*/g)) {
        tokens.add(m[0]);
      }
    }
    expect(tokens.size).toBeGreaterThan(0);
    for (const token of tokens) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing declaration for ${token}`).toMatch(declRegex);
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_undefined_className', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(<Component>x</Component>);
      const el = rootElement(container);
      expect(el.className).not.toMatch(/\s\s+/); // no doubled internal spaces
      expect(el.className).toBe(el.className.trim());
      unmount();
    }
  });

  it('edge_input_empty_string_className', () => {
    for (const { Component, bgClass } of SURFACES) {
      const { container, unmount } = render(<Component className="">x</Component>);
      const el = rootElement(container);
      expect(el.className).toMatch(bgClass);
      expect(el.className).not.toMatch(/\s\s+/);
      expect(el.className).toBe(el.className.trim());
      unmount();
    }
  });

  it('edge_input_no_children', () => {
    for (const { Component, bgClass } of SURFACES) {
      const { container, unmount } = render(<Component />);
      const el = rootElement(container);
      expect(el.className).toMatch(bgClass);
      expect(el.textContent).toBe('');
      unmount();
    }
  });

  it('edge_input_complex_jsx_children', () => {
    for (const { Component } of SURFACES) {
      const { container, unmount } = render(
        <Component>
          plain text <strong>bold</strong>
          <br />
        </Component>
      );
      const el = rootElement(container);
      expect(el.querySelector('strong')?.textContent).toBe('bold');
      expect(el.querySelector('br')).not.toBeNull();
      expect(el.textContent).toContain('plain text');
      unmount();
    }
  });

  it('edge_input_caller_className_overrides_visual_intent', () => {
    // Surface does not merge / strip caller classes — both base and override coexist.
    const { container } = render(<Marble className="bg-yellow-100">x</Marble>);
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-marble\)/);
    expect(el.className).toMatch(/\bbg-yellow-100\b/);
  });

  it('edge_input_unusual_element_type', () => {
    const { container } = render(<Marble as="button" type="button">click</Marble>);
    const el = rootElement(container);
    expect(el.tagName).toBe('BUTTON');
    expect(el.className).toMatch(/bg-\(--color-marble\)/);
    expect((el as HTMLButtonElement).type).toBe('button');
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_fallback_warning_path', () => {
    // If any token referenced by a surface is missing from globals.css, render
    // would produce an invisible/no-bg result. Catch the failure at suite time.
    const TOKENS = [
      '--color-marble',
      '--color-parchment',
      '--color-bone',
      '--color-shadow',
      '--pair-text-on-marble',
      '--pair-text-on-parchment',
      '--pair-text-on-bone',
      '--pair-text-on-shadow',
    ];
    for (const token of TOKENS) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing required token ${token}`).toMatch(declRegex);
    }
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_serialization_surface_classname_construction_deterministic', () => {
    for (const { Component } of SURFACES) {
      const renders = [
        render(<Component edge="subtle" className="foo">x</Component>),
        render(<Component edge="subtle" className="foo">x</Component>),
        render(<Component edge="subtle" className="foo">x</Component>),
        render(<Component edge="subtle" className="foo">x</Component>),
        render(<Component edge="subtle" className="foo">x</Component>),
      ];
      const classNames = renders.map(r => rootElement(r.container).className);
      const unique = new Set(classNames);
      expect(unique.size, `nondeterministic className for ${Component.name}`).toBe(1);
      renders.forEach(r => r.unmount());
    }
  });

  it('data_consistency_token_pairing_invariant', () => {
    for (const { name, bgToken, textToken } of SURFACES) {
      const src = readSource(SOURCE_FILES[name]);
      expect(src, `${name}.tsx missing bg token ${bgToken}`).toMatch(
        new RegExp(`bg-\\(${bgToken}\\)`)
      );
      expect(src, `${name}.tsx missing paired text token ${textToken}`).toMatch(
        new RegExp(`text-\\(${textToken}\\)`)
      );
    }
  });
});
