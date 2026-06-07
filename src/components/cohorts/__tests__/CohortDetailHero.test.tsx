import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CohortDetailHero } from '../CohortDetailHero';
import {
  COHORT_STATUSES,
  COHORT_STATUS_LABELS,
  COHORT_STATUS_DESCRIPTIONS,
  type Cohort,
} from '@/content/schemas';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const HERO_SOURCE = 'src/components/cohorts/CohortDetailHero.tsx';
const COHORT_DETAIL_PAGE = 'src/app/cohorts/[slug]/page.tsx';
const GLOBALS_CSS = readSource('src/app/globals.css');

function mockCohort(overrides: Partial<Cohort> = {}): Cohort {
  return {
    id: 'cohort-1',
    slug: 'q2-2026-ai-delivery',
    title: 'Q2 2026 — AI Delivery Workflow',
    series: 'AI Delivery',
    tagline: 'Ship faster. Stay sane. Cohort-based.',
    summary: 'A six-week intensive for solo consultants.',
    status: 'open',
    pillar: 'delivery',
    startDate: '2026-04-13',
    endDate: '2026-05-25',
    durationWeeks: 6,
    capacity: 24,
    priceCents: 199900,
    currency: 'USD',
    stripePriceId: 'price_test_abc',
    commitmentHoursPerWeek: 6,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-01-01',
    ...overrides,
  };
}

describe('CohortDetailHero', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_hero_wraps_in_marble', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    // Marble's bg-(--color-marble) class appears on its root
    const marbleEl = container.querySelector('[class*="bg-(--color-marble)"]');
    expect(marbleEl, 'expected an element with bg-(--color-marble) class').not.toBeNull();
  });

  it('unit_hero_uses_section_rhythm_lg', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    // Section rhythm='lg' → py-(--section-y-lg)
    const sectionEl = container.querySelector('[class*="py-(--section-y-lg)"]');
    expect(sectionEl, 'expected an element with py-(--section-y-lg) class').not.toBeNull();
  });

  it('unit_hero_container_width_prose', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    // Container width='prose' → max-w-prose
    const containerEl = container.querySelector('[class*="max-w-prose"]');
    expect(containerEl, 'expected an element with max-w-prose class').not.toBeNull();
  });

  it('unit_hero_headline_uses_display1', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].className).toMatch(/\bdisplay-1\b/);
  });

  it('unit_hero_headline_contains_dropaccent_arrow_large', () => {
    const cohort = mockCohort({ title: 'My Title' });
    const { container } = render(<CohortDetailHero cohort={cohort} />);
    const h1 = container.querySelector('h1') as HTMLElement;
    expect(h1).not.toBeNull();
    const accentSpan = h1.querySelector('span[aria-hidden="true"]') as HTMLElement | null;
    expect(accentSpan).not.toBeNull();
    expect(accentSpan!.textContent).toBe('→');
    // size='large' → text-[1.8em]
    expect(accentSpan!.className).toMatch(/\btext-\[1\.8em\]/);
    expect(accentSpan!.className).toMatch(/text-\(--color-oxblood\)/);
  });

  it('unit_hero_series_label_renders', () => {
    const cohort = mockCohort({ series: 'My Series' });
    const { container } = render(<CohortDetailHero cohort={cohort} />);
    const labelSpan = container.querySelector('span.label');
    expect(labelSpan).not.toBeNull();
    expect(labelSpan!.textContent).toBe('My Series');
  });

  it('unit_hero_tagline_uses_body1', () => {
    const cohort = mockCohort({ tagline: 'Tagline text.' });
    const { container } = render(<CohortDetailHero cohort={cohort} />);
    // Find the body-1 paragraph
    const p = container.querySelector('p.body-1');
    expect(p).not.toBeNull();
    expect(p!.className).toMatch(/text-\(--color-muted\)/);
    expect(p!.textContent).toBe('Tagline text.');
  });

  it('unit_hero_status_description_renders_below_tagline', () => {
    const cohort = mockCohort({ status: 'open' });
    const { container } = render(<CohortDetailHero cohort={cohort} />);
    // body-3 muted paragraph carries the status description
    const descParagraphs = Array.from(container.querySelectorAll('p.body-3'));
    const descP = descParagraphs.find(
      (p) => p.textContent === COHORT_STATUS_DESCRIPTIONS.open
    );
    expect(descP, 'expected a p.body-3 with COHORT_STATUS_DESCRIPTIONS[status]').toBeDefined();
    expect(descP!.className).toMatch(/text-\(--color-muted\)/);
  });

  it('unit_hero_stat_row_has_top_border_and_mono_spans', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    // Find any element with border-t border-(--edge-color) — the stat row
    const statRow = container.querySelector(
      '[class*="border-t"][class*="border-(--edge-color)"]'
    );
    expect(statRow, 'expected stat row with border-t + border-(--edge-color)').not.toBeNull();
    const monoSpans = statRow!.querySelectorAll('span.mono');
    expect(monoSpans.length).toBeGreaterThanOrEqual(2);
  });

  it('unit_hero_stat_row_contains_status_badge', () => {
    const cohort = mockCohort({ status: 'open' });
    const { container } = render(<CohortDetailHero cohort={cohort} />);
    const badge = container.querySelector(
      'span[aria-label^="Cohort status:"]'
    ) as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe(COHORT_STATUS_LABELS.open);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_hero_consumes_status_badge_for_each_status', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(
        <CohortDetailHero cohort={mockCohort({ status })} />
      );
      const badge = container.querySelector(
        'span[aria-label^="Cohort status:"]'
      ) as HTMLElement | null;
      expect(badge, `status ${status} did not render badge`).not.toBeNull();
      expect(badge!.getAttribute('aria-label')).toBe(
        `Cohort status: ${COHORT_STATUS_LABELS[status]}`
      );
      unmount();
    }
  });

  it('integration_detail_page_still_imports_hero', () => {
    const page = readSource(COHORT_DETAIL_PAGE);
    expect(page).toMatch(/from\s+['"]@\/components\/cohorts\/CohortDetailHero['"]/);
    expect(page).toMatch(/<CohortDetailHero\b/);
  });

  // ─── Security ──────────────────────────────────────────────────────────

  it('sec_tampering_hero_text_content_escapes_html', () => {
    const malicious = '<script>alert(1)</script>';
    const { container } = render(
      <CohortDetailHero cohort={mockCohort({ title: malicious, tagline: malicious })} />
    );
    const h1 = container.querySelector('h1') as HTMLElement;
    expect(h1.textContent).toContain('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_hero_headline_is_h1', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    const h1s = container.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
  });

  it('a11y_hero_dropaccent_arrow_is_aria_hidden', () => {
    const { container } = render(<CohortDetailHero cohort={mockCohort()} />);
    const h1 = container.querySelector('h1') as HTMLElement;
    const accentSpan = h1.querySelector('span[aria-hidden="true"]');
    expect(accentSpan).not.toBeNull();
    expect(accentSpan!.getAttribute('aria-hidden')).toBe('true');
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_hero_no_use_client_directive', () => {
    const src = readSource(HERO_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_hero_no_forbidden_shadow', () => {
    const src = readSource(HERO_SOURCE);
    const FORBIDDEN = /\b(?:shadow-md|shadow-lg|shadow-xl|shadow-2xl|drop-shadow|box-shadow)\b/;
    expect(src).not.toMatch(FORBIDDEN);
  });

  it('infra_hero_no_rounded_corners', () => {
    const src = readSource(HERO_SOURCE);
    expect(src).not.toMatch(/\brounded(?:-\w+)?\b/);
  });

  it('infra_hero_no_palette_aliases', () => {
    const src = readSource(HERO_SOURCE);
    expect(src).not.toMatch(/\btext-muted\b/);
    expect(src).not.toMatch(/\btext-foreground\b/);
    expect(src).not.toMatch(/\bborder-mist\b/);
    expect(src).not.toMatch(/\bbg-mist\b/);
  });

  it('infra_hero_tailwind4_paren_syntax', () => {
    const src = readSource(HERO_SOURCE);
    expect(src).toMatch(/text-\(--color-[a-z-]+\)|--space-/);
    expect(src).not.toMatch(/bg-\[--/);
    expect(src).not.toMatch(/text-\[color:/);
  });

  it('infra_hero_tokens_resolve_in_globals_css', () => {
    const src = readSource(HERO_SOURCE);
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

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_very_long_title_hero', () => {
    const long = 'A'.repeat(500);
    const { container } = render(<CohortDetailHero cohort={mockCohort({ title: long })} />);
    const h1 = container.querySelector('h1') as HTMLElement;
    expect(h1.className).toMatch(/\bdisplay-1\b/);
    expect(h1.textContent!.length).toBeGreaterThanOrEqual(500);
    // DropAccent still emitted
    const accentSpan = h1.querySelector('span[aria-hidden="true"]') as HTMLElement | null;
    expect(accentSpan).not.toBeNull();
    expect(accentSpan!.textContent).toBe('→');
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_globals_check_hero', () => {
    const src = readSource(HERO_SOURCE);
    const tokens = new Set<string>();
    for (const m of src.matchAll(/--(?:color|edge-color|space|pair|section)[a-z0-9-]*/g)) {
      tokens.add(m[0]);
    }
    for (const token of tokens) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `hero uses token ${token} which is missing from globals.css`).toMatch(declRegex);
    }
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_consistency_props_interface_preserved_hero', () => {
    const src = readSource(HERO_SOURCE);
    expect(src).toMatch(/interface\s+CohortDetailHeroProps\b/);
    expect(src).toMatch(/CohortDetailHeroProps\s*\{[\s\S]{0,200}cohort:\s*Cohort/);
  });

  it('data_consistency_status_descriptions_imported_not_hardcoded', () => {
    const src = readSource(HERO_SOURCE);
    expect(src).toMatch(/COHORT_STATUS_DESCRIPTIONS/);
    // Don't accept hardcoded copies of any description
    expect(src).not.toMatch(/Applications open soon\./);
    expect(src).not.toMatch(/Applications open now\./);
    expect(src).not.toMatch(/This cohort is full\./);
    expect(src).not.toMatch(/This cohort has shipped\./);
  });
});
