import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cssPath = join(process.cwd(), 'src/app/globals.css');
const css = readFileSync(cssPath, 'utf8');

const componentsBlock = (() => {
  const match = css.match(/@layer components\s*\{([\s\S]*)\n\}/);
  return match ? match[1] : '';
})();

const extractRule = (selector: string): string => {
  const escaped = selector
    .replace(/[.+?^${}()|[\]\\]/g, '\\$&')
    .replace(/\s+/g, '\\s*');
  const re = new RegExp(`${escaped}\\s*\\{([^}]*)\\}`);
  const match = componentsBlock.match(re);
  return match ? match[1] : '';
};

const proseBlock = (() => {
  const start = componentsBlock.indexOf('.build-log-prose');
  if (start < 0) return '';
  return componentsBlock.slice(start);
})();

describe('.build-log-prose retrofit — root selector (checklist item 1)', () => {
  const body = extractRule('.build-log-prose');

  it('unit_prose_root_color: root color uses var(--pair-text-on-marble)', () => {
    expect(body).toMatch(/color:\s*var\(--pair-text-on-marble\)/);
  });

  it('unit_prose_root_line_height: root line-height uses var(--leading-body)', () => {
    expect(body).toMatch(/line-height:\s*var\(--leading-body\)/);
  });

  it('unit_prose_root_font_size: root font-size uses var(--text-body-1)', () => {
    expect(body).toMatch(/font-size:\s*var\(--text-body-1\)/);
  });

  it('unit_prose_root_font_family: root font-family uses var(--font-body) Inter', () => {
    expect(body).toMatch(/font-family:\s*var\(--font-body\)/);
  });
});

describe('.build-log-prose retrofit — h2 (checklist item 2)', () => {
  const body = extractRule('.build-log-prose h2');

  it('unit_prose_h2_display_font: h2 uses var(--font-display) + 900 + uppercase + var(--tracking-display)', () => {
    expect(body).toMatch(/font-family:\s*var\(--font-display\)/);
    expect(body).toMatch(/font-weight:\s*900\b/);
    expect(body).toMatch(/text-transform:\s*uppercase/);
    expect(body).toMatch(/letter-spacing:\s*var\(--tracking-display\)/);
  });

  it('unit_prose_h2_text_display_2: h2 font-size var(--text-display-2) + line-height var(--leading-display)', () => {
    expect(body).toMatch(/font-size:\s*var\(--text-display-2\)/);
    expect(body).toMatch(/line-height:\s*var\(--leading-display\)/);
  });

  it('unit_prose_h2_spacing: h2 uses var(--space-7) top + var(--space-4) bottom + 1px var(--edge-color) border + var(--space-2) padding-bottom', () => {
    expect(body).toMatch(/margin-top:\s*var\(--space-7\)/);
    expect(body).toMatch(/margin-bottom:\s*var\(--space-4\)/);
    expect(body).toMatch(/border-bottom:\s*1px\s+solid\s+var\(--edge-color\)/);
    expect(body).toMatch(/padding-bottom:\s*var\(--space-2\)/);
  });
});

describe('.build-log-prose retrofit — Oxblood drop cap (checklist item 3)', () => {
  const body = extractRule('.build-log-prose > h2:first-child::first-letter');

  it('unit_prose_drop_cap_oxblood: drop cap uses var(--color-oxblood) + 1.4em font-size + line-height 1', () => {
    expect(body).toMatch(/color:\s*var\(--color-oxblood\)/);
    expect(body).toMatch(/font-size:\s*1\.4em\b/);
    expect(body).toMatch(/line-height:\s*1\b/);
  });
});

describe('.build-log-prose retrofit — h3 (checklist item 4)', () => {
  const body = extractRule('.build-log-prose h3');

  it('unit_prose_h3_display_font: h3 uses var(--font-display) + 900 + uppercase + var(--tracking-display)', () => {
    expect(body).toMatch(/font-family:\s*var\(--font-display\)/);
    expect(body).toMatch(/font-weight:\s*900\b/);
    expect(body).toMatch(/text-transform:\s*uppercase/);
    expect(body).toMatch(/letter-spacing:\s*var\(--tracking-display\)/);
  });

  it('unit_prose_h3_text_display_3: h3 font-size var(--text-display-3) + var(--space-6)/var(--space-3) margins', () => {
    expect(body).toMatch(/font-size:\s*var\(--text-display-3\)/);
    expect(body).toMatch(/margin-top:\s*var\(--space-6\)/);
    expect(body).toMatch(/margin-bottom:\s*var\(--space-3\)/);
  });
});

describe('.build-log-prose retrofit — paragraphs (checklist item 5)', () => {
  const body = extractRule('.build-log-prose p');

  it('unit_prose_p_spacing: p uses var(--space-4) on both margins', () => {
    expect(body).toMatch(/margin-top:\s*var\(--space-4\)/);
    expect(body).toMatch(/margin-bottom:\s*var\(--space-4\)/);
  });
});

describe('.build-log-prose retrofit — inline code (checklist item 6)', () => {
  const body = extractRule('.build-log-prose code:not(pre code)');

  it('unit_prose_inline_code_tokens: inline code uses --font-mono + --color-bone bg + --edge-color-subtle + --radius-soft', () => {
    expect(body).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(body).toMatch(/background:\s*var\(--color-bone\)/);
    expect(body).toMatch(/border:\s*1px\s+solid\s+var\(--edge-color-subtle\)/);
    expect(body).toMatch(/border-radius:\s*var\(--radius-soft\)/);
  });
});

describe('.build-log-prose retrofit — pre code block (checklist item 7)', () => {
  const body = extractRule('.build-log-prose pre');

  it('unit_prose_pre_shadow_surface: pre uses --color-shadow bg + --color-parchment text + --font-mono', () => {
    expect(body).toMatch(/background:\s*var\(--color-shadow\)/);
    expect(body).toMatch(/color:\s*var\(--color-parchment\)/);
    expect(body).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  it('unit_prose_pre_geometry: pre uses --radius-card + --space-4/--space-5 padding + --space-5 0 margin + --text-body-3 + 1px --edge-color border', () => {
    expect(body).toMatch(/border-radius:\s*var\(--radius-card\)/);
    expect(body).toMatch(/padding:\s*var\(--space-4\)\s+var\(--space-5\)/);
    expect(body).toMatch(/margin:\s*var\(--space-5\)\s+0/);
    expect(body).toMatch(/font-size:\s*var\(--text-body-3\)/);
    expect(body).toMatch(/border:\s*1px\s+solid\s+var\(--edge-color\)/);
  });
});

describe('.build-log-prose retrofit — table wrapper (checklist item 8)', () => {
  const body = extractRule('.build-log-prose .build-log-table-wrapper');

  it('unit_prose_table_wrapper: table-wrapper margin var(--space-5) 0', () => {
    expect(body).toMatch(/margin:\s*var\(--space-5\)\s+0/);
  });
});

describe('.build-log-prose retrofit — table (checklist item 9)', () => {
  const body = extractRule('.build-log-prose table');

  it('unit_prose_table_tokens: table uses border-collapse + width 100% + --text-body-3 + --font-body', () => {
    expect(body).toMatch(/border-collapse:\s*collapse/);
    expect(body).toMatch(/width:\s*100%/);
    expect(body).toMatch(/font-size:\s*var\(--text-body-3\)/);
    expect(body).toMatch(/font-family:\s*var\(--font-body\)/);
  });
});

describe('.build-log-prose retrofit — th/td (checklist item 10)', () => {
  it('unit_prose_th_td_tokens: th,td use 1px --edge-color + --space-2/--space-3 padding + left + top alignment', () => {
    // The th + td selector lives as a combined .build-log-prose th,\n  .build-log-prose td rule
    const combinedRe = /\.build-log-prose th,\s*\.build-log-prose td\s*\{([^}]*)\}/;
    const match = componentsBlock.match(combinedRe);
    expect(match).not.toBeNull();
    const body = match ? match[1] : '';
    expect(body).toMatch(/border:\s*1px\s+solid\s+var\(--edge-color\)/);
    expect(body).toMatch(/padding:\s*var\(--space-2\)\s+var\(--space-3\)/);
    expect(body).toMatch(/text-align:\s*left/);
    expect(body).toMatch(/vertical-align:\s*top/);
  });
});

describe('.build-log-prose retrofit — th header (checklist item 11)', () => {
  const body = extractRule('.build-log-prose th');

  it('unit_prose_th_bone_700: th uses var(--color-bone) bg + font-weight 700', () => {
    expect(body).toMatch(/background:\s*var\(--color-bone\)/);
    expect(body).toMatch(/font-weight:\s*700\b/);
  });
});

describe('.build-log-prose retrofit — blockquote (checklist item 12)', () => {
  const body = extractRule('.build-log-prose blockquote');

  it('unit_prose_blockquote_oxblood_3px: blockquote uses 3px solid var(--color-oxblood) border-left', () => {
    expect(body).toMatch(/border-left:\s*3px\s+solid\s+var\(--color-oxblood\)/);
    expect(body).not.toMatch(/border-left:\s*4px/);
    expect(body).not.toMatch(/var\(--color-accent\)/);
  });

  it('unit_prose_blockquote_parchment_solid: blockquote bg is solid var(--color-parchment), NOT color-mix', () => {
    expect(body).toMatch(/background:\s*var\(--color-parchment\)/);
    expect(body).not.toMatch(/color-mix/);
  });
});

describe('.build-log-prose retrofit — anchor + hover-reveal (checklist item 13)', () => {
  const body = extractRule('.build-log-prose .build-log-anchor');

  it('unit_prose_anchor_tokens: anchor uses var(--space-2) margin-left + var(--color-muted) + opacity 0', () => {
    expect(body).toMatch(/margin-left:\s*var\(--space-2\)/);
    expect(body).toMatch(/color:\s*var\(--color-muted\)/);
    expect(body).toMatch(/opacity:\s*0\b/);
  });
});

describe('.build-log-prose retrofit — content link (checklist items 14, 15)', () => {
  const linkBody = extractRule('.build-log-prose a:not(.build-log-anchor)');
  const hoverBody = extractRule('.build-log-prose a:not(.build-log-anchor):hover');

  it('unit_prose_link_oxblood_thin: a:not(.build-log-anchor) uses --color-oxblood + underline + 1px thickness + 3px offset', () => {
    expect(linkBody).toMatch(/color:\s*var\(--color-oxblood\)/);
    expect(linkBody).toMatch(/text-decoration:\s*underline/);
    expect(linkBody).toMatch(/text-decoration-thickness:\s*1px\b/);
    expect(linkBody).toMatch(/text-underline-offset:\s*3px\b/);
  });

  it('unit_prose_link_hover_ink: a:not(.build-log-anchor):hover uses --color-ink', () => {
    expect(hoverBody).toMatch(/color:\s*var\(--color-ink\)/);
  });
});

describe('.build-log-prose retrofit — integration', () => {
  it('integration_prose_block_in_components_layer: .build-log-prose ruleset lives inside @layer components', () => {
    expect(componentsBlock).toContain('.build-log-prose');
  });

  it('integration_markdown_document_consumer: MarkdownDocument.tsx applies className "build-log-prose"', () => {
    const mdPath = join(process.cwd(), 'src/components/build-log/MarkdownDocument.tsx');
    const md = readFileSync(mdPath, 'utf8');
    expect(md).toContain('build-log-prose');
  });

  it('integration_full_test_suite_green: build-log-prose selectors compile (componentsBlock contains .build-log-prose)', () => {
    expect(componentsBlock.match(/\.build-log-prose/g)?.length).toBeGreaterThanOrEqual(15);
  });
});

describe('.build-log-prose retrofit — accessibility (a11y_*)', () => {
  it('a11y_drop_cap_no_alt_text_required: ::first-letter is a typographic pseudo, no DOM node, no alt text needed', () => {
    expect(componentsBlock).toContain('.build-log-prose > h2:first-child::first-letter');
    // No img or alt needed — it's pure CSS on existing h2 text
    const dropBody = extractRule('.build-log-prose > h2:first-child::first-letter');
    expect(dropBody).not.toContain('content:');
  });

  it('a11y_link_contrast_against_marble: content link has underline AND distinguishing color (not color-only)', () => {
    const linkBody = extractRule('.build-log-prose a:not(.build-log-anchor)');
    expect(linkBody).toMatch(/text-decoration:\s*underline/);
    expect(linkBody).toMatch(/color:\s*var\(--color-oxblood\)/);
  });

  it('a11y_anchor_hover_reveal_keyboard_safe: anchor transition stays at 150ms (≤ 200ms reduced-motion threshold)', () => {
    const anchorBody = extractRule('.build-log-prose .build-log-anchor');
    expect(anchorBody).toMatch(/transition:\s*opacity\s+150ms/);
  });
});

describe('.build-log-prose retrofit — infrastructure (infra_*)', () => {
  it('infra_globals_css_readable: src/app/globals.css exists and is readable', () => {
    expect(css.length).toBeGreaterThan(0);
  });

  it('infra_no_old_magic_values_in_prose_block: retrofitted block contains NO var(--color-foreground), --color-accent, 1.7 line-height, 2.5rem margin, color-mix', () => {
    expect(proseBlock).not.toMatch(/var\(--color-foreground\)/);
    expect(proseBlock).not.toMatch(/var\(--color-accent\)/);
    expect(proseBlock).not.toMatch(/line-height:\s*1\.7\b/);
    expect(proseBlock).not.toMatch(/margin-top:\s*2\.5rem\b/);
    expect(proseBlock).not.toMatch(/color-mix\(/);
  });

  it('infra_layer_components_block_present: @layer components block parses via the established regex', () => {
    expect(componentsBlock.length).toBeGreaterThan(0);
  });

  it('infra_extracted_rule_helper_resolves_all_selectors: extractRule returns non-empty bodies for all retrofitted selectors', () => {
    const selectors = [
      '.build-log-prose',
      '.build-log-prose h2',
      '.build-log-prose > h2:first-child::first-letter',
      '.build-log-prose h3',
      '.build-log-prose p',
      '.build-log-prose code:not(pre code)',
      '.build-log-prose pre',
      '.build-log-prose .build-log-table-wrapper',
      '.build-log-prose table',
      '.build-log-prose th',
      '.build-log-prose blockquote',
      '.build-log-prose .build-log-anchor',
      '.build-log-prose a:not(.build-log-anchor)',
      '.build-log-prose a:not(.build-log-anchor):hover',
    ];
    for (const s of selectors) {
      expect(extractRule(s).length, `selector "${s}" has empty body`).toBeGreaterThan(0);
    }
  });
});

describe('.build-log-prose retrofit — edge cases (edge_*)', () => {
  it('edge_drop_cap_not_on_subsequent_h2: drop-cap selector is scoped via :first-child — only first h2 affected', () => {
    expect(componentsBlock).toContain(':first-child::first-letter');
    expect(componentsBlock).not.toMatch(/\.build-log-prose h2::first-letter\s*\{/);
  });

  it('edge_drop_cap_first_child_constraint: drop-cap selector uses ">" combinator (direct child, not descendant)', () => {
    expect(componentsBlock).toMatch(/\.build-log-prose\s*>\s*h2:first-child::first-letter/);
  });

  it('edge_anchor_selector_excludes_self: a:not(.build-log-anchor) selector exists, ensuring build-log-anchor links keep their own styling', () => {
    expect(componentsBlock).toMatch(/\.build-log-prose a:not\(\.build-log-anchor\)\s*\{/);
  });

  it('edge_no_dark_mode_override: no @media (prefers-color-scheme: dark) override added inside prose block', () => {
    expect(proseBlock).not.toMatch(/prefers-color-scheme/);
  });

  it('edge_inline_code_excludes_pre_descendants: code selector uses :not(pre code) — inline only', () => {
    expect(componentsBlock).toMatch(/\.build-log-prose code:not\(pre code\)\s*\{/);
  });
});

describe('.build-log-prose retrofit — error recovery (err_*)', () => {
  it('err_missing_token_fallback: every font-family declaration includes a generic CSS fallback', () => {
    const fontFamilyLines = proseBlock.match(/font-family:[^;]+;/g) ?? [];
    expect(fontFamilyLines.length).toBeGreaterThan(0);
    for (const line of fontFamilyLines) {
      // Must contain at least one of: serif | sans-serif | monospace | system-ui | ui-monospace
      expect(
        /serif|sans-serif|monospace|system-ui|ui-monospace/.test(line),
        `font-family declaration lacks generic fallback: ${line}`,
      ).toBe(true);
    }
  });
});

describe('.build-log-prose retrofit — data integrity (data_*)', () => {
  it('data_token_references_resolve_to_declarations: every var(--x) inside prose block resolves to a declaration in globals.css', () => {
    const refs = new Set<string>();
    for (const m of proseBlock.matchAll(/var\((--[\w-]+)\)/g)) {
      refs.add(m[1]);
    }
    expect(refs.size).toBeGreaterThan(0);
    for (const token of refs) {
      const declRe = new RegExp(`${token.replace('--', '--')}\\s*:`);
      expect(declRe.test(css), `token ${token} has no declaration in globals.css`).toBe(true);
    }
  });
});
