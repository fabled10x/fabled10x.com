import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = join(process.cwd(), 'src/app/globals.css');
const css = readFileSync(cssPath, 'utf8');

const themeBlock = (() => {
  const match = css.match(/@theme inline\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
})();

describe('brand tokens — spacing scale (8px grid + half-step)', () => {
  it('unit_spacing_space_0: --space-0 declared as 0', () => {
    expect(themeBlock).toMatch(/--space-0:\s*0\s*;/);
  });

  it('unit_spacing_space_px: --space-px declared as 1px', () => {
    expect(themeBlock).toMatch(/--space-px:\s*1px\b/);
  });

  it('unit_spacing_space_1: --space-1 declared as 0.25rem (4px half-step)', () => {
    expect(themeBlock).toMatch(/--space-1:\s*0\.25rem\b/);
  });

  it('unit_spacing_space_2: --space-2 declared as 0.5rem (8px base)', () => {
    expect(themeBlock).toMatch(/--space-2:\s*0\.5rem\b/);
  });

  it('unit_spacing_space_3: --space-3 declared as 0.75rem (12px)', () => {
    expect(themeBlock).toMatch(/--space-3:\s*0\.75rem\b/);
  });

  it('unit_spacing_space_4: --space-4 declared as 1rem (16px)', () => {
    expect(themeBlock).toMatch(/--space-4:\s*1rem\b/);
  });

  it('unit_spacing_space_5: --space-5 declared as 1.5rem (24px)', () => {
    expect(themeBlock).toMatch(/--space-5:\s*1\.5rem\b/);
  });

  it('unit_spacing_space_6: --space-6 declared as 2rem (32px)', () => {
    expect(themeBlock).toMatch(/--space-6:\s*2rem\b/);
  });

  it('unit_spacing_space_7: --space-7 declared as 3rem (48px)', () => {
    expect(themeBlock).toMatch(/--space-7:\s*3rem\b/);
  });

  it('unit_spacing_space_8: --space-8 declared as 4rem (64px)', () => {
    expect(themeBlock).toMatch(/--space-8:\s*4rem\b/);
  });

  it('unit_spacing_space_9: --space-9 declared as 6rem (96px)', () => {
    expect(themeBlock).toMatch(/--space-9:\s*6rem\b/);
  });

  it('unit_spacing_space_10: --space-10 declared as 8rem (128px)', () => {
    expect(themeBlock).toMatch(/--space-10:\s*8rem\b/);
  });
});

describe('brand tokens — vertical rhythm (--section-y-*)', () => {
  it('unit_section_y_sm: --section-y-sm aliases var(--space-7)', () => {
    expect(themeBlock).toMatch(/--section-y-sm:\s*var\(\s*--space-7\s*\)/);
  });

  it('unit_section_y_md: --section-y-md aliases var(--space-8)', () => {
    expect(themeBlock).toMatch(/--section-y-md:\s*var\(\s*--space-8\s*\)/);
  });

  it('unit_section_y_lg: --section-y-lg aliases var(--space-9)', () => {
    expect(themeBlock).toMatch(/--section-y-lg:\s*var\(\s*--space-9\s*\)/);
  });
});

describe('brand tokens — restrained radius scale', () => {
  it('unit_radius_sharp: --radius-sharp declared as 0', () => {
    expect(themeBlock).toMatch(/--radius-sharp:\s*0\s*;/);
  });

  it('unit_radius_soft: --radius-soft declared as 2px', () => {
    expect(themeBlock).toMatch(/--radius-soft:\s*2px\b/);
  });

  it('unit_radius_card: --radius-card declared as 4px', () => {
    expect(themeBlock).toMatch(/--radius-card:\s*4px\b/);
  });
});

describe('brand tokens — 1px edge tokens (depth without UI shadow)', () => {
  it('unit_edge_color: --edge-color aliases var(--color-ink)', () => {
    expect(themeBlock).toMatch(/--edge-color:\s*var\(\s*--color-ink\s*\)/);
  });

  it('unit_edge_color_subtle: --edge-color-subtle uses color-mix(in oklab, var(--color-ink) 20%, transparent)', () => {
    expect(themeBlock).toMatch(
      /--edge-color-subtle:\s*color-mix\(\s*in\s+oklab\s*,\s*var\(\s*--color-ink\s*\)\s+20%\s*,\s*transparent\s*\)/,
    );
  });
});

describe('brand tokens — block coverage (integration)', () => {
  it('integration_spacing_tokens_in_theme_block: all 12 spacing tokens present inside @theme block', () => {
    const required = [
      '--space-0:',
      '--space-px:',
      '--space-1:',
      '--space-2:',
      '--space-3:',
      '--space-4:',
      '--space-5:',
      '--space-6:',
      '--space-7:',
      '--space-8:',
      '--space-9:',
      '--space-10:',
    ];
    for (const token of required) {
      expect(themeBlock).toContain(token);
    }
  });

  it('integration_section_y_tokens_in_theme_block: all 3 section-y rhythm tokens present inside @theme block', () => {
    expect(themeBlock).toContain('--section-y-sm:');
    expect(themeBlock).toContain('--section-y-md:');
    expect(themeBlock).toContain('--section-y-lg:');
  });

  it('integration_radius_tokens_in_theme_block: all 3 radius tokens present inside @theme block', () => {
    expect(themeBlock).toContain('--radius-sharp:');
    expect(themeBlock).toContain('--radius-soft:');
    expect(themeBlock).toContain('--radius-card:');
  });

  it('integration_edge_tokens_in_theme_block: both edge tokens present inside @theme block', () => {
    expect(themeBlock).toContain('--edge-color:');
    expect(themeBlock).toContain('--edge-color-subtle:');
  });

  it('integration_so_1_1_palette_preserved: so-1.1 palette + aliases + contrast pairs intact (regression guard)', () => {
    // Palette hexes
    expect(themeBlock).toMatch(/--color-marble:\s*#F7F4EC\b/);
    expect(themeBlock).toMatch(/--color-parchment:\s*#F0E6D2\b/);
    expect(themeBlock).toMatch(/--color-ink:\s*#1C1814\b/);
    expect(themeBlock).toMatch(/--color-oxblood:\s*#6B2020\b/);
    expect(themeBlock).toMatch(/--color-verdigris:\s*#2F5D50\b/);
    expect(themeBlock).toMatch(/--color-bone:\s*#E8DCC4\b/);
    expect(themeBlock).toMatch(/--color-shadow:\s*#2A2520\b/);
    // Semantic aliases
    expect(themeBlock).toContain('--color-background:');
    expect(themeBlock).toContain('--color-foreground:');
    expect(themeBlock).toContain('--color-muted:');
    expect(themeBlock).toContain('--color-accent:');
    expect(themeBlock).toContain('--color-success:');
    expect(themeBlock).toContain('--color-link:');
    // Contrast pairs
    expect(themeBlock).toContain('--pair-text-on-marble:');
    expect(themeBlock).toContain('--pair-text-on-bone:');
    expect(themeBlock).toContain('--pair-text-on-parchment:');
    expect(themeBlock).toContain('--pair-text-on-shadow:');
    expect(themeBlock).toContain('--pair-accent-on-marble:');
    expect(themeBlock).toContain('--pair-accent-on-bone:');
    expect(themeBlock).toContain('--pair-accent-on-shadow:');
    expect(themeBlock).toContain('--pair-dark-cta-fg:');
    expect(themeBlock).toContain('--pair-dark-cta-bg:');
    expect(themeBlock).toContain('--pair-dark-cta-accent:');
  });
});

describe('brand tokens — infrastructure (counts + completeness)', () => {
  it('infra_spacing_count_complete: exactly 12 --space-* declarations (0, px, 1..10)', () => {
    const matches = themeBlock.match(/--space-[a-z0-9]+:/g) ?? [];
    expect(matches).toHaveLength(12);
  });

  it('infra_radius_count_complete: exactly 3 --radius-* declarations (sharp/soft/card)', () => {
    const matches = themeBlock.match(/--radius-[a-z]+:/g) ?? [];
    expect(matches).toHaveLength(3);
  });
});

describe('brand tokens — forbidden patterns (edge cases)', () => {
  it('edge_no_radius_greater_than_4px: no --radius-* token declares a value > 4px', () => {
    const radiusDecls = [...themeBlock.matchAll(/--radius-[a-z]+:\s*([^;]+);/g)];
    for (const [, rawValue] of radiusDecls) {
      const value = rawValue.trim();
      if (value === '0') continue;
      const pxMatch = value.match(/^(\d+(?:\.\d+)?)px$/);
      expect(pxMatch, `radius token uses non-px / unexpected unit: ${value}`).not.toBeNull();
      if (pxMatch) {
        expect(Number(pxMatch[1])).toBeLessThanOrEqual(4);
      }
    }
  });

  it('edge_no_half_step_spacing_above_8px: no --space-N-5 / --space-N.5 fractional tokens', () => {
    // Allowed: --space-1 (the documented sub-8px half-step). Forbidden: --space-2-5, --space-3-5, etc.
    expect(themeBlock).not.toMatch(/--space-\d+-5\b/);
    expect(themeBlock).not.toMatch(/--space-\d+\.5\b/);
  });

  it('edge_no_box_shadow_tokens: no --shadow-* or --box-shadow-* tokens declared', () => {
    // --color-shadow is a palette token (not a UI shadow); explicitly allowed.
    // Forbidden: --shadow-sm, --shadow-md, --box-shadow-*
    expect(themeBlock).not.toMatch(/--shadow-(sm|md|lg|xl|inner|none|card|button|raised|elevated)\b/);
    expect(themeBlock).not.toMatch(/--box-shadow-?\w*:/);
  });

  it('edge_radius_sharp_is_zero_not_none: --radius-sharp value is exactly `0`, not `none`/`unset`/`0px`', () => {
    const match = themeBlock.match(/--radius-sharp:\s*([^;]+);/);
    expect(match).not.toBeNull();
    if (match) {
      expect(match[1].trim()).toBe('0');
    }
  });

  it('edge_section_y_uses_space_token_refs: --section-y-* tokens reference var(--space-N), not raw rem/px', () => {
    const sectionDecls = [...themeBlock.matchAll(/--section-y-[a-z]+:\s*([^;]+);/g)];
    expect(sectionDecls.length).toBe(3);
    for (const [, rawValue] of sectionDecls) {
      expect(rawValue.trim()).toMatch(/^var\(\s*--space-\d+\s*\)$/);
    }
  });
});
