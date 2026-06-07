import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Container } from '../Container';
import * as siteBarrel from '..';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const SOURCE_PATH = 'src/components/site/Container.tsx';
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const CONTAINER_SOURCE = readSource(SOURCE_PATH);

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

describe('Container — polymorphic layout primitive with width variants', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_container_default_render_div', () => {
    const { container } = render(<Container>content</Container>);
    const el = rootElement(container);
    expect(el.tagName).toBe('DIV');
    expect(el.textContent).toBe('content');
  });

  it('unit_container_default_width_layout_max_w_5xl', () => {
    // Default width preserves the previous behavior (max-w-5xl) so existing
    // callers in src/app/**/page.tsx do not visually regress.
    const { container } = render(<Container>content</Container>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\bmax-w-5xl\b/);
  });

  it('unit_container_width_prose_applies_max_w_prose', () => {
    const { container } = render(<Container width="prose">content</Container>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\bmax-w-prose\b/);
    expect(el.className).not.toMatch(/\bmax-w-5xl\b/);
    expect(el.className).not.toMatch(/\bmax-w-7xl\b/);
  });

  it('unit_container_width_layout_applies_max_w_5xl', () => {
    const { container } = render(<Container width="layout">content</Container>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\bmax-w-5xl\b/);
    expect(el.className).not.toMatch(/\bmax-w-prose\b/);
    expect(el.className).not.toMatch(/\bmax-w-7xl\b/);
  });

  it('unit_container_width_wide_applies_max_w_7xl', () => {
    const { container } = render(<Container width="wide">content</Container>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\bmax-w-7xl\b/);
    expect(el.className).not.toMatch(/\bmax-w-prose\b/);
    expect(el.className).not.toMatch(/\bmax-w-5xl\b/);
  });

  it('unit_container_token_gutters_applied', () => {
    const { container } = render(<Container>content</Container>);
    const el = rootElement(container);
    expect(el.className).toMatch(/\bmx-auto\b/);
    expect(el.className).toMatch(/px-\(--space-5\)/);
    expect(el.className).toMatch(/md:px-\(--space-7\)/);
    // The fixed-px gutters from the old API must be gone.
    expect(el.className).not.toMatch(/\bpx-6\b/);
    expect(el.className).not.toMatch(/\bmd:px-10\b/);
  });

  it('unit_container_as_section_polymorphic', () => {
    const { container } = render(<Container as="section">content</Container>);
    const el = rootElement(container);
    expect(el.tagName).toBe('SECTION');
    // Width default still applies on polymorphic render
    expect(el.className).toMatch(/\bmax-w-5xl\b/);
  });

  it('unit_container_as_main_polymorphic', () => {
    const { container } = render(<Container as="main">content</Container>);
    const el = rootElement(container);
    expect(el.tagName).toBe('MAIN');
  });

  it('unit_container_classname_passthrough_concat', () => {
    const { container } = render(
      <Container className="my-12 custom-class">content</Container>
    );
    const el = rootElement(container);
    expect(el.className).toMatch(/\bmy-12\b/);
    expect(el.className).toMatch(/\bcustom-class\b/);
    expect(el.className).toMatch(/\bmx-auto\b/);
    expect(el.className).toMatch(/\bmax-w-5xl\b/);
  });

  it('unit_container_children_render', () => {
    render(
      <Container>
        <span data-testid="child">hello inside container</span>
      </Container>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
    expect(screen.getByTestId('child').textContent).toBe('hello inside container');
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_site_barrel_still_exports_container', () => {
    expect(siteBarrel.Container).toBe(Container);
    // Regression guard: do not lose the rest of the site barrel.
    expect(siteBarrel).toHaveProperty('Header');
    expect(siteBarrel).toHaveProperty('Footer');
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_container_no_default_aria_hidden', () => {
    const { container } = render(<Container>visible content</Container>);
    const el = rootElement(container);
    expect(el.getAttribute('aria-hidden')).toBeNull();
  });

  it('a11y_container_aria_label_passthrough_on_as_main', () => {
    const { container } = render(
      <Container as="main" aria-label="primary content">
        content
      </Container>
    );
    const el = rootElement(container);
    expect(el.tagName).toBe('MAIN');
    expect(el.getAttribute('aria-label')).toBe('primary content');
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_container_classname_empty_string', () => {
    const { container } = render(<Container className="">content</Container>);
    const el = rootElement(container);
    const classes = el.className;
    expect(classes).toMatch(/\bmx-auto\b/);
    expect(classes).toMatch(/\bmax-w-5xl\b/);
    expect(classes).not.toMatch(/\s{2,}/);
    expect(classes).toBe(classes.trim());
  });

  it('edge_container_classname_undefined', () => {
    const { container } = render(<Container>content</Container>);
    const el = rootElement(container);
    const classes = el.className;
    expect(classes).not.toMatch(/undefined/);
    expect(classes).not.toMatch(/\s{2,}/);
    expect(classes).toBe(classes.trim());
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_consistency_container_width_to_max_w_mapping', () => {
    // Source-introspection: the width→class mapping must be the canonical
    // three values (planning doc lines 374-378). Drift means the variant
    // matrix has been corrupted without an accompanying type change.
    expect(CONTAINER_SOURCE).toMatch(/\bmax-w-prose\b/);
    expect(CONTAINER_SOURCE).toMatch(/\bmax-w-5xl\b/);
    expect(CONTAINER_SOURCE).toMatch(/\bmax-w-7xl\b/);
    // Either a Record<Width, string> lookup or an inline switch — both name
    // the three variant keys somewhere in the source.
    expect(CONTAINER_SOURCE).toMatch(/['"]prose['"]/);
    expect(CONTAINER_SOURCE).toMatch(/['"]layout['"]/);
    expect(CONTAINER_SOURCE).toMatch(/['"]wide['"]/);
  });
});
