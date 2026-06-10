import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { render } from '@testing-library/react';
import { EditorialCard, Logo } from '@/components/brand';

// Brand spec: "Every thumbnail is checked at 320x180 px before shipping. If the
// main headline isn't legible at that scale, the design fails." This sentinel
// guards the regression class where a future token tweak shrinks a display
// headline below the mobile-first legibility floor.
//
// jsdom does NOT resolve Tailwind/@layer custom utilities (.display-3) to real
// px, so window.getComputedStyle() would return the 16px default — useless here.
// Instead we read the headline size TOKENS straight from globals.css (the proven
// so-1.1 / so-2.2 sentinel idiom) and assert each meets the per-viewport floor.

const css = readFileSync(join(process.cwd(), 'src/app/globals.css'), 'utf8');

const themeBlock = (() => {
  const m = css.match(/@theme inline\s*\{([\s\S]*?)\n\}/);
  return m ? m[1] : '';
})();

const ROOT_FONT_PX = 16; // no html { font-size } override in globals.css
const remToPx = (rem: number): number => rem * ROOT_FONT_PX;

// Effective mobile-rendered size of a headline token, in px. For a clamp(min,
// pref, max) token the MIN is the size that renders at small viewports, so that
// is the legibility floor we guard. Throws descriptively if the token is gone.
function tokenFloorPx(name: string): number {
  const decl = themeBlock.match(new RegExp(`--text-${name}:\\s*([^;]+);`))?.[1];
  if (!decl) {
    throw new Error(`Headline token --text-${name} not found in globals.css`);
  }
  const clampMin = decl.match(/clamp\(\s*([0-9.]+)rem/);
  if (clampMin) return remToPx(parseFloat(clampMin[1]));
  const rem = decl.match(/([0-9.]+)rem/);
  if (rem) return remToPx(parseFloat(rem[1]));
  throw new Error(`Headline token --text-${name} is not expressed in rem: ${decl}`);
}

// EditorialCard headlines (the most common headline composition) render with the
// .display-3 utility, the SMALLEST headline token — so it is the binding floor.
const HEADLINE_TOKEN = 'display-3';

// Minimum effective character height (px) at each brand-critical viewport.
const VIEWPORT_TARGETS = [
  { name: 'og-preview', width: 320, height: 168, minHeadlinePx: 18 },
  { name: 'youtube-thumb-small', width: 480, height: 270, minHeadlinePx: 24 },
  { name: 'mobile-viewport', width: 360, height: 640, minHeadlinePx: 22 },
];

describe('brand legibility sentinel — headline token floors', () => {
  it('unit_legibility_og_preview_floor: display headline >= 18px at og-preview (320x168)', () => {
    const target = VIEWPORT_TARGETS[0];
    expect(tokenFloorPx(HEADLINE_TOKEN)).toBeGreaterThanOrEqual(target.minHeadlinePx);
  });

  it('unit_legibility_youtube_thumb_floor: display headline >= 24px at youtube-thumb-small (480x270)', () => {
    const target = VIEWPORT_TARGETS[1];
    expect(tokenFloorPx(HEADLINE_TOKEN)).toBeGreaterThanOrEqual(target.minHeadlinePx);
  });

  it('unit_legibility_mobile_viewport_floor: display headline >= 22px at mobile-viewport (360x640)', () => {
    const target = VIEWPORT_TARGETS[2];
    expect(tokenFloorPx(HEADLINE_TOKEN)).toBeGreaterThanOrEqual(target.minHeadlinePx);
  });

  it('unit_legibility_clamp_min_is_floor: clamp() headline tokens (display-1/display-2) resolve to their min rem and clear every viewport floor', () => {
    const maxFloor = Math.max(...VIEWPORT_TARGETS.map((t) => t.minHeadlinePx));
    // display-1 and display-2 are clamp() tokens; their MIN must exceed the
    // strictest floor (they are larger than display-3 by design).
    expect(tokenFloorPx('display-1')).toBeGreaterThanOrEqual(maxFloor);
    expect(tokenFloorPx('display-2')).toBeGreaterThanOrEqual(maxFloor);
    // sanity: display-1 >= display-2 >= display-3 (descending scale)
    expect(tokenFloorPx('display-1')).toBeGreaterThanOrEqual(tokenFloorPx('display-2'));
    expect(tokenFloorPx('display-2')).toBeGreaterThanOrEqual(tokenFloorPx('display-3'));
  });
});

describe('brand legibility sentinel — representative compositions', () => {
  it('integration_editorialcard_renders_h3_display3: EditorialCard headline is an h3 carrying the display-3 utility', () => {
    const { container } = render(
      <EditorialCard tag="Series" headline="Build the whole thing alone" subtitle="One person." />,
    );
    const headline = container.querySelector('h3');
    expect(headline).not.toBeNull();
    expect(headline?.className).toContain('display-3');
  });

  it('integration_logo_favicon_scale_renders: Logo renders at favicon scale (size="sm")', () => {
    const { container } = render(
      <div style={{ width: 32, height: 32 }}>
        <Logo size="sm" />
      </div>,
    );
    // Smoke check only — favicon legibility itself is visually verified.
    expect(container.firstChild).not.toBeNull();
  });
});

describe('brand legibility sentinel — accessibility', () => {
  it('a11y_perceivable_headline_min_height: every headline token meets its minimum legible height across all three viewport targets', () => {
    for (const target of VIEWPORT_TARGETS) {
      expect(tokenFloorPx(HEADLINE_TOKEN)).toBeGreaterThanOrEqual(target.minHeadlinePx);
    }
  });

  it('a11y_robust_semantic_heading: the headline renders as a semantic <h3> element (exposed in the heading outline)', () => {
    const { container } = render(<EditorialCard headline="Roman Numerals" />);
    const headline = container.querySelector('h3');
    expect(headline).not.toBeNull();
    expect(headline?.tagName).toBe('H3');
  });
});

describe('brand legibility sentinel — edge cases', () => {
  it('edge_state_editorialcard_headline_only: headline-only EditorialCard still renders a non-empty h3.display-3', () => {
    const { container } = render(<EditorialCard headline="Alone" />);
    const headline = container.querySelector('h3');
    expect(headline).not.toBeNull();
    expect(headline?.className).toContain('display-3');
    expect(headline?.textContent?.trim().length).toBeGreaterThan(0);
  });

  it('edge_input_smallest_viewport_floor: at the tightest target (og-preview 320x168) the smallest headline token still clears 18px', () => {
    expect(tokenFloorPx(HEADLINE_TOKEN)).toBeGreaterThanOrEqual(18);
  });
});

describe('brand legibility sentinel — error recovery', () => {
  it('err_missing_display_token_throws: token extraction throws a descriptive error naming a missing display token', () => {
    expect(() => tokenFloorPx('display-999')).toThrowError(/--text-display-999 not found/);
  });
});
