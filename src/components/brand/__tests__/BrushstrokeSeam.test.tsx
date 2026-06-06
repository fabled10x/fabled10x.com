import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { BrushstrokeSeam } from '../BrushstrokeSeam';
import * as brandBarrel from '..';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const SOURCE_PATH = 'src/components/brand/BrushstrokeSeam.tsx';
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const GLOBALS_CSS = readSource('src/app/globals.css');

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

function maskedLayer(root: HTMLElement): HTMLElement {
  const svg = root.querySelector('svg[aria-hidden="true"]');
  expect(svg, 'expected aria-hidden SVG inside root').not.toBeNull();
  const masked = svg!.parentElement as HTMLElement | null;
  expect(masked, 'expected SVG to have a parent (masked foreground layer)').not.toBeNull();
  return masked!;
}

describe('BrushstrokeSeam — material-language seam primitive', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_brushstroke_renders_root_div', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const root = rootElement(container);
    expect(root.tagName).toBe('DIV');
    expect(root.className).toMatch(/\brelative\b/);
    expect(root.className).toMatch(/\bisolate\b/);
  });

  it('unit_brushstroke_default_background_shadow', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const root = rootElement(container);
    expect(root.style.background).toBe('var(--color-shadow)');
  });

  it('unit_brushstroke_default_foreground_marble', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const root = rootElement(container);
    const masked = maskedLayer(root);
    expect(masked.style.background).toBe('var(--color-marble)');
  });

  it('unit_brushstroke_renders_children_on_foreground', () => {
    const { container } = render(
      <BrushstrokeSeam direction="left">
        <span data-testid="seam-children">brushstroke child</span>
      </BrushstrokeSeam>
    );
    const root = rootElement(container);
    const masked = maskedLayer(root);
    const child = masked.querySelector('[data-testid="seam-children"]') as HTMLElement | null;
    expect(child, 'children must render inside the masked (foreground) layer').not.toBeNull();
    expect(child!.textContent).toBe('brushstroke child');
    const childrenWrapper = child!.parentElement as HTMLElement | null;
    expect(childrenWrapper).not.toBeNull();
    expect(childrenWrapper!.className).toMatch(/\brelative\b/);
  });

  it('unit_brushstroke_renders_background_content_when_provided', () => {
    const { container } = render(
      <BrushstrokeSeam direction="left" backgroundContent={<span data-testid="bg-photo">bg</span>}>
        <span>fg</span>
      </BrushstrokeSeam>
    );
    const root = rootElement(container);
    const bg = root.querySelector('[data-testid="bg-photo"]') as HTMLElement | null;
    expect(bg, 'backgroundContent must render').not.toBeNull();
    const bgLayer = bg!.parentElement as HTMLElement | null;
    expect(bgLayer).not.toBeNull();
    expect(bgLayer!.className).toMatch(/\babsolute\b/);
    expect(bgLayer!.className).toMatch(/\binset-0\b/);
  });

  it('unit_brushstroke_omits_background_layer_when_undefined', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const root = rootElement(container);
    expect(root.querySelector('.motion-reduce\\:opacity-80')).toBeNull();
  });

  it('unit_brushstroke_classname_passthrough', () => {
    const { container } = render(<BrushstrokeSeam direction="left" className="extra-class my-custom" />);
    const root = rootElement(container);
    expect(root.className).toMatch(/\brelative\b/);
    expect(root.className).toMatch(/\bisolate\b/);
    expect(root.className).toMatch(/\bextra-class\b/);
    expect(root.className).toMatch(/\bmy-custom\b/);
  });

  it('unit_brushstroke_direction_left_mask_gradient', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toContain('to right');
  });

  it('unit_brushstroke_direction_right_mask_gradient', () => {
    const { container } = render(<BrushstrokeSeam direction="right" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toContain('to left');
  });

  it('unit_brushstroke_direction_top_mask_gradient', () => {
    const { container } = render(<BrushstrokeSeam direction="top" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toContain('to bottom');
  });

  it('unit_brushstroke_direction_bottom_mask_gradient', () => {
    const { container } = render(<BrushstrokeSeam direction="bottom" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toContain('to top');
  });

  it('unit_brushstroke_mask_uses_unique_id_per_direction', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const mask = container.querySelector('mask');
    expect(mask, 'mask element must exist in defs').not.toBeNull();
    expect(mask!.id).toBe('brushstroke-mask-left');
  });

  it('unit_brushstroke_filter_uses_unique_id_per_direction', () => {
    const { container } = render(<BrushstrokeSeam direction="top" />);
    const filter = container.querySelector('filter');
    expect(filter, 'filter element must exist in defs').not.toBeNull();
    expect(filter!.id).toBe('brushstroke-feather-top');
  });

  it('unit_brushstroke_feather_prop_appears_in_mask_image', () => {
    const { container } = render(<BrushstrokeSeam direction="left" feather="12rem" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toContain('12rem');
  });

  it('unit_brushstroke_custom_background_color_inline', () => {
    const { container } = render(<BrushstrokeSeam direction="left" background="#123456" />);
    const root = rootElement(container);
    expect(root.style.background).toBe('rgb(18, 52, 86)');
  });

  it('unit_brushstroke_custom_foreground_color_on_masked_layer', () => {
    const { container } = render(<BrushstrokeSeam direction="left" foreground="#abcdef" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.background).toBe('rgb(171, 205, 239)');
  });

  it('unit_brushstroke_svg_turbulence_attributes_match_spec', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const turbulence = container.querySelector('feTurbulence');
    expect(turbulence, 'feTurbulence must exist in defs').not.toBeNull();
    expect(turbulence!.getAttribute('type')).toBe('fractalNoise');
    expect(turbulence!.getAttribute('baseFrequency')).toBe('0.015 0.04');
    expect(turbulence!.getAttribute('numOctaves')).toBe('2');
    const seed = turbulence!.getAttribute('seed');
    expect(seed, 'feTurbulence must have a seed attribute').not.toBeNull();
    expect(seed).toMatch(/^\d+$/);
  });

  it('unit_brushstroke_svg_displacement_map_scale_20', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const disp = container.querySelector('feDisplacementMap');
    expect(disp, 'feDisplacementMap must exist').not.toBeNull();
    expect(disp!.getAttribute('scale')).toBe('20');
    expect(disp!.getAttribute('in')).toBe('SourceGraphic');
  });

  it('unit_brushstroke_mask_rect_covers_100pct', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const rect = container.querySelector('mask rect');
    expect(rect, 'mask rect must exist').not.toBeNull();
    expect(rect!.getAttribute('x')).toBe('0');
    expect(rect!.getAttribute('y')).toBe('0');
    expect(rect!.getAttribute('width')).toBe('100%');
    expect(rect!.getAttribute('height')).toBe('100%');
    expect(rect!.getAttribute('fill')).toBe('white');
    const styleAttr = (rect as SVGRectElement).style.filter;
    expect(styleAttr).toContain('url(#brushstroke-feather-left)');
  });

  it('unit_brushstroke_webkit_mask_image_mirrors_mask_image', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toBeTruthy();
    expect((masked.style as unknown as { WebkitMaskImage: string }).WebkitMaskImage).toBe(masked.style.maskImage);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_brushstroke_barrel_export', () => {
    expect(brandBarrel).toHaveProperty('BrushstrokeSeam');
    expect((brandBarrel as { BrushstrokeSeam?: unknown }).BrushstrokeSeam).toBe(BrushstrokeSeam);
  });

  it('integration_brushstroke_barrel_does_not_regress_siblings', () => {
    expect(brandBarrel).toHaveProperty('Marble');
    expect(brandBarrel).toHaveProperty('Parchment');
    expect(brandBarrel).toHaveProperty('Bone');
    expect(brandBarrel).toHaveProperty('Shadow');
    expect(brandBarrel).toHaveProperty('DropAccent');
  });

  it('integration_brushstroke_composes_inside_surface_primitive', () => {
    // Imports kept local to the test to avoid affecting other test suites' module init.
    const { Marble } = brandBarrel as { Marble: React.FunctionComponent<{ children?: React.ReactNode; 'data-testid'?: string }> };
    const { container } = render(
      <Marble data-testid="outer-marble">
        <BrushstrokeSeam direction="bottom">
          <span data-testid="nested-fg">on marble</span>
        </BrushstrokeSeam>
      </Marble>
    );
    const outer = container.querySelector('[data-testid="outer-marble"]') as HTMLElement | null;
    expect(outer, 'outer Marble must render').not.toBeNull();
    expect(outer!.className).toMatch(/bg-\(--color-marble\)/);
    const seamRoot = outer!.firstElementChild as HTMLElement | null;
    expect(seamRoot, 'seam must be a direct child of Marble').not.toBeNull();
    expect(seamRoot!.className).toMatch(/\bisolate\b/);
    expect(container.querySelector('[data-testid="nested-fg"]')).not.toBeNull();
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_brushstroke_svg_defs_aria_hidden', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const svg = container.querySelector('svg');
    expect(svg, 'inline SVG must render').not.toBeNull();
    expect(svg!.getAttribute('aria-hidden')).toBe('true');
  });

  it('a11y_brushstroke_svg_defs_zero_size', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg!.getAttribute('width')).toBe('0');
    expect(svg!.getAttribute('height')).toBe('0');
  });

  it('a11y_brushstroke_children_preserve_reading_order', () => {
    const { container } = render(
      <BrushstrokeSeam direction="left">
        <p data-testid="first">first</p>
        <p data-testid="second">second</p>
      </BrushstrokeSeam>
    );
    const first = container.querySelector('[data-testid="first"]') as HTMLElement | null;
    const second = container.querySelector('[data-testid="second"]') as HTMLElement | null;
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    const pos = first!.compareDocumentPosition(second!);
    expect(pos & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a11y_brushstroke_motion_reduce_class_present', () => {
    const { container } = render(
      <BrushstrokeSeam direction="left" backgroundContent={<span data-testid="bg">x</span>}>
        <span>fg</span>
      </BrushstrokeSeam>
    );
    const bg = container.querySelector('[data-testid="bg"]') as HTMLElement | null;
    expect(bg).not.toBeNull();
    const bgLayer = bg!.parentElement as HTMLElement | null;
    expect(bgLayer).not.toBeNull();
    expect(bgLayer!.className).toMatch(/motion-reduce:opacity-80/);
    expect(bgLayer!.className).toMatch(/motion-safe:opacity-100/);
  });

  it('a11y_brushstroke_no_role_on_root_div', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const root = rootElement(container);
    expect(root.getAttribute('role')).toBeNull();
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_brushstroke_no_use_client_directive', () => {
    const src = readSource(SOURCE_PATH);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_brushstroke_no_forbidden_shadow_or_gradient_class', () => {
    const src = readSource(SOURCE_PATH);
    const FORBIDDEN_CLASSES = /\b(?:shadow-(?:md|lg|xl|2xl)|drop-shadow|box-shadow|bg-gradient-(?:to-[a-z]+|conic|radial))\b/;
    expect(src, 'BrushstrokeSeam.tsx contains a forbidden shadow / gradient class').not.toMatch(FORBIDDEN_CLASSES);
    // Note: a `linear-gradient(...)` literal IS allowed inside maskImage (mask, not visual gradient).
    // We assert it does NOT appear as a Tailwind class form.
    expect(src).not.toMatch(/\bbg-gradient-/);
  });

  it('infra_brushstroke_tailwind4_paren_syntax_not_bracket', () => {
    const src = readSource(SOURCE_PATH);
    // Anti-pattern absent
    expect(src).not.toMatch(/bg-\[/);
    expect(src).not.toMatch(/text-\[color:/);
  });

  it('infra_brushstroke_no_random_or_date_calls', () => {
    const src = readSource(SOURCE_PATH);
    expect(src, 'source must not use Math.random()').not.toMatch(/\bMath\.random\s*\(/);
    expect(src, 'source must not use Date.now()').not.toMatch(/\bDate\.now\s*\(/);
    expect(src, 'source must not use argless new Date()').not.toMatch(/\bnew\s+Date\s*\(\s*\)/);
  });

  it('infra_brushstroke_barrel_export_count', () => {
    const expected = new Set(['DropAccent', 'Marble', 'Parchment', 'Bone', 'Shadow', 'BrushstrokeSeam']);
    const actual = new Set(
      Object.keys(brandBarrel).filter(
        k => k !== 'default' && typeof (brandBarrel as Record<string, unknown>)[k] !== 'undefined'
      )
    );
    for (const name of expected) {
      expect(actual.has(name), `barrel missing runtime export ${name}`).toBe(true);
    }
    for (const name of actual) {
      expect(expected.has(name), `barrel has unexpected runtime export ${name}`).toBe(true);
    }
  });

  it('infra_brushstroke_tokens_resolve_in_globals_css', () => {
    expect(GLOBALS_CSS).toMatch(/--color-marble\s*:/);
    expect(GLOBALS_CSS).toMatch(/--color-shadow\s*:/);
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_brushstroke_no_children', () => {
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const root = rootElement(container);
    const masked = maskedLayer(root);
    // The children wrapper exists but is empty.
    const childrenWrapper = masked.querySelector(':scope > div.relative');
    expect(childrenWrapper, 'children wrapper must exist even when no children').not.toBeNull();
    expect(childrenWrapper!.textContent).toBe('');
  });

  it('edge_input_brushstroke_empty_string_classname', () => {
    const { container } = render(<BrushstrokeSeam direction="left" className="" />);
    const root = rootElement(container);
    expect(root.className).toMatch(/\brelative\b/);
    expect(root.className).toMatch(/\bisolate\b/);
    expect(root.className).not.toMatch(/\s\s+/);
    expect(root.className).toBe(root.className.trim());
  });

  it('edge_input_brushstroke_custom_feather_zero', () => {
    const { container } = render(<BrushstrokeSeam direction="left" feather="0" />);
    const masked = maskedLayer(rootElement(container));
    expect(masked.style.maskImage).toContain('0');
    expect(masked.style.maskImage).not.toContain('8rem');
  });

  it('edge_input_brushstroke_color_as_hex', () => {
    const { container } = render(<BrushstrokeSeam direction="left" foreground="#F7F4EC" />);
    const masked = maskedLayer(rootElement(container));
    // jsdom normalizes color strings to rgb(...); both forms are acceptable as long as it's not blank or default.
    expect(masked.style.background).not.toBe('var(--color-marble)');
    expect(masked.style.background).toMatch(/^(?:#F7F4EC|rgb\(247,\s*244,\s*236\))$/i);
  });

  it('edge_state_brushstroke_two_seams_same_direction', () => {
    const { container } = render(
      <div>
        <BrushstrokeSeam direction="left" />
        <BrushstrokeSeam direction="left" />
      </div>
    );
    const svgs = container.querySelectorAll('svg[aria-hidden="true"]');
    expect(svgs.length).toBe(2);
    const masks = container.querySelectorAll('mask');
    expect(masks.length).toBe(2);
  });

  it('edge_state_brushstroke_two_seams_different_directions', () => {
    const { container } = render(
      <div>
        <BrushstrokeSeam direction="left" />
        <BrushstrokeSeam direction="top" />
      </div>
    );
    const masks = Array.from(container.querySelectorAll('mask')).map(m => m.id);
    expect(masks).toContain('brushstroke-mask-left');
    expect(masks).toContain('brushstroke-mask-top');
    const filters = Array.from(container.querySelectorAll('filter')).map(f => f.id);
    expect(filters).toContain('brushstroke-feather-left');
    expect(filters).toContain('brushstroke-feather-top');
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_brushstroke_token_unresolved_default_props_present_in_globals', () => {
    // Catch token removal at suite time — default props depend on these tokens existing.
    expect(GLOBALS_CSS, 'globals.css must declare --color-marble for default foreground').toMatch(/--color-marble\s*:/);
    expect(GLOBALS_CSS, 'globals.css must declare --color-shadow for default background').toMatch(/--color-shadow\s*:/);
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_consistency_brushstroke_seed_is_constant', () => {
    const src = readSource(SOURCE_PATH);
    // Source must declare a numeric seed constant — pattern: const turbulenceSeed = <number>
    expect(src, 'source must declare a numeric turbulenceSeed constant').toMatch(/const\s+turbulenceSeed\s*=\s*\d+/);
    const declMatch = src.match(/const\s+turbulenceSeed\s*=\s*(\d+)/);
    expect(declMatch).not.toBeNull();
    const declaredSeed = declMatch![1];
    const { container } = render(<BrushstrokeSeam direction="left" />);
    const turbulence = container.querySelector('feTurbulence');
    expect(turbulence).not.toBeNull();
    expect(turbulence!.getAttribute('seed')).toBe(declaredSeed);
  });

  it('data_serialization_brushstroke_render_deterministic', () => {
    const renders = Array.from({ length: 5 }, () => render(<BrushstrokeSeam direction="left" />));
    const htmls = renders.map(r => r.container.innerHTML);
    const unique = new Set(htmls);
    expect(unique.size, 'render output must be deterministic across repeated renders').toBe(1);
    renders.forEach(r => r.unmount());
  });
});
