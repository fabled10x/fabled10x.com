import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = join(process.cwd(), 'src/app/globals.css');
const css = readFileSync(cssPath, 'utf8');

const themeBlock = (() => {
  const match = css.match(/@theme inline\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
})();

const bodyBlock = (() => {
  const match = css.match(/(?<!\.)\bbody\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
})();

describe('brand tokens — globals.css palette', () => {
  it('unit_palette_marble_hex: --color-marble declared as #F7F4EC', () => {
    expect(themeBlock).toMatch(/--color-marble:\s*#F7F4EC\b/);
  });

  it('unit_palette_parchment_hex: --color-parchment declared as #F0E6D2', () => {
    expect(themeBlock).toMatch(/--color-parchment:\s*#F0E6D2\b/);
  });

  it('unit_palette_ink_hex: --color-ink declared as #1C1814', () => {
    expect(themeBlock).toMatch(/--color-ink:\s*#1C1814\b/);
  });

  it('unit_palette_oxblood_hex: --color-oxblood declared as #6B2020', () => {
    expect(themeBlock).toMatch(/--color-oxblood:\s*#6B2020\b/);
  });

  it('unit_palette_verdigris_hex: --color-verdigris declared as #2F5D50', () => {
    expect(themeBlock).toMatch(/--color-verdigris:\s*#2F5D50\b/);
  });

  it('unit_palette_bone_hex: --color-bone declared as #E8DCC4', () => {
    expect(themeBlock).toMatch(/--color-bone:\s*#E8DCC4\b/);
  });

  it('unit_palette_shadow_hex: --color-shadow declared as #2A2520', () => {
    expect(themeBlock).toMatch(/--color-shadow:\s*#2A2520\b/);
  });
});

describe('brand tokens — semantic surface aliases', () => {
  it('unit_semantic_background_aliases_marble: --color-background -> var(--color-marble)', () => {
    expect(themeBlock).toMatch(/--color-background:\s*var\(\s*--color-marble\s*\)/);
  });

  it('unit_semantic_foreground_aliases_ink: --color-foreground -> var(--color-ink)', () => {
    expect(themeBlock).toMatch(/--color-foreground:\s*var\(\s*--color-ink\s*\)/);
  });

  it('unit_semantic_muted_uses_color_mix: --color-muted uses color-mix(in oklab, var(--color-ink) 65%, transparent)', () => {
    expect(themeBlock).toMatch(
      /--color-muted:\s*color-mix\(\s*in\s+oklab\s*,\s*var\(\s*--color-ink\s*\)\s+65%\s*,\s*transparent\s*\)/,
    );
  });

  it('unit_semantic_accent_aliases_oxblood: --color-accent -> var(--color-oxblood)', () => {
    expect(themeBlock).toMatch(/--color-accent:\s*var\(\s*--color-oxblood\s*\)/);
  });

  it('unit_semantic_success_aliases_verdigris: --color-success -> var(--color-verdigris)', () => {
    expect(themeBlock).toMatch(/--color-success:\s*var\(\s*--color-verdigris\s*\)/);
  });

  it('unit_semantic_link_aliases_oxblood: --color-link -> var(--color-oxblood) (no blue anywhere)', () => {
    expect(themeBlock).toMatch(/--color-link:\s*var\(\s*--color-oxblood\s*\)/);
  });
});

describe('brand tokens — contrast pairs: text-on-*', () => {
  it('unit_pair_text_on_marble: --pair-text-on-marble -> var(--color-ink)', () => {
    expect(themeBlock).toMatch(/--pair-text-on-marble:\s*var\(\s*--color-ink\s*\)/);
  });

  it('unit_pair_text_on_bone: --pair-text-on-bone -> var(--color-ink)', () => {
    expect(themeBlock).toMatch(/--pair-text-on-bone:\s*var\(\s*--color-ink\s*\)/);
  });

  it('unit_pair_text_on_parchment: --pair-text-on-parchment -> var(--color-ink)', () => {
    expect(themeBlock).toMatch(/--pair-text-on-parchment:\s*var\(\s*--color-ink\s*\)/);
  });

  it('unit_pair_text_on_shadow: --pair-text-on-shadow -> var(--color-parchment)', () => {
    expect(themeBlock).toMatch(/--pair-text-on-shadow:\s*var\(\s*--color-parchment\s*\)/);
  });
});

describe('brand tokens — contrast pairs: accent-on-*', () => {
  it('unit_pair_accent_on_marble: --pair-accent-on-marble -> var(--color-oxblood)', () => {
    expect(themeBlock).toMatch(/--pair-accent-on-marble:\s*var\(\s*--color-oxblood\s*\)/);
  });

  it('unit_pair_accent_on_bone: --pair-accent-on-bone -> var(--color-oxblood)', () => {
    expect(themeBlock).toMatch(/--pair-accent-on-bone:\s*var\(\s*--color-oxblood\s*\)/);
  });

  it('unit_pair_accent_on_shadow: --pair-accent-on-shadow -> var(--color-parchment)', () => {
    expect(themeBlock).toMatch(/--pair-accent-on-shadow:\s*var\(\s*--color-parchment\s*\)/);
  });
});

describe('brand tokens — contrast pairs: dark CTA', () => {
  it('unit_pair_dark_cta_fg: --pair-dark-cta-fg -> var(--color-marble)', () => {
    expect(themeBlock).toMatch(/--pair-dark-cta-fg:\s*var\(\s*--color-marble\s*\)/);
  });

  it('unit_pair_dark_cta_bg: --pair-dark-cta-bg -> var(--color-ink)', () => {
    expect(themeBlock).toMatch(/--pair-dark-cta-bg:\s*var\(\s*--color-ink\s*\)/);
  });

  it('unit_pair_dark_cta_accent: --pair-dark-cta-accent -> var(--color-oxblood)', () => {
    expect(themeBlock).toMatch(/--pair-dark-cta-accent:\s*var\(\s*--color-oxblood\s*\)/);
  });
});

describe('brand tokens — @theme block coverage', () => {
  it('integration_theme_block_has_all_seven_palette_tokens', () => {
    expect(themeBlock).toMatch(/--color-marble:/);
    expect(themeBlock).toMatch(/--color-parchment:/);
    expect(themeBlock).toMatch(/--color-ink:/);
    expect(themeBlock).toMatch(/--color-oxblood:/);
    expect(themeBlock).toMatch(/--color-verdigris:/);
    expect(themeBlock).toMatch(/--color-bone:/);
    expect(themeBlock).toMatch(/--color-shadow:/);
  });

  it('integration_theme_block_has_six_semantic_aliases', () => {
    expect(themeBlock).toMatch(/--color-background:/);
    expect(themeBlock).toMatch(/--color-foreground:/);
    expect(themeBlock).toMatch(/--color-muted:/);
    expect(themeBlock).toMatch(/--color-accent:/);
    expect(themeBlock).toMatch(/--color-success:/);
    expect(themeBlock).toMatch(/--color-link:/);
  });

  it('integration_theme_block_has_three_contrast_pair_categories', () => {
    const textPairs = themeBlock.match(/--pair-text-on-[a-z]+:/g) ?? [];
    const accentPairs = themeBlock.match(/--pair-accent-on-[a-z]+:/g) ?? [];
    const darkCtaPairs = themeBlock.match(/--pair-dark-cta-[a-z]+:/g) ?? [];
    expect(textPairs.length).toBeGreaterThanOrEqual(4);
    expect(accentPairs.length).toBeGreaterThanOrEqual(3);
    expect(darkCtaPairs.length).toBeGreaterThanOrEqual(3);
  });

  it('integration_body_references_background_and_foreground_vars', () => {
    expect(bodyBlock).toMatch(/background:\s*var\(\s*--color-background\s*\)/);
    expect(bodyBlock).toMatch(/color:\s*var\(\s*--color-foreground\s*\)/);
  });

  it('integration_body_uses_font_body_var', () => {
    expect(bodyBlock).toMatch(
      /font-family:\s*var\(\s*--font-body\s*\)\s*,\s*system-ui\s*,\s*sans-serif/,
    );
  });
});

describe('brand tokens — accessibility / contrast pair encoding', () => {
  it('a11y_contrast_pair_text_on_marble_declared: --pair-text-on-marble has a non-empty value', () => {
    const match = themeBlock.match(/--pair-text-on-marble:\s*([^;]+);/);
    expect(match).not.toBeNull();
    expect(match?.[1].trim().length).toBeGreaterThan(0);
  });

  it('a11y_contrast_pair_accent_on_marble_declared: --pair-accent-on-marble has a non-empty value', () => {
    const match = themeBlock.match(/--pair-accent-on-marble:\s*([^;]+);/);
    expect(match).not.toBeNull();
    expect(match?.[1].trim().length).toBeGreaterThan(0);
  });

  it('a11y_contrast_pair_dark_cta_declared: all three --pair-dark-cta-{fg,bg,accent} tokens declared', () => {
    expect(themeBlock).toMatch(/--pair-dark-cta-fg:\s*[^;]+;/);
    expect(themeBlock).toMatch(/--pair-dark-cta-bg:\s*[^;]+;/);
    expect(themeBlock).toMatch(/--pair-dark-cta-accent:\s*[^;]+;/);
  });
});

describe('brand tokens — infrastructure', () => {
  it('infra_globals_css_readable: globals.css exists and is readable', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it('infra_globals_css_imports_tailwindcss: starts with @import "tailwindcss"', () => {
    expect(css).toMatch(/^@import\s+"tailwindcss"\s*;/);
  });
});

describe('brand tokens — edge cases / forbidden patterns', () => {
  it('edge_no_pure_black_in_palette: @theme block contains no #000 / #000000', () => {
    expect(themeBlock).not.toMatch(/#000(?:000)?\b/i);
  });

  it('edge_no_pure_white_in_palette: @theme block contains no #fff / #ffffff', () => {
    expect(themeBlock).not.toMatch(/#fff(?:fff)?\b/i);
  });

  it('edge_dark_mode_media_block_removed: no @media prefers-color-scheme: dark anywhere in globals.css', () => {
    expect(css).not.toMatch(/prefers-color-scheme:\s*dark/);
  });

  it('edge_no_font_feature_settings_in_body: body block does not declare font-feature-settings', () => {
    expect(bodyBlock).not.toMatch(/font-feature-settings/);
  });

  it('edge_no_old_palette_tokens_remain: no --color-(ember|steel|mist|signal) declarations in globals.css', () => {
    expect(css).not.toMatch(/--color-ember\b/);
    expect(css).not.toMatch(/--color-steel\b/);
    expect(css).not.toMatch(/--color-mist\b/);
    expect(css).not.toMatch(/--color-signal\b/);
  });
});
