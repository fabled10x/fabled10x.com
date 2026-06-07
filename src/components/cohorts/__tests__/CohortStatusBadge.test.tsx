import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CohortStatusBadge } from '../CohortStatusBadge';
import {
  COHORT_STATUSES,
  COHORT_STATUS_LABELS,
  type CohortStatus,
} from '@/content/schemas';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const BADGE_SOURCE = 'src/components/cohorts/CohortStatusBadge.tsx';
const GLOBALS_CSS = readSource('src/app/globals.css');

function findBadge(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  expect(el!.tagName).toBe('SPAN');
  return el!;
}

describe('CohortStatusBadge', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_badge_renders_span_root', () => {
    const { container } = render(<CohortStatusBadge status="open" />);
    const el = findBadge(container);
    expect(el.tagName).toBe('SPAN');
  });

  it('unit_badge_announced_class_brand_tokens', () => {
    const { container } = render(<CohortStatusBadge status="announced" />);
    const el = findBadge(container);
    expect(el.className).toMatch(/bg-\(--color-parchment\)/);
    expect(el.className).toMatch(/text-\(--color-ink\)/);
    expect(el.className).toMatch(/border-\(--edge-color\)(?!-subtle)/);
  });

  it('unit_badge_open_class_verdigris', () => {
    const { container } = render(<CohortStatusBadge status="open" />);
    const el = findBadge(container);
    expect(el.className).toMatch(/bg-\(--color-marble\)/);
    expect(el.className).toMatch(/text-\(--color-verdigris\)/);
    expect(el.className).toMatch(/border-\(--color-verdigris\)/);
  });

  it('unit_badge_closed_class_muted', () => {
    const { container } = render(<CohortStatusBadge status="closed" />);
    const el = findBadge(container);
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
    expect(el.className).toMatch(/text-\(--color-muted\)/);
    expect(el.className).toMatch(/border-\(--edge-color-subtle\)/);
  });

  it('unit_badge_enrolled_class_parchment', () => {
    const { container } = render(<CohortStatusBadge status="enrolled" />);
    const el = findBadge(container);
    expect(el.className).toMatch(/bg-\(--color-parchment\)/);
    expect(el.className).toMatch(/text-\(--color-ink\)/);
    expect(el.className).toMatch(/border-\(--edge-color\)(?!-subtle)/);
  });

  it('unit_badge_shipped_class_italic', () => {
    const { container } = render(<CohortStatusBadge status="shipped" />);
    const el = findBadge(container);
    expect(el.className).toMatch(/bg-\(--color-bone\)/);
    expect(el.className).toMatch(/text-\(--color-muted\)/);
    expect(el.className).toMatch(/border-\(--edge-color-subtle\)/);
    expect(el.className).toMatch(/\bitalic\b/);
  });

  it('unit_badge_label_text_matches_constant', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el.textContent).toBe(COHORT_STATUS_LABELS[status]);
      unmount();
    }
  });

  it('unit_badge_base_classes_present', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el.className).toMatch(/\binline-flex\b/);
      expect(el.className).toMatch(/\bitems-center\b/);
      expect(el.className).toMatch(/gap-\(--space-1\)/);
      expect(el.className).toMatch(/\blabel\b/);
      expect(el.className).toMatch(/\bborder\b/);
      expect(el.className).toMatch(/px-\(--space-2\)/);
      expect(el.className).toMatch(/py-px/);
      unmount();
    }
  });

  it('unit_badge_no_rounded_full', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el.className).not.toMatch(/\brounded(?:-\w+)?\b/);
      unmount();
    }
  });

  it('unit_badge_no_ring_utility', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el.className).not.toMatch(/\bring-\d/);
      expect(el.className).not.toMatch(/\bring-inset\b/);
      unmount();
    }
  });

  it('unit_badge_aria_label_format', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el.getAttribute('aria-label')).toBe(
        `Cohort status: ${COHORT_STATUS_LABELS[status]}`
      );
      unmount();
    }
  });

  it('unit_badge_uses_label_utility', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el.className).toMatch(/\blabel\b/);
      unmount();
    }
  });

  // ─── Security ──────────────────────────────────────────────────────────

  it('sec_info_disclosure_no_dangerously_set_inner_html', () => {
    const src = readSource(BADGE_SOURCE);
    expect(src).not.toMatch(/dangerouslySetInnerHTML/);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_badge_aria_label_announces_status', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      const ariaLabel = el.getAttribute('aria-label');
      expect(ariaLabel).not.toBeNull();
      expect(ariaLabel).toContain('Cohort status');
      expect(ariaLabel).toContain(COHORT_STATUS_LABELS[status]);
      unmount();
    }
  });

  it('a11y_badge_visible_text_matches_aria_label', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      const ariaLabel = el.getAttribute('aria-label') ?? '';
      const visibleText = el.textContent ?? '';
      // WCAG 2.5.3: visible text must appear within accessible name
      expect(ariaLabel.toLowerCase()).toContain(visibleText.toLowerCase());
      unmount();
    }
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_badge_no_use_client_directive', () => {
    const src = readSource(BADGE_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_badge_no_forbidden_shadow', () => {
    const src = readSource(BADGE_SOURCE);
    const FORBIDDEN = /\b(?:shadow-md|shadow-lg|shadow-xl|shadow-2xl|drop-shadow|box-shadow)\b/;
    expect(src).not.toMatch(FORBIDDEN);
  });

  it('infra_badge_no_rounded_corners', () => {
    const src = readSource(BADGE_SOURCE);
    expect(src).not.toMatch(/\brounded(?:-\w+)?\b/);
  });

  it('infra_badge_no_palette_aliases', () => {
    const src = readSource(BADGE_SOURCE);
    // Placeholder palette aliases used pre-reskin
    expect(src).not.toMatch(/\bbg-signal\b/);
    expect(src).not.toMatch(/\bbg-accent\b/);
    expect(src).not.toMatch(/\bbg-muted\b/);
    expect(src).not.toMatch(/\bbg-steel\b/);
    // Pre-reskin used bg-ink/5 (opacity slash). Allow nothing of that family.
    expect(src).not.toMatch(/\bbg-ink\/?\d/);
    expect(src).not.toMatch(/\btext-signal\b/);
    expect(src).not.toMatch(/\btext-accent\b/);
    expect(src).not.toMatch(/\btext-steel\b/);
  });

  it('infra_badge_tailwind4_paren_syntax', () => {
    const src = readSource(BADGE_SOURCE);
    expect(src).toMatch(/bg-\(--color-[a-z-]+\)/);
    expect(src).toMatch(/text-\(--color-[a-z-]+\)/);
    expect(src).not.toMatch(/bg-\[--/);
    expect(src).not.toMatch(/text-\[color:/);
  });

  it('infra_badge_tokens_resolve_in_globals_css', () => {
    const src = readSource(BADGE_SOURCE);
    const tokens = new Set<string>();
    for (const m of src.matchAll(/--(?:color|edge-color|space|pair|section)[a-z0-9-]*/g)) {
      tokens.add(m[0]);
    }
    expect(tokens.size).toBeGreaterThan(0);
    for (const token of tokens) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing declaration for ${token}`).toMatch(declRegex);
    }
  });

  it('infra_forbidden_pattern_sentinel_green', () => {
    // The cross-cutting sentinel must continue scanning the three component
    // source files post-reskin — they MUST NOT be added to SKIP_PATHS.
    // (The .test.tsx files ARE allow-listed because they intentionally embed
    // FORBIDDEN regex literals as source-grep inputs — same precedent as
    // EditorialCard.test.tsx / Button.test.tsx.)
    const sentinel = readSource('src/__tests__/brand/forbidden-patterns.test.ts');
    expect(sentinel).not.toMatch(/cohorts\/CohortStatusBadge\.tsx['"`]/);
    expect(sentinel).not.toMatch(/cohorts\/CohortCard\.tsx['"`]/);
    expect(sentinel).not.toMatch(/cohorts\/CohortDetailHero\.tsx['"`]/);
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_state_all_5_status_values_render', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortStatusBadge status={status} />);
      const el = findBadge(container);
      expect(el).not.toBeNull();
      expect(el.className.length).toBeGreaterThan(0);
      unmount();
    }
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_globals_check_badge', () => {
    const REQUIRED_TOKENS = [
      '--color-marble',
      '--color-parchment',
      '--color-bone',
      '--color-ink',
      '--color-verdigris',
      '--color-muted',
      '--edge-color',
      '--edge-color-subtle',
      '--space-1',
      '--space-2',
    ];
    for (const token of REQUIRED_TOKENS) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing token ${token}`).toMatch(declRegex);
    }
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_serialization_badge_className_construction_deterministic', () => {
    const renders = [
      render(<CohortStatusBadge status="open" />),
      render(<CohortStatusBadge status="open" />),
      render(<CohortStatusBadge status="open" />),
      render(<CohortStatusBadge status="open" />),
      render(<CohortStatusBadge status="open" />),
    ];
    const classNames = renders.map((r) => findBadge(r.container).className);
    expect(new Set(classNames).size).toBe(1);
    renders.forEach((r) => r.unmount());
  });

  it('data_consistency_props_interface_preserved_badge', () => {
    const src = readSource(BADGE_SOURCE);
    expect(src).toMatch(/interface\s+CohortStatusBadgeProps\b/);
    expect(src).toMatch(/CohortStatusBadgeProps\s*\{[\s\S]{0,200}status:\s*CohortStatus/);
  });

  it('data_verdigris_only_on_open', () => {
    const src = readSource(BADGE_SOURCE);
    const verdigrisHits = src.match(/--color-verdigris/g) ?? [];
    // Exactly TWO references on the 'open' row: text + border
    expect(verdigrisHits.length).toBe(2);
    // And the 'open' row must reference verdigris twice
    const openRow = src.match(/open:\s*['"`][^'"`]*['"`]/);
    expect(openRow).not.toBeNull();
    expect(openRow![0]).toContain('text-(--color-verdigris)');
    expect(openRow![0]).toContain('border-(--color-verdigris)');
    // No OTHER variant row may contain Verdigris
    const otherRows = src.match(/(?:announced|closed|enrolled|shipped):\s*['"`][^'"`]*['"`]/g) ?? [];
    for (const row of otherRows) {
      expect(row).not.toContain('verdigris');
    }
  });

  it('data_consistency_status_labels_imported_not_hardcoded', () => {
    const src = readSource(BADGE_SOURCE);
    // Must import + use the canonical label map
    expect(src).toMatch(/COHORT_STATUS_LABELS/);
    // Inline string literals matching label values are forbidden
    expect(src).not.toMatch(/['"`]Announced['"`]/);
    expect(src).not.toMatch(/['"`]Applications open['"`]/);
    expect(src).not.toMatch(/['"`]Applications closed['"`]/);
    expect(src).not.toMatch(/['"`]Cohort full['"`]/);
    expect(src).not.toMatch(/['"`]Shipped['"`]/);
  });
});

// Type-only re-export to keep CohortStatus referenced (used by callers in tests below)
export type _Status = CohortStatus;
