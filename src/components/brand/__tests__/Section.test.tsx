import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Section } from '../Section';
import { Container } from '@/components/site/Container';
import * as brandBarrel from '..';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const SOURCE_PATH = 'src/components/brand/Section.tsx';
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const SECTION_SOURCE = readSource(SOURCE_PATH);

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

describe('Section — polymorphic vertical-rhythm primitive', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_section_default_renders_section_tag', () => {
    const { container } = render(<Section>content</Section>);
    const el = rootElement(container);
    expect(el.tagName).toBe('SECTION');
  });

  it('unit_section_default_rhythm_md', () => {
    const { container } = render(<Section>content</Section>);
    const el = rootElement(container);
    expect(el.className).toMatch(/py-\(--section-y-md\)/);
    expect(el.className).not.toMatch(/py-\(--section-y-sm\)/);
    expect(el.className).not.toMatch(/py-\(--section-y-lg\)/);
  });

  it('unit_section_rhythm_sm_applies_token', () => {
    const { container } = render(<Section rhythm="sm">content</Section>);
    const el = rootElement(container);
    expect(el.className).toMatch(/py-\(--section-y-sm\)/);
    expect(el.className).not.toMatch(/py-\(--section-y-md\)/);
    expect(el.className).not.toMatch(/py-\(--section-y-lg\)/);
  });

  it('unit_section_rhythm_lg_applies_token', () => {
    const { container } = render(<Section rhythm="lg">content</Section>);
    const el = rootElement(container);
    expect(el.className).toMatch(/py-\(--section-y-lg\)/);
    expect(el.className).not.toMatch(/py-\(--section-y-sm\)/);
    expect(el.className).not.toMatch(/py-\(--section-y-md\)/);
  });

  it('unit_section_as_article_polymorphic', () => {
    const { container } = render(<Section as="article">content</Section>);
    const el = rootElement(container);
    expect(el.tagName).toBe('ARTICLE');
    // Rhythm class still applied regardless of tag
    expect(el.className).toMatch(/py-\(--section-y-md\)/);
  });

  it('unit_section_classname_passthrough', () => {
    const { container } = render(
      <Section className="bg-(--color-bone) my-12">content</Section>
    );
    const el = rootElement(container);
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
    expect(el.className).toMatch(/\bmy-12\b/);
    expect(el.className).toMatch(/py-\(--section-y-md\)/);
  });

  it('unit_section_children_render', () => {
    render(
      <Section>
        <span data-testid="section-child">inside the section</span>
      </Section>
    );
    expect(screen.getByTestId('section-child')).toBeInTheDocument();
    expect(screen.getByTestId('section-child').textContent).toBe('inside the section');
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_brand_barrel_reexports_section_and_divider', () => {
    expect(brandBarrel).toHaveProperty('Section');
    expect(typeof (brandBarrel as { Section?: unknown }).Section).toBe('function');
    expect((brandBarrel as { Section: typeof Section }).Section).toBe(Section);

    expect(brandBarrel).toHaveProperty('SectionDivider');
    expect(typeof (brandBarrel as { SectionDivider?: unknown }).SectionDivider).toBe('function');
  });

  it('integration_container_section_composition', () => {
    // Section wrapping a Container is the canonical pattern downstream pages
    // will use. Both render their children, both render their root elements.
    const { container } = render(
      <Section data-testid="outer-section">
        <Container data-testid="inner-container">
          <span data-testid="leaf">nested</span>
        </Container>
      </Section>
    );
    const outer = container.querySelector('[data-testid="outer-section"]') as HTMLElement | null;
    const inner = container.querySelector('[data-testid="inner-container"]') as HTMLElement | null;
    const leaf = container.querySelector('[data-testid="leaf"]') as HTMLElement | null;
    expect(outer).not.toBeNull();
    expect(outer!.tagName).toBe('SECTION');
    expect(inner).not.toBeNull();
    expect(inner!.tagName).toBe('DIV');
    expect(outer!.contains(inner)).toBe(true);
    expect(leaf).not.toBeNull();
    expect(leaf!.textContent).toBe('nested');
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_section_polymorphic_preserves_semantic_tag', () => {
    // Section's semantic <section> default is preserved.
    const { container: a } = render(<Section>x</Section>);
    expect(rootElement(a).tagName).toBe('SECTION');

    // Polymorphic `as` actually swaps the rendered element — rhythm class
    // never silently strips/replaces the requested semantic tag.
    const { container: b } = render(<Section as="article">x</Section>);
    expect(rootElement(b).tagName).toBe('ARTICLE');

    const { container: c } = render(<Section as="aside">x</Section>);
    expect(rootElement(c).tagName).toBe('ASIDE');
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_brand_barrel_export_set_includes_section_and_divider', () => {
    const expected = new Set([
      'DropAccent',
      'Marble',
      'Parchment',
      'Bone',
      'Shadow',
      'BrushstrokeSeam',
      'Logo',
      'Section',
      'SectionDivider',
      'Button',
    ]);
    const actual = new Set(
      Object.keys(brandBarrel).filter(
        k => k !== 'default' && typeof (brandBarrel as Record<string, unknown>)[k] !== 'undefined'
      )
    );
    for (const name of expected) {
      expect(actual.has(name), `brand barrel missing runtime export ${name}`).toBe(true);
    }
    for (const name of actual) {
      expect(expected.has(name), `brand barrel has unexpected runtime export ${name}`).toBe(true);
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_section_classname_empty_string', () => {
    const { container } = render(<Section className="">content</Section>);
    const el = rootElement(container);
    const classes = el.className;
    expect(classes).toMatch(/py-\(--section-y-md\)/);
    expect(classes).not.toMatch(/\s{2,}/);
    expect(classes).toBe(classes.trim());
  });

  it('edge_section_no_children', () => {
    const { container } = render(<Section />);
    const el = rootElement(container);
    expect(el.tagName).toBe('SECTION');
    expect(el.textContent).toBe('');
    expect(el.className).toMatch(/py-\(--section-y-md\)/);
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_serialization_classname_construction_deterministic', () => {
    // Five identical renders → identical classNames. Catches accidental
    // nondeterminism in the classname builder (e.g. seeded ordering).
    const renders = Array.from({ length: 5 }, () =>
      render(<Section rhythm="sm" className="foo">x</Section>)
    );
    const classes = renders.map(r => rootElement(r.container).className);
    expect(new Set(classes).size).toBe(1);
    renders.forEach(r => r.unmount());
  });

  it('data_consistency_section_rhythm_to_token_mapping', () => {
    // Source-level pin of the variant→token mapping documented in the
    // planning doc (lines 409-413).
    expect(SECTION_SOURCE).toMatch(/py-\(--section-y-sm\)/);
    expect(SECTION_SOURCE).toMatch(/py-\(--section-y-md\)/);
    expect(SECTION_SOURCE).toMatch(/py-\(--section-y-lg\)/);
    expect(SECTION_SOURCE).toMatch(/['"]sm['"]/);
    expect(SECTION_SOURCE).toMatch(/['"]md['"]/);
    expect(SECTION_SOURCE).toMatch(/['"]lg['"]/);
  });
});
