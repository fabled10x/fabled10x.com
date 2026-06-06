import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = join(process.cwd(), 'src/app/globals.css');
const css = readFileSync(cssPath, 'utf8');

const themeBlock = (() => {
  const match = css.match(/@theme inline\s*\{([\s\S]*?)\n\}/);
  return match ? match[1] : '';
})();

const componentsBlock = (() => {
  const match = css.match(/@layer components\s*\{([\s\S]*)\n\}/);
  return match ? match[1] : '';
})();

const extractRule = (selector: string): string => {
  const escaped = selector.replace(/\./g, '\\.');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const match = componentsBlock.match(re);
  return match ? match[1] : '';
};

describe('brand tokens — display scale (Cinzel, all-caps, generously tracked)', () => {
  it('unit_type_display_1_clamp: --text-display-1 declared as clamp(2.5rem, 4vw + 1rem, 4rem)', () => {
    expect(themeBlock).toMatch(
      /--text-display-1:\s*clamp\(\s*2\.5rem\s*,\s*4vw\s*\+\s*1rem\s*,\s*4rem\s*\)/,
    );
  });

  it('unit_type_display_2_clamp: --text-display-2 declared as clamp(1.875rem, 2.5vw + 1rem, 2.75rem)', () => {
    expect(themeBlock).toMatch(
      /--text-display-2:\s*clamp\(\s*1\.875rem\s*,\s*2\.5vw\s*\+\s*1rem\s*,\s*2\.75rem\s*\)/,
    );
  });

  it('unit_type_display_3_fixed: --text-display-3 declared as 1.5rem', () => {
    expect(themeBlock).toMatch(/--text-display-3:\s*1\.5rem\b/);
  });

  it('unit_type_tracking_display: --tracking-display declared as 0.04em', () => {
    expect(themeBlock).toMatch(/--tracking-display:\s*0\.04em\b/);
  });

  it('unit_type_leading_display: --leading-display declared as 1.05', () => {
    expect(themeBlock).toMatch(/--leading-display:\s*1\.05\b/);
  });
});

describe('brand tokens — body scale (Inter, sentence case)', () => {
  it('unit_type_body_1: --text-body-1 declared as 1.125rem (18px)', () => {
    expect(themeBlock).toMatch(/--text-body-1:\s*1\.125rem\b/);
  });

  it('unit_type_body_2: --text-body-2 declared as 1rem (16px)', () => {
    expect(themeBlock).toMatch(/--text-body-2:\s*1rem\b/);
  });

  it('unit_type_body_3: --text-body-3 declared as 0.875rem (14px)', () => {
    expect(themeBlock).toMatch(/--text-body-3:\s*0\.875rem\b/);
  });

  it('unit_type_leading_body: --leading-body declared as 1.6', () => {
    expect(themeBlock).toMatch(/--leading-body:\s*1\.6\b/);
  });
});

describe('brand tokens — label scale (Inter, uppercase, very tracked)', () => {
  it('unit_type_label_size: --text-label declared as 0.75rem (12px)', () => {
    expect(themeBlock).toMatch(/--text-label:\s*0\.75rem\b/);
  });

  it('unit_type_tracking_label: --tracking-label declared as 0.18em', () => {
    expect(themeBlock).toMatch(/--tracking-label:\s*0\.18em\b/);
  });
});

describe('type utilities — .display-1 / -2 / -3 (Cinzel display rule)', () => {
  it('unit_util_display_1_full_shape: .display-1 resolves font-display, weight 900, --text-display-1, tracking/leading-display, uppercase, --pair-text-on-marble', () => {
    const rule = extractRule('.display-1');
    expect(rule).toMatch(/font-family:\s*var\(\s*--font-display\s*\)/);
    expect(rule).toMatch(/font-weight:\s*900\b/);
    expect(rule).toMatch(/font-size:\s*var\(\s*--text-display-1\s*\)/);
    expect(rule).toMatch(/letter-spacing:\s*var\(\s*--tracking-display\s*\)/);
    expect(rule).toMatch(/line-height:\s*var\(\s*--leading-display\s*\)/);
    expect(rule).toMatch(/text-transform:\s*uppercase\b/);
    expect(rule).toMatch(/color:\s*var\(\s*--pair-text-on-marble\s*\)/);
  });

  it('unit_util_display_2_size_ref: .display-2 references --text-display-2 (not -1 or -3)', () => {
    expect(extractRule('.display-2')).toMatch(
      /font-size:\s*var\(\s*--text-display-2\s*\)/,
    );
  });

  it('unit_util_display_3_size_ref: .display-3 references --text-display-3', () => {
    expect(extractRule('.display-3')).toMatch(
      /font-size:\s*var\(\s*--text-display-3\s*\)/,
    );
  });
});

describe('type utilities — .body-1 / -2 / -3 (Inter body rule)', () => {
  it('unit_util_body_1_full_shape: .body-1 resolves font-body + system-ui fallback, weight 400, --text-body-1, --leading-body', () => {
    const rule = extractRule('.body-1');
    expect(rule).toMatch(
      /font-family:\s*var\(\s*--font-body\s*\)\s*,\s*system-ui\s*,\s*sans-serif/,
    );
    expect(rule).toMatch(/font-weight:\s*400\b/);
    expect(rule).toMatch(/font-size:\s*var\(\s*--text-body-1\s*\)/);
    expect(rule).toMatch(/line-height:\s*var\(\s*--leading-body\s*\)/);
  });

  it('unit_util_body_2_size_ref: .body-2 references --text-body-2', () => {
    expect(extractRule('.body-2')).toMatch(
      /font-size:\s*var\(\s*--text-body-2\s*\)/,
    );
  });

  it('unit_util_body_3_size_ref: .body-3 references --text-body-3 and uses --color-muted for meta-text role', () => {
    const rule = extractRule('.body-3');
    expect(rule).toMatch(/font-size:\s*var\(\s*--text-body-3\s*\)/);
    expect(rule).toMatch(/color:\s*var\(\s*--color-muted\s*\)/);
  });
});

describe('type utilities — .label + .mono', () => {
  it('unit_util_label_full_shape: .label resolves font-body weight 600, --text-label, --tracking-label, uppercase, --pair-accent-on-marble', () => {
    const rule = extractRule('.label');
    expect(rule).toMatch(/font-family:\s*var\(\s*--font-body\s*\)/);
    expect(rule).toMatch(/font-weight:\s*600\b/);
    expect(rule).toMatch(/font-size:\s*var\(\s*--text-label\s*\)/);
    expect(rule).toMatch(/letter-spacing:\s*var\(\s*--tracking-label\s*\)/);
    expect(rule).toMatch(/text-transform:\s*uppercase\b/);
    expect(rule).toMatch(/color:\s*var\(\s*--pair-accent-on-marble\s*\)/);
  });

  it('unit_util_mono_full_shape: .mono resolves font-mono + ui-monospace fallback, weight 400, --text-body-3, letter-spacing 0', () => {
    const rule = extractRule('.mono');
    expect(rule).toMatch(
      /font-family:\s*var\(\s*--font-mono\s*\)\s*,\s*ui-monospace\s*,\s*monospace/,
    );
    expect(rule).toMatch(/font-weight:\s*400\b/);
    expect(rule).toMatch(/font-size:\s*var\(\s*--text-body-3\s*\)/);
    expect(rule).toMatch(/letter-spacing:\s*0\b/);
  });
});

describe('type scale — block coverage (integration)', () => {
  it('integration_type_scale_tokens_in_theme_block: all 11 type-scale tokens present inside @theme block', () => {
    const required = [
      '--text-display-1:',
      '--text-display-2:',
      '--text-display-3:',
      '--tracking-display:',
      '--leading-display:',
      '--text-body-1:',
      '--text-body-2:',
      '--text-body-3:',
      '--leading-body:',
      '--text-label:',
      '--tracking-label:',
    ];
    for (const token of required) {
      expect(themeBlock).toContain(token);
    }
  });

  it('integration_type_utilities_in_components_layer: all 8 type utilities present inside @layer components', () => {
    const selectors = [
      '.display-1',
      '.display-2',
      '.display-3',
      '.body-1',
      '.body-2',
      '.body-3',
      '.label',
      '.mono',
    ];
    for (const sel of selectors) {
      const escaped = sel.replace(/\./g, '\\.');
      expect(componentsBlock).toMatch(new RegExp(`${escaped}\\s*\\{`));
    }
  });

  it('integration_so_1_palette_preserved: so-1.1 palette + contrast pairs intact (regression guard)', () => {
    expect(themeBlock).toMatch(/--color-marble:\s*#F7F4EC\b/);
    expect(themeBlock).toMatch(/--color-oxblood:\s*#6B2020\b/);
    expect(themeBlock).toContain('--pair-text-on-marble:');
    expect(themeBlock).toContain('--pair-accent-on-marble:');
  });

  it('integration_so_1_2_spacing_radius_preserved: so-1.2 spacing + radius + edge tokens intact (regression guard)', () => {
    const required = [
      '--space-0:',
      '--space-px:',
      '--space-10:',
      '--radius-sharp:',
      '--radius-card:',
      '--edge-color:',
      '--edge-color-subtle:',
    ];
    for (const t of required) {
      expect(themeBlock).toContain(t);
    }
  });

  it('integration_so_2_1_font_aliases_preserved: so-2.1 font aliases intact and self-referential (regression guard)', () => {
    expect(themeBlock).toMatch(/--font-display:\s*var\(\s*--font-display\s*\)/);
    expect(themeBlock).toMatch(/--font-body:\s*var\(\s*--font-body\s*\)/);
    expect(themeBlock).toMatch(/--font-mono:\s*var\(\s*--font-mono\s*\)/);
  });

  it('integration_build_log_prose_preserved: .build-log-prose @layer components block preserved (so-2.4 retrofit comes later)', () => {
    expect(componentsBlock).toMatch(/\.build-log-prose\s*\{/);
    expect(componentsBlock).toMatch(/\.build-log-prose\s+h2\s*\{/);
    expect(componentsBlock).toMatch(/\.build-log-prose\s+pre\s*\{/);
  });
});

describe('type scale — infrastructure (counts + completeness)', () => {
  it('infra_text_display_count_complete: exactly 3 --text-display-* declarations (1/2/3, no display-4 per brand spec)', () => {
    const matches = themeBlock.match(/--text-display-\d+:/g) ?? [];
    expect(matches).toHaveLength(3);
  });

  it('infra_text_body_count_complete: exactly 3 --text-body-* declarations (1/2/3)', () => {
    const matches = themeBlock.match(/--text-body-\d+:/g) ?? [];
    expect(matches).toHaveLength(3);
  });

  it('infra_display_util_count_complete: exactly 3 .display-N utility rules in @layer components', () => {
    const matches = componentsBlock.match(/\.display-\d+\s*\{/g) ?? [];
    expect(matches).toHaveLength(3);
  });

  it('infra_body_util_count_complete: exactly 3 .body-N utility rules in @layer components', () => {
    const matches = componentsBlock.match(/\.body-\d+\s*\{/g) ?? [];
    expect(matches).toHaveLength(3);
  });
});

describe('type scale — accessibility', () => {
  it('a11y_uppercase_via_text_transform: display + label utilities apply uppercase via text-transform (preserves screen-reader pronunciation)', () => {
    expect(extractRule('.display-1')).toMatch(/text-transform:\s*uppercase\b/);
    expect(extractRule('.display-2')).toMatch(/text-transform:\s*uppercase\b/);
    expect(extractRule('.display-3')).toMatch(/text-transform:\s*uppercase\b/);
    expect(extractRule('.label')).toMatch(/text-transform:\s*uppercase\b/);
  });

  it('a11y_body_leading_meets_15_min: --leading-body satisfies WCAG 1.4.12 spacing minimum (line-height >= 1.5)', () => {
    const m = themeBlock.match(/--leading-body:\s*([\d.]+)/);
    expect(m).not.toBeNull();
    if (m) {
      expect(Number(m[1])).toBeGreaterThanOrEqual(1.5);
    }
  });

  it('a11y_label_tracking_does_not_break_words: --tracking-label within editorial bounds (0.10em < v < 0.25em)', () => {
    const m = themeBlock.match(/--tracking-label:\s*([\d.]+)em/);
    expect(m).not.toBeNull();
    if (m) {
      const v = Number(m[1]);
      expect(v).toBeGreaterThan(0.10);
      expect(v).toBeLessThan(0.25);
    }
  });
});

describe('type scale — forbidden patterns (edge cases)', () => {
  it('edge_display_clamps_use_three_args: every --text-display-* clamp() declares exactly 3 comma-separated args', () => {
    const clampDecls = [
      ...themeBlock.matchAll(/--text-display-\d+:\s*clamp\(([^)]+)\)/g),
    ];
    expect(clampDecls.length).toBeGreaterThan(0);
    for (const [, args] of clampDecls) {
      const parts = args.split(',').map((s) => s.trim());
      expect(parts).toHaveLength(3);
    }
  });

  it('edge_no_text_display_4_or_higher: no --text-display-4..-9 declared (brand spec stops at -3)', () => {
    expect(themeBlock).not.toMatch(/--text-display-[4-9]\b/);
  });

  it('edge_no_text_body_4_or_higher: no --text-body-4..-9 declared (body scale stops at -3)', () => {
    expect(themeBlock).not.toMatch(/--text-body-[4-9]\b/);
  });

  it('edge_no_hardcoded_pixel_font_sizes_in_utilities: every typography utility uses var() for font-size', () => {
    const selectors = [
      '.display-1',
      '.display-2',
      '.display-3',
      '.body-1',
      '.body-2',
      '.body-3',
      '.label',
      '.mono',
    ];
    for (const sel of selectors) {
      const rule = extractRule(sel);
      const fs = rule.match(/font-size:\s*([^;]+);/);
      expect(fs, `${sel} missing font-size declaration`).not.toBeNull();
      if (fs) {
        expect(
          fs[1].trim(),
          `${sel} should use var(...) for font-size, got: ${fs[1].trim()}`,
        ).toMatch(/^var\(/);
      }
    }
  });

  it('edge_no_color_hex_in_utility_rules: typography utility blocks contain no raw hex colors', () => {
    const selectors = [
      '.display-1',
      '.display-2',
      '.display-3',
      '.body-1',
      '.body-2',
      '.body-3',
      '.label',
    ];
    for (const sel of selectors) {
      const rule = extractRule(sel);
      expect(rule, `${sel} contains a raw hex color`).not.toMatch(
        /#[0-9a-fA-F]{3,8}\b/,
      );
    }
  });
});

describe('type scale — error recovery (font fallback chain)', () => {
  it('err_font_family_fallback_chain_present: each utility includes generic-family fallback after var(--font-*)', () => {
    expect(extractRule('.display-1')).toMatch(
      /font-family:\s*var\(\s*--font-display\s*\)\s*,\s*serif\b/,
    );
    expect(extractRule('.body-1')).toMatch(
      /font-family:\s*var\(\s*--font-body\s*\)\s*,\s*system-ui\s*,\s*sans-serif\b/,
    );
    expect(extractRule('.label')).toMatch(
      /font-family:\s*var\(\s*--font-body\s*\)\s*,\s*system-ui\s*,\s*sans-serif\b/,
    );
    expect(extractRule('.mono')).toMatch(
      /font-family:\s*var\(\s*--font-mono\s*\)\s*,\s*ui-monospace\s*,\s*monospace\b/,
    );
  });
});

describe('type scale — data integrity (cross-role token references)', () => {
  it('data_display_utilities_reference_display_tokens_only: .display-N uses display-scoped tokens, not body/label tokens', () => {
    for (const [sel, n] of [
      ['.display-1', 1],
      ['.display-2', 2],
      ['.display-3', 3],
    ] as const) {
      const rule = extractRule(sel);
      expect(rule).toMatch(
        new RegExp(`font-size:\\s*var\\(\\s*--text-display-${n}\\s*\\)`),
      );
      expect(rule).toMatch(/letter-spacing:\s*var\(\s*--tracking-display\s*\)/);
      expect(rule).toMatch(/line-height:\s*var\(\s*--leading-display\s*\)/);
      expect(rule).not.toMatch(/var\(\s*--text-body/);
      expect(rule).not.toMatch(/var\(\s*--tracking-label/);
    }
  });

  it('data_body_utilities_reference_body_tokens_only: .body-N uses body-scoped tokens, not display/label tokens', () => {
    for (const [sel, n] of [
      ['.body-1', 1],
      ['.body-2', 2],
      ['.body-3', 3],
    ] as const) {
      const rule = extractRule(sel);
      expect(rule).toMatch(
        new RegExp(`font-size:\\s*var\\(\\s*--text-body-${n}\\s*\\)`),
      );
      expect(rule).toMatch(/line-height:\s*var\(\s*--leading-body\s*\)/);
      expect(rule).not.toMatch(/var\(\s*--text-display/);
      expect(rule).not.toMatch(/var\(\s*--leading-display/);
    }
  });

  it('data_label_uses_label_tokens: .label uses --text-label / --tracking-label (not display equivalents)', () => {
    const rule = extractRule('.label');
    expect(rule).toMatch(/font-size:\s*var\(\s*--text-label\s*\)/);
    expect(rule).toMatch(/letter-spacing:\s*var\(\s*--tracking-label\s*\)/);
    expect(rule).not.toMatch(/var\(\s*--text-display/);
    expect(rule).not.toMatch(/var\(\s*--tracking-display/);
  });
});
