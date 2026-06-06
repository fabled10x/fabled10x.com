import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = join(process.cwd(), 'src/app/globals.css');
const css = readFileSync(cssPath, 'utf8');

const layoutPath = join(process.cwd(), 'src/app/layout.tsx');
const layoutSrc = readFileSync(layoutPath, 'utf8');

const layoutTestPath = join(process.cwd(), 'src/app/__tests__/layout.test.tsx');
const layoutTestSrc = readFileSync(layoutTestPath, 'utf8');

const themeBlock = (() => {
  const match = css.match(/@theme inline\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
})();

const bodyBlock = (() => {
  const match = css.match(/(?<!\.)\bbody\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
})();

// ─── Unit: @theme inline font alias repointing ───────────────────────────

describe('brand fonts — @theme inline alias repointing', () => {
  it('unit_font_display_alias_repointed: --font-display points at var(--font-display)', () => {
    expect(themeBlock).toMatch(/--font-display:\s*var\(\s*--font-display\s*\)/);
    expect(themeBlock).not.toMatch(/--font-display:\s*var\(\s*--font-geist-sans\s*\)/);
  });

  it('unit_font_body_alias_repointed: --font-body points at var(--font-body)', () => {
    expect(themeBlock).toMatch(/--font-body:\s*var\(\s*--font-body\s*\)/);
    expect(themeBlock).not.toMatch(/--font-body:\s*var\(\s*--font-geist-sans\s*\)/);
  });

  it('unit_font_mono_alias_repointed: --font-mono points at var(--font-mono)', () => {
    expect(themeBlock).toMatch(/--font-mono:\s*var\(\s*--font-mono\s*\)/);
    expect(themeBlock).not.toMatch(/--font-mono:\s*var\(\s*--font-geist-mono\s*\)/);
  });
});

// ─── Unit: no Geist token residue in globals.css ─────────────────────────

describe('brand fonts — Geist token residue purged', () => {
  it('unit_no_geist_sans_token_remains: globals.css contains no --font-geist-sans references', () => {
    expect(css).not.toMatch(/--font-geist-sans\b/);
  });

  it('unit_no_geist_mono_token_remains: globals.css contains no --font-geist-mono references', () => {
    expect(css).not.toMatch(/--font-geist-mono\b/);
  });
});

// ─── Unit: body font-family + no font-feature-settings ───────────────────

describe('brand fonts — body block', () => {
  it('unit_body_font_family_uses_body_var: body declares font-family via var(--font-body) with system-ui sans-serif fallback', () => {
    expect(bodyBlock).toMatch(
      /font-family:\s*var\(\s*--font-body\s*\)\s*,\s*system-ui\s*,\s*sans-serif/,
    );
  });

  it('unit_body_no_font_feature_settings: body block has no font-feature-settings declaration', () => {
    expect(bodyBlock).not.toMatch(/font-feature-settings\s*:/);
  });
});

// ─── Integration: prior-section tokens preserved ─────────────────────────

describe('brand fonts — sibling-section regression guards', () => {
  it('integration_so_1_1_palette_preserved: so-1.1 palette tokens still declared', () => {
    expect(themeBlock).toMatch(/--color-marble:\s*#F7F4EC\b/);
    expect(themeBlock).toMatch(/--color-ink:\s*#1C1814\b/);
    expect(themeBlock).toMatch(/--color-oxblood:\s*#6B2020\b/);
    expect(themeBlock).toMatch(/--color-background:\s*var\(\s*--color-marble\s*\)/);
  });

  it('integration_so_1_2_spacing_preserved: so-1.2 spacing + radius + edge tokens still declared', () => {
    expect(themeBlock).toMatch(/--space-0:\s*0\s*;/);
    expect(themeBlock).toMatch(/--space-2:\s*0\.5rem\b/);
    expect(themeBlock).toMatch(/--section-y-md:\s*var\(\s*--space-8\s*\)/);
    expect(themeBlock).toMatch(/--radius-card:\s*4px\b/);
    expect(themeBlock).toMatch(/--edge-color:\s*var\(\s*--color-ink\s*\)/);
  });

  it('integration_theme_block_coverage_fonts_appear: @theme block contains all three font alias declarations together', () => {
    expect(themeBlock).toMatch(/--font-display:/);
    expect(themeBlock).toMatch(/--font-body:/);
    expect(themeBlock).toMatch(/--font-mono:/);
  });
});

// ─── Accessibility: display swap + latin subset ──────────────────────────

describe('brand fonts — accessibility (FOIT avoidance, subset coverage)', () => {
  const cinzelCall = layoutSrc.match(/Cinzel\s*\(\s*\{([\s\S]*?)\}\s*\)/);
  const interCall = layoutSrc.match(/(?<!\w)Inter\s*\(\s*\{([\s\S]*?)\}\s*\)/);
  const jetbrainsCall = layoutSrc.match(/JetBrains_Mono\s*\(\s*\{([\s\S]*?)\}\s*\)/);

  it('a11y_display_swap_set: all three font loaders use display: "swap"', () => {
    expect(cinzelCall?.[1]).toMatch(/display:\s*['"]swap['"]/);
    expect(interCall?.[1]).toMatch(/display:\s*['"]swap['"]/);
    expect(jetbrainsCall?.[1]).toMatch(/display:\s*['"]swap['"]/);
  });

  it('a11y_latin_subset_loaded: all three font loaders include "latin" in subsets', () => {
    expect(cinzelCall?.[1]).toMatch(/subsets:\s*\[[^\]]*['"]latin['"]/);
    expect(interCall?.[1]).toMatch(/subsets:\s*\[[^\]]*['"]latin['"]/);
    expect(jetbrainsCall?.[1]).toMatch(/subsets:\s*\[[^\]]*['"]latin['"]/);
  });
});

// ─── Infrastructure: source-file scans on layout.tsx + layout.test.tsx ───

describe('brand fonts — infrastructure source-file scans', () => {
  it('infra_layout_imports_cinzel_inter_jetbrainsmono: layout.tsx import names Cinzel, Inter, JetBrains_Mono from next/font/google', () => {
    expect(layoutSrc).toMatch(
      /import\s*\{[^}]*\bCinzel\b[^}]*\bInter\b[^}]*\bJetBrains_Mono\b[^}]*\}\s*from\s*['"]next\/font\/google['"]/,
    );
  });

  it('infra_layout_no_geist_residue: layout.tsx contains no Geist or Geist_Mono references', () => {
    expect(layoutSrc).not.toMatch(/\bGeist(_Mono)?\b/);
  });

  it('infra_layout_test_mock_in_sync: layout.test.tsx vi.mock for next/font/google mocks Cinzel + Inter + JetBrains_Mono', () => {
    expect(layoutTestSrc).toMatch(/vi\.mock\(\s*['"]next\/font\/google['"]/);
    expect(layoutTestSrc).toMatch(/\bCinzel\b\s*:/);
    expect(layoutTestSrc).toMatch(/\bInter\b\s*:/);
    expect(layoutTestSrc).toMatch(/\bJetBrains_Mono\b\s*:/);
    expect(layoutTestSrc).not.toMatch(/\bGeist(_Mono)?\b/);
  });
});

// ─── Edge cases ──────────────────────────────────────────────────────────

describe('brand fonts — edge cases & forbidden patterns', () => {
  it('edge_no_geist_in_globals_css: globals.css contains no literal "Geist" or "geist-sans" or "geist-mono"', () => {
    expect(css).not.toMatch(/\bGeist\b/);
    expect(css).not.toMatch(/geist-sans\b/);
    expect(css).not.toMatch(/geist-mono\b/);
  });

  it('edge_font_aliases_appear_exactly_once_in_theme: each font alias declared exactly once in @theme block', () => {
    const displayMatches = themeBlock.match(/--font-display:/g) ?? [];
    const bodyMatches = themeBlock.match(/--font-body:/g) ?? [];
    const monoMatches = themeBlock.match(/--font-mono:/g) ?? [];
    expect(displayMatches.length).toBe(1);
    expect(bodyMatches.length).toBe(1);
    expect(monoMatches.length).toBe(1);
  });

  it('edge_no_extra_font_family_imported: layout.tsx imports exactly three font families from next/font/google', () => {
    const importMatch = layoutSrc.match(
      /import\s*\{([^}]+)\}\s*from\s*['"]next\/font\/google['"]/,
    );
    expect(importMatch).not.toBeNull();
    const identifiers = (importMatch![1] ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    expect(identifiers).toHaveLength(3);
    expect(identifiers.sort()).toEqual(['Cinzel', 'Inter', 'JetBrains_Mono'].sort());
  });

  it('edge_cinzel_weight_900_only: Cinzel loader weight is exactly ["900"]', () => {
    const call = layoutSrc.match(/Cinzel\s*\(\s*\{([\s\S]*?)\}\s*\)/);
    expect(call).not.toBeNull();
    expect(call![1]).toMatch(/weight:\s*\[\s*['"]900['"]\s*\]/);
  });

  it('edge_inter_weights_400_600_700: Inter loader weight contains 400, 600, 700 and not 500', () => {
    const call = layoutSrc.match(/(?<!\w)Inter\s*\(\s*\{([\s\S]*?)\}\s*\)/);
    expect(call).not.toBeNull();
    const weightMatch = call![1].match(/weight:\s*\[([^\]]+)\]/);
    expect(weightMatch).not.toBeNull();
    const weights = (weightMatch![1] ?? '').match(/['"](\d+)['"]/g) ?? [];
    const weightStrs = weights.map((w) => w.replace(/['"]/g, ''));
    expect(weightStrs).toContain('400');
    expect(weightStrs).toContain('600');
    expect(weightStrs).toContain('700');
    expect(weightStrs).not.toContain('500');
  });

  it('edge_jetbrains_mono_weights_400_500_no_bold: JetBrains_Mono loader weight contains 400, 500 and not 700', () => {
    const call = layoutSrc.match(/JetBrains_Mono\s*\(\s*\{([\s\S]*?)\}\s*\)/);
    expect(call).not.toBeNull();
    const weightMatch = call![1].match(/weight:\s*\[([^\]]+)\]/);
    expect(weightMatch).not.toBeNull();
    const weights = (weightMatch![1] ?? '').match(/['"](\d+)['"]/g) ?? [];
    const weightStrs = weights.map((w) => w.replace(/['"]/g, ''));
    expect(weightStrs).toContain('400');
    expect(weightStrs).toContain('500');
    expect(weightStrs).not.toContain('700');
  });
});
