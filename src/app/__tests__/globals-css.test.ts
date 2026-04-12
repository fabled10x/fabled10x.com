import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const cssPath = resolve(__dirname, '../globals.css');
const cssContent = readFileSync(cssPath, 'utf-8');

describe('globals.css brand tokens', () => {
  // --- Unit: individual brand color hex values ---

  it('unit_brand_ink_hex', () => {
    expect(cssContent).toContain('--color-ink: #0a0a0a');
  });

  it('unit_brand_parchment_hex', () => {
    expect(cssContent).toContain('--color-parchment: #faf8f3');
  });

  it('unit_brand_ember_hex', () => {
    expect(cssContent).toContain('--color-ember: #c2410c');
  });

  it('unit_brand_steel_hex', () => {
    expect(cssContent).toContain('--color-steel: #475569');
  });

  it('unit_brand_mist_hex', () => {
    expect(cssContent).toContain('--color-mist: #e2e8f0');
  });

  it('unit_brand_signal_hex', () => {
    expect(cssContent).toContain('--color-signal: #0891b2');
  });

  // --- Edge: completeness guard ---

  it('edge_all_six_brand_colors_present', () => {
    const brandNames = ['ink', 'parchment', 'ember', 'steel', 'mist', 'signal'];
    for (const name of brandNames) {
      expect(cssContent).toContain(`--color-${name}:`);
    }
  });

  // --- Edge: dark mode overrides ---

  it('edge_dark_mode_overrides_present', () => {
    expect(cssContent).toContain('prefers-color-scheme: dark');
    expect(cssContent).toContain('#0d0d0f');
    expect(cssContent).toContain('#e8e8e3');
    expect(cssContent).toContain('#94a3b8');
    expect(cssContent).toContain('#1e293b');
  });

  // --- Edge: typography ---

  it('edge_font_feature_settings', () => {
    expect(cssContent).toContain('font-feature-settings');
  });

  // --- Smoke: file exists and is non-empty ---

  it('smoke_globals_css_importable', () => {
    expect(cssContent.length).toBeGreaterThan(0);
    expect(cssContent).toContain('@import "tailwindcss"');
  });
});
