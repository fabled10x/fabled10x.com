import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

import { StatusBadge } from '../StatusBadge';
import { JobCard } from '../JobCard';
import { JobsRollupTable } from '../JobsRollupTable';
import * as buildLogBarrel from '..';
import type { JobRollupEntry } from '@/content/schemas';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const STATUS_BADGE_SOURCE = 'src/components/build-log/StatusBadge.tsx';
const STATUS_BADGE_SRC = readSource(STATUS_BADGE_SOURCE);
const GLOBALS_CSS = readSource('src/app/globals.css');

type Status = JobRollupEntry['status'];
const STATUSES: Status[] = ['planned', 'in-progress', 'complete', 'unknown'];

function rootFor(container: HTMLElement, status: Status): HTMLElement {
  const el = container.querySelector<HTMLElement>(`[data-testid="status-badge-${status}"]`);
  expect(el, `root for ${status} not found`).not.toBeNull();
  return el!;
}

function makeRollup(over: Partial<JobRollupEntry> = {}): JobRollupEntry {
  return {
    slug: 'sample-job',
    title: 'Sample Job',
    totalFeatures: 5,
    completedFeatures: 2,
    liveFeatures: 1,
    percentComplete: 40,
    status: 'in-progress',
    ...over,
  };
}

describe('StatusBadge primitive (styling-overhaul-5.2)', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_renders_label_per_status', () => {
    const labels: Record<Status, string> = {
      planned: 'Planned',
      'in-progress': 'In Progress',
      complete: 'Complete',
      unknown: 'Unknown',
    };
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      expect(el.textContent).toContain(labels[status]);
      unmount();
    }
  });

  it('unit_planned_applies_bone_surface', () => {
    const { container } = render(<StatusBadge status="planned" />);
    const el = rootFor(container, 'planned');
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
    expect(el.className).toMatch(/text-\(--color-muted\)/);
    expect(el.className).toMatch(/border-\(--edge-color-subtle\)/);
  });

  it('unit_in_progress_applies_parchment_surface', () => {
    const { container } = render(<StatusBadge status="in-progress" />);
    const el = rootFor(container, 'in-progress');
    expect(el.className).toMatch(/bg-\(--color-parchment\)/);
    expect(el.className).toMatch(/text-\(--color-ink\)/);
    expect(el.className).toMatch(/border-\(--edge-color\)/);
  });

  it('unit_complete_applies_verdigris_pair', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    expect(el.className).toMatch(/bg-\(--color-marble\)/);
    expect(el.className).toMatch(/text-\(--color-verdigris\)/);
    expect(el.className).toMatch(/border-\(--color-verdigris\)/);
  });

  it('unit_unknown_applies_bone_italic', () => {
    const { container } = render(<StatusBadge status="unknown" />);
    const el = rootFor(container, 'unknown');
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
    expect(el.className).toMatch(/text-\(--color-muted\)/);
    expect(el.className).toMatch(/border-\(--edge-color-subtle\)/);
    expect(el.className).toMatch(/\bitalic\b/);
  });

  it('unit_only_unknown_has_italic', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      const hasItalic = /\bitalic\b/.test(el.className);
      if (status === 'unknown') {
        expect(hasItalic, `${status} should have italic`).toBe(true);
      } else {
        expect(hasItalic, `${status} should NOT have italic`).toBe(false);
      }
      unmount();
    }
  });

  it('unit_complete_renders_checkmark_glyph', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    const glyph = el.querySelector('[aria-hidden="true"]');
    expect(glyph).not.toBeNull();
    expect(glyph?.textContent).toBe('✓');
    expect(glyph?.getAttribute('class') ?? '').toMatch(/text-\(--color-verdigris\)/);
  });

  it('unit_non_complete_omits_checkmark_glyph', () => {
    for (const status of STATUSES.filter(s => s !== 'complete')) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      const glyph = el.querySelector('[aria-hidden="true"]');
      expect(glyph, `${status} should not render ✓`).toBeNull();
      unmount();
    }
  });

  it('unit_all_variants_use_label_utility', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      expect(el.className, `${status} missing .label`).toMatch(/\blabel\b/);
      unmount();
    }
  });

  it('unit_all_variants_use_border_class', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      expect(el.className, `${status} missing 1px border`).toMatch(/\bborder\b/);
      unmount();
    }
  });

  it('unit_no_rounded_class_anywhere', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      expect(el.className, `${status} has rounded — brand discipline violation`).not.toMatch(/\brounded(-[a-z0-9]+)?\b/);
      unmount();
    }
  });

  it('unit_inline_flex_layout', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    expect(el.className).toMatch(/\binline-flex\b/);
    expect(el.className).toMatch(/items-center/);
  });

  it('unit_uses_space_tokens_for_gap_padding', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    expect(el.className).toMatch(/gap-\(--space-1\)/);
    expect(el.className).toMatch(/px-\(--space-2\)/);
    expect(el.className).toMatch(/py-px/);
  });

  it('unit_preserves_data_testid_per_status', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = container.querySelector(`[data-testid="status-badge-${status}"]`);
      expect(el, `data-testid for ${status} missing — would break JobCard/JobsRollupTable`).not.toBeNull();
      unmount();
    }
  });

  it('unit_className_passthrough', () => {
    const { container } = render(<StatusBadge status="planned" className="custom-extra my-2" />);
    const el = rootFor(container, 'planned');
    expect(el.className).toContain('custom-extra');
    expect(el.className).toContain('my-2');
    // Variant classes still present (not overwritten)
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
  });

  it('unit_className_default_empty_string', () => {
    const { container } = render(<StatusBadge status="planned" />);
    const el = rootFor(container, 'planned');
    expect(el.className).not.toContain('undefined');
  });

  it('unit_status_prop_type_uses_jobRollupEntry_status', () => {
    // Compile-time check via satisfies: if StatusBadgeProps['status'] drifts
    // from JobRollupEntry['status'], this assignment will fail tsc and at
    // runtime we still verify the 4 values are accepted.
    const supported: Array<JobRollupEntry['status']> = ['planned', 'in-progress', 'complete', 'unknown'];
    for (const s of supported) {
      const { unmount } = render(<StatusBadge status={s} />);
      unmount();
    }
    expect(supported).toHaveLength(4);
  });

  it('unit_variant_label_record_complete', () => {
    // Source-level: variantLabel record has all 4 keys.
    const labelBlock = STATUS_BADGE_SRC.match(/variantLabel[^=]*=\s*\{([\s\S]*?)\};/);
    expect(labelBlock, 'variantLabel record not found in StatusBadge source').not.toBeNull();
    const body = labelBlock?.[1] ?? '';
    const expectedKeyTokens: Record<Status, string> = {
      planned: 'planned:',
      'in-progress': "'in-progress':",
      complete: 'complete:',
      unknown: 'unknown:',
    };
    for (const status of STATUSES) {
      expect(body, `variantLabel missing key for ${status}`).toContain(expectedKeyTokens[status]);
    }
  });

  it('unit_variant_class_record_complete', () => {
    const classBlock = STATUS_BADGE_SRC.match(/variantClass[^=]*=\s*\{([\s\S]*?)\};/);
    expect(classBlock, 'variantClass record not found in StatusBadge source').not.toBeNull();
    const body = classBlock?.[1] ?? '';
    const expectedKeyTokens: Record<Status, string> = {
      planned: 'planned:',
      'in-progress': "'in-progress':",
      complete: 'complete:',
      unknown: 'unknown:',
    };
    for (const status of STATUSES) {
      expect(body, `variantClass missing key for ${status}`).toContain(expectedKeyTokens[status]);
    }
  });

  it('unit_status_word_appears_in_aria_label', () => {
    const expectations: Array<[Status, string]> = [
      ['planned', 'Status: Planned'],
      ['in-progress', 'Status: In Progress'],
      ['complete', 'Status: Complete'],
      ['unknown', 'Status: Unknown'],
    ];
    for (const [status, expected] of expectations) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      expect(el.getAttribute('aria-label')).toBe(expected);
      unmount();
    }
  });

  it('unit_unknown_label_replaces_no_data', () => {
    const { container: u } = render(<StatusBadge status="unknown" />);
    const unknownEl = rootFor(u, 'unknown');
    expect(unknownEl.textContent).toContain('Unknown');
    expect(unknownEl.textContent, 'pre-5.2 label leaked through').not.toContain('No data');

    const { container: ip } = render(<StatusBadge status="in-progress" />);
    const ipEl = rootFor(ip, 'in-progress');
    expect(ipEl.textContent).toContain('In Progress');
    // Lowercase 'p' from pre-5.2 label 'In progress' is no longer the rendered string.
    expect(ipEl.textContent, "pre-5.2 lowercase 'In progress' leaked through").not.toMatch(/\bIn progress\b/);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_barrel_re_exports_status_badge', () => {
    expect(buildLogBarrel).toHaveProperty('StatusBadge');
    expect(buildLogBarrel.StatusBadge).toBe(StatusBadge);
  });

  it('integration_jobcard_consumer_still_finds_badge', () => {
    const rollup = makeRollup({ status: 'in-progress' });
    const { container } = render(<JobCard rollup={rollup} excerpt="Excerpt." />);
    expect(container.querySelector('[data-testid="status-badge-in-progress"]')).not.toBeNull();
  });

  it('integration_jobs_rollup_consumer_renders_two_badges', () => {
    const rows: JobRollupEntry[] = [
      makeRollup({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRollup({ slug: 'b', title: 'B', status: 'complete', percentComplete: 100, completedFeatures: 5 }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    expect(container.querySelector('[data-testid="status-badge-in-progress"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="status-badge-complete"]')).not.toBeNull();
  });

  it('integration_no_use_client_directive', () => {
    // First non-empty line should NOT be 'use client' — presentational RSC
    const firstNonEmpty = STATUS_BADGE_SRC.split('\n').find(l => l.trim().length > 0) ?? '';
    expect(firstNonEmpty).not.toMatch(/['"]use client['"]/);
    // And no 'use client' anywhere
    expect(STATUS_BADGE_SRC).not.toMatch(/^\s*['"]use client['"]/m);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_root_has_status_aria_label', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      const label = el.getAttribute('aria-label');
      expect(label, `${status} missing aria-label`).not.toBeNull();
      expect(label).toMatch(/^Status: /);
      unmount();
    }
  });

  it('a11y_complete_checkmark_aria_hidden', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    const glyph = el.querySelector('[aria-hidden="true"]');
    expect(glyph).not.toBeNull();
    // aria-label should NOT contain "check mark" or any glyph description
    const ariaLabel = el.getAttribute('aria-label') ?? '';
    expect(ariaLabel.toLowerCase()).not.toContain('check');
    expect(ariaLabel.toLowerCase()).not.toContain('✓');
  });

  it('a11y_label_text_visible_for_sighted_users', () => {
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      // Visible text content present (non-empty after stripping the optional ✓ glyph)
      const textOnly = (el.textContent ?? '').replace('✓', '').trim();
      expect(textOnly.length, `${status} has no visible label text`).toBeGreaterThan(0);
      unmount();
    }
  });

  it('a11y_label_utility_provides_contrast_register', () => {
    // Every variant pair is documented in globals.css — the .label utility
    // and all 4 surface tokens must resolve. Source-grep, not jsdom.
    expect(STATUS_BADGE_SRC).toMatch(/bg-\(--color-bone\)/);
    expect(STATUS_BADGE_SRC).toMatch(/bg-\(--color-parchment\)/);
    expect(STATUS_BADGE_SRC).toMatch(/bg-\(--color-marble\)/);
    expect(STATUS_BADGE_SRC).toMatch(/text-\(--color-muted\)/);
    expect(STATUS_BADGE_SRC).toMatch(/text-\(--color-ink\)/);
    expect(STATUS_BADGE_SRC).toMatch(/text-\(--color-verdigris\)/);
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_brand_token_only_no_palette_names', () => {
    const forbidden = [
      /\bbg-red-\d/,
      /\bbg-amber-\d/,
      /\bbg-green-\d/,
      /\bbg-yellow-\d/,
      /\bbg-blue-\d/,
      /\bbg-gray-\d/,
      /\bbg-mist\b/,
      /\bbg-accent\b/,
      /\bbg-signal\b/,
      /\btext-foreground\b/,
      /\btext-parchment\b/,
    ];
    for (const pat of forbidden) {
      expect(STATUS_BADGE_SRC, `forbidden placeholder palette match: ${pat}`).not.toMatch(pat);
    }
  });

  it('infra_no_box_shadow', () => {
    expect(STATUS_BADGE_SRC).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner|none)\b/);
    expect(STATUS_BADGE_SRC).not.toMatch(/\bdrop-shadow\b/);
    expect(STATUS_BADGE_SRC).not.toMatch(/\bbox-shadow\b/);
  });

  it('infra_no_rounded_class', () => {
    expect(STATUS_BADGE_SRC).not.toMatch(/\brounded(-[a-z0-9]+)?\b/);
  });

  it('infra_no_gradient', () => {
    expect(STATUS_BADGE_SRC).not.toMatch(/\bbg-gradient-/);
    expect(STATUS_BADGE_SRC).not.toMatch(/\bfrom-(\w)/);
    expect(STATUS_BADGE_SRC).not.toMatch(/\bvia-(\w)/);
    expect(STATUS_BADGE_SRC).not.toMatch(/\bto-(\w)/);
  });

  it('infra_forbidden_pattern_sentinel_clean', () => {
    // The cross-cutting forbidden-pattern sentinel scans src/ excluding
    // SKIP_PATHS. Verify StatusBadge.tsx is NOT in SKIP_PATHS (it should be
    // brand-clean post-5.2 and not need an exemption).
    const sentinelSrc = readSource('src/__tests__/brand/forbidden-patterns.test.ts');
    // [^=]* (not [^[]*) — the type annotation `: string[]` contains a `[`
    // which would short-circuit `[^[]*` and prevent the match.
    const skipBlock = sentinelSrc.match(/SKIP_PATHS[^=]*=\s*\[([\s\S]*?)\];/);
    expect(skipBlock, 'SKIP_PATHS not found in sentinel').not.toBeNull();
    const body = skipBlock?.[1] ?? '';
    expect(body, 'StatusBadge.tsx should not need SKIP_PATHS exemption').not.toContain('StatusBadge.tsx');
  });

  it('infra_barrel_re_exports_remaining_components', () => {
    expect(buildLogBarrel).toHaveProperty('StatusBadge');
    expect(buildLogBarrel).toHaveProperty('JobCard');
    expect(buildLogBarrel).toHaveProperty('PhaseNav');
    expect(buildLogBarrel).toHaveProperty('MarkdownDocument');
    expect(buildLogBarrel).toHaveProperty('JobsRollupTable');
  });

  it('infra_tokens_resolve_in_globals_css', () => {
    const tokens = [
      '--color-bone',
      '--color-muted',
      '--color-parchment',
      '--color-ink',
      '--color-marble',
      '--color-verdigris',
      '--edge-color:',
      '--edge-color-subtle',
      '--space-1',
      '--space-2',
    ];
    for (const t of tokens) {
      expect(GLOBALS_CSS, `token ${t} not declared in globals.css`).toContain(t);
    }
    // .label utility declaration present
    expect(GLOBALS_CSS).toMatch(/\.label\s*\{/);
  });

  // ─── Edge cases ────────────────────────────────────────────────────────

  it('edge_each_of_four_statuses_renders_without_throw', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      expect(rootFor(container, status)).not.toBeNull();
      unmount();
    }
    expect(errSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it('edge_undefined_className_renders_no_undefined_in_class', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    expect(el.className).not.toContain('undefined');
  });

  it('edge_empty_string_className', () => {
    const { container } = render(<StatusBadge status="planned" className="" />);
    const el = rootFor(container, 'planned');
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
    expect(el.className).not.toContain('  '); // no double-space artifacts
  });

  it('edge_long_className_passthrough', () => {
    const extra = 'mx-2 my-1 inline-block whitespace-nowrap';
    const { container } = render(<StatusBadge status="complete" className={extra} />);
    const el = rootFor(container, 'complete');
    for (const cls of extra.split(' ')) {
      expect(el.className, `class ${cls} dropped`).toContain(cls);
    }
    expect(el.className).toMatch(/bg-\(--color-marble\)/);
  });

  it('edge_complete_checkmark_uses_unicode_codepoint', () => {
    const { container } = render(<StatusBadge status="complete" />);
    const el = rootFor(container, 'complete');
    const glyph = el.querySelector('[aria-hidden="true"]');
    expect(glyph?.textContent).toBe('✓');
  });

  it('edge_all_four_aria_labels_distinct', () => {
    const labels = new Set<string>();
    for (const status of STATUSES) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      labels.add(el.getAttribute('aria-label') ?? '');
      unmount();
    }
    expect(labels.size).toBe(4);
  });

  // ─── Error recovery ────────────────────────────────────────────────────

  it('err_render_idempotent_no_console_warnings', () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    for (const status of STATUSES) {
      const { unmount } = render(<StatusBadge status={status} />);
      unmount();
    }
    expect(errSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // ─── Data integrity ────────────────────────────────────────────────────

  it('data_verdigris_only_on_complete', () => {
    // Source-level: only variantClass[complete] should reference verdigris.
    const classBlock = STATUS_BADGE_SRC.match(/variantClass[^=]*=\s*\{([\s\S]*?)\};/);
    expect(classBlock, 'variantClass record not found').not.toBeNull();
    const body = classBlock?.[1] ?? '';
    // Naive split by line breaks to per-status row inspection.
    // Each row contains the status key and its class string literal.
    const rows = body.split(/\n/).filter(l => l.includes(':'));
    let foundVerdigris = 0;
    let foundOnComplete = false;
    for (const row of rows) {
      if (row.includes('--color-verdigris')) {
        foundVerdigris++;
        if (/\bcomplete\b/.test(row)) foundOnComplete = true;
      }
    }
    expect(foundVerdigris, 'verdigris must appear on exactly one row').toBe(1);
    expect(foundOnComplete, 'verdigris row must be the complete row').toBe(true);
  });

  it('data_token_pairing_invariant_per_variant', () => {
    // Per-variant: each surface pair (bg + text) is brand-correct.
    const pairings: Array<[Status, RegExp, RegExp]> = [
      ['planned', /bg-\(--color-bone\)/, /text-\(--color-muted\)/],
      ['in-progress', /bg-\(--color-parchment\)/, /text-\(--color-ink\)/],
      ['complete', /bg-\(--color-marble\)/, /text-\(--color-verdigris\)/],
      ['unknown', /bg-\(--color-bone\)/, /text-\(--color-muted\)/],
    ];
    for (const [status, bg, text] of pairings) {
      const { container, unmount } = render(<StatusBadge status={status} />);
      const el = rootFor(container, status);
      expect(el.className, `${status} bg pairing`).toMatch(bg);
      expect(el.className, `${status} text pairing`).toMatch(text);
      unmount();
    }
  });

  it('data_label_set_matches_status_union', () => {
    // Source-level: variantLabel keys form a closed set equal to the union.
    const labelBlock = STATUS_BADGE_SRC.match(/variantLabel[^=]*=\s*\{([\s\S]*?)\};/);
    expect(labelBlock, 'variantLabel record not found').not.toBeNull();
    const body = labelBlock?.[1] ?? '';
    const keys: string[] = [];
    for (const m of body.matchAll(/^\s*['"]?([a-z-]+)['"]?\s*:/gm)) {
      keys.push(m[1]);
    }
    const sortedKeys = [...keys].sort();
    expect(sortedKeys).toEqual(['complete', 'in-progress', 'planned', 'unknown']);
  });
});
