import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { CohortCard } from '../CohortCard';
import {
  COHORT_STATUSES,
  COHORT_STATUS_LABELS,
  type Cohort,
} from '@/content/schemas';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const CARD_SOURCE = 'src/components/cohorts/CohortCard.tsx';
const COHORTS_INDEX_PAGE = 'src/app/cohorts/page.tsx';
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

describe('CohortCard', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_card_consumes_editorial_card', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    // Wrapped in <a> (EditorialCard's href-mode)
    const anchor = container.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    // article inside the link
    const article = anchor!.querySelector('article');
    expect(article).not.toBeNull();
    expect(article!.className).toMatch(/bg-\(--color-marble\)/);
    expect(article!.className).toMatch(/border-\(--color-ink\)/);
  });

  it('unit_card_tag_is_cohort_series', () => {
    const cohort = mockCohort({ series: 'Test Series' });
    const { container } = render(<CohortCard cohort={cohort} />);
    const tag = container.querySelector('span.label');
    expect(tag).not.toBeNull();
    expect(tag!.textContent).toBe('Test Series');
  });

  it('unit_card_headline_is_cohort_title', () => {
    const cohort = mockCohort({ title: 'My Cohort Title' });
    const { container } = render(<CohortCard cohort={cohort} />);
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.className).toMatch(/\bdisplay-3\b/);
    expect(h3!.textContent).toContain('My Cohort Title');
  });

  it('unit_card_subtitle_is_cohort_tagline', () => {
    const cohort = mockCohort({ tagline: 'A pithy tagline.' });
    const { container } = render(<CohortCard cohort={cohort} />);
    const p = container.querySelector('p');
    expect(p).not.toBeNull();
    expect(p!.className).toMatch(/\bbody-2\b/);
    expect(p!.className).toMatch(/text-\(--color-muted\)/);
    expect(p!.textContent).toBe('A pithy tagline.');
  });

  it('unit_card_footer_contains_status_badge', () => {
    const cohort = mockCohort({ status: 'open' });
    const { container } = render(<CohortCard cohort={cohort} />);
    const badge = container.querySelector(
      'span[aria-label^="Cohort status:"]'
    ) as HTMLElement | null;
    expect(badge).not.toBeNull();
    expect(badge!.textContent).toBe(COHORT_STATUS_LABELS.open);
  });

  it('unit_card_footer_has_dl_with_three_dt_dd_pairs', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    const dts = dl!.querySelectorAll('dt');
    const dds = dl!.querySelectorAll('dd');
    expect(dts.length).toBe(3);
    expect(dds.length).toBe(3);
    const labels = Array.from(dts).map((dt) => dt.textContent);
    expect(labels).toEqual(['Starts', 'Seats', 'Price']);
  });

  it('unit_card_dt_uses_label_class', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const dts = container.querySelectorAll('dt');
    expect(dts.length).toBeGreaterThan(0);
    for (const dt of Array.from(dts)) {
      expect(dt.className).toMatch(/\blabel\b/);
    }
  });

  it('unit_card_dd_uses_mono_class', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const dds = container.querySelectorAll('dd');
    expect(dds.length).toBeGreaterThan(0);
    for (const dd of Array.from(dds)) {
      expect(dd.className).toMatch(/\bmono\b/);
    }
  });

  it('unit_card_no_placeholder_palette_aliases', () => {
    const src = readSource(CARD_SOURCE);
    expect(src).not.toMatch(/\btext-muted\b/);
    expect(src).not.toMatch(/\btext-foreground\b/);
    expect(src).not.toMatch(/\btext-accent\b/);
    expect(src).not.toMatch(/\bbg-mist\b/);
    expect(src).not.toMatch(/\bbg-parchment\/\d/);
    expect(src).not.toMatch(/\bborder-mist\b/);
    expect(src).not.toMatch(/\bborder-accent\b/);
    expect(src).not.toMatch(/\bhover:border-accent\b/);
    expect(src).not.toMatch(/\bbg-signal\b/);
    expect(src).not.toMatch(/\bbg-steel\b/);
  });

  it('unit_card_href_is_cohort_slug_path', () => {
    const cohort = mockCohort({ slug: 'my-test-slug' });
    const { container } = render(<CohortCard cohort={cohort} />);
    const anchor = container.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toBe('/cohorts/my-test-slug');
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_card_consumes_status_badge_for_each_status', () => {
    for (const status of COHORT_STATUSES) {
      const { container, unmount } = render(<CohortCard cohort={mockCohort({ status })} />);
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

  it('integration_card_link_href_routes_to_detail_page', () => {
    const cohort = mockCohort({ slug: 'q3-2026' });
    const { container } = render(<CohortCard cohort={cohort} />);
    const anchor = container.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.getAttribute('href')).toMatch(/^\/cohorts\/[\w-]+$/);
  });

  it('integration_card_composes_marble_editorial_chrome', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
    // Brand chrome lives on EditorialCard — verify the resulting className carries it
    expect(article!.className).toMatch(/bg-\(--color-marble\)/);
    expect(article!.className).toMatch(/border-\(--color-ink\)/);
    expect(article!.className).toMatch(/p-\(--space-5\)/);
    expect(article!.className).toMatch(/hover:bg-\(--color-bone\)/);
    expect(article!.className).toMatch(/\btransition-colors\b/);
    // Confirm card source does NOT inline bg/border/padding directly
    const src = readSource(CARD_SOURCE);
    expect(src).not.toMatch(/bg-\(--color-marble\)/);
    expect(src).not.toMatch(/border-\(--color-ink\)/);
  });

  it('integration_card_index_page_still_imports_cohort_card', () => {
    const page = readSource(COHORTS_INDEX_PAGE);
    expect(page).toMatch(/from\s+['"]@\/components\/cohorts\/CohortCard['"]/);
    expect(page).toMatch(/\bCohortCard\b/);
  });

  // ─── Security ──────────────────────────────────────────────────────────

  it('sec_tampering_card_text_content_escapes_html', () => {
    const malicious = '<script>alert(1)</script>';
    const { container } = render(<CohortCard cohort={mockCohort({ title: malicious })} />);
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.textContent).toContain('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  it('sec_info_disclosure_no_dangerously_set_inner_html', () => {
    const src = readSource(CARD_SOURCE);
    expect(src).not.toMatch(/dangerouslySetInnerHTML/);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_card_link_has_focus_visible_outline', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const anchor = container.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    expect(anchor!.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
    expect(anchor!.className).toMatch(/focus-visible:outline-offset-2/);
  });

  it('a11y_card_uses_definition_list_semantic', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const dl = container.querySelector('dl');
    expect(dl).not.toBeNull();
    // Every dt must have an associated dd (same count, paired by source order)
    const dts = dl!.querySelectorAll('dt');
    const dds = dl!.querySelectorAll('dd');
    expect(dts.length).toBe(dds.length);
    expect(dts.length).toBeGreaterThan(0);
  });

  it('a11y_no_nested_interactive_elements_in_card', () => {
    const { container } = render(<CohortCard cohort={mockCohort()} />);
    const anchor = container.querySelector('a') as HTMLAnchorElement | null;
    expect(anchor).not.toBeNull();
    // No nested anchor or button inside the wrapping link
    expect(anchor!.querySelectorAll('a').length).toBe(0);
    expect(anchor!.querySelectorAll('button').length).toBe(0);
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_card_no_use_client_directive', () => {
    const src = readSource(CARD_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_card_no_forbidden_shadow', () => {
    const src = readSource(CARD_SOURCE);
    const FORBIDDEN = /\b(?:shadow-md|shadow-lg|shadow-xl|shadow-2xl|drop-shadow|box-shadow)\b/;
    expect(src).not.toMatch(FORBIDDEN);
  });

  it('infra_card_no_rounded_corners', () => {
    const src = readSource(CARD_SOURCE);
    expect(src).not.toMatch(/\brounded(?:-\w+)?\b/);
  });

  it('infra_card_no_palette_aliases', () => {
    const src = readSource(CARD_SOURCE);
    expect(src).not.toMatch(/\btext-muted\b/);
    expect(src).not.toMatch(/\btext-foreground\b/);
    expect(src).not.toMatch(/\btext-accent\b/);
    expect(src).not.toMatch(/\bbg-mist\b/);
    expect(src).not.toMatch(/\bbg-parchment\/\d/);
    expect(src).not.toMatch(/\bborder-mist\b/);
    expect(src).not.toMatch(/\bborder-accent\b/);
  });

  it('infra_card_tailwind4_paren_syntax', () => {
    const src = readSource(CARD_SOURCE);
    // Card delegates surface to EditorialCard, so it may have FEW direct paren tokens.
    // But forbidden bracket-color syntax must NEVER appear.
    expect(src).not.toMatch(/bg-\[--/);
    expect(src).not.toMatch(/text-\[color:/);
    expect(src).not.toMatch(/border-\[--/);
  });

  it('infra_card_tokens_resolve_in_globals_css', () => {
    const src = readSource(CARD_SOURCE);
    const tokens = new Set<string>();
    for (const m of src.matchAll(/--(?:color|edge-color|space|pair|section)[a-z0-9-]*/g)) {
      tokens.add(m[0]);
    }
    // Card delegates most chrome to EditorialCard; direct tokens may be few
    // but every one referenced must resolve.
    for (const token of tokens) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing declaration for ${token}`).toMatch(declRegex);
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_empty_tagline', () => {
    const { container } = render(<CohortCard cohort={mockCohort({ tagline: '' })} />);
    // Should not throw; article still present
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
  });

  it('edge_input_zero_capacity', () => {
    const { container } = render(<CohortCard cohort={mockCohort({ capacity: 0 })} />);
    const dds = container.querySelectorAll('dd');
    // Seats <dd> (second in dl) reads '0'
    const seatsDd = Array.from(dds).find((dd) => dd.textContent === '0');
    expect(seatsDd).toBeDefined();
    expect(seatsDd!.className).toMatch(/\bmono\b/);
  });

  it('edge_input_decimal_price_floor_to_dollar', () => {
    const { container } = render(
      <CohortCard cohort={mockCohort({ priceCents: 199900, currency: 'USD' })} />
    );
    const dds = container.querySelectorAll('dd');
    const priceDd = Array.from(dds).find((dd) => /^\$1,999$/.test(dd.textContent ?? ''));
    expect(priceDd, `expected $1,999 in one <dd>`).toBeDefined();
  });

  it('edge_input_lowercase_currency_uppercased', () => {
    const { container } = render(
      <CohortCard cohort={mockCohort({ priceCents: 50000, currency: 'usd' })} />
    );
    const dds = container.querySelectorAll('dd');
    const priceDd = Array.from(dds).find((dd) => /\$/.test(dd.textContent ?? ''));
    expect(priceDd).toBeDefined();
  });

  it('edge_temporal_start_date_iso_pinned_to_utc', () => {
    const { container } = render(
      <CohortCard cohort={mockCohort({ startDate: '2026-03-04' })} />
    );
    const dds = container.querySelectorAll('dd');
    // 'Mar 4, 2026' regardless of test runner TZ (T00:00:00Z pin)
    const startsDd = Array.from(dds).find((dd) => /Mar 4, 2026/.test(dd.textContent ?? ''));
    expect(startsDd, `expected "Mar 4, 2026" in one <dd>`).toBeDefined();
  });

  it('edge_input_very_long_title_card', () => {
    const long = 'A'.repeat(500);
    const { container } = render(<CohortCard cohort={mockCohort({ title: long })} />);
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.className).toMatch(/\bdisplay-3\b/);
    expect(h3.textContent!.length).toBeGreaterThanOrEqual(500);
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_globals_check_card', () => {
    const src = readSource(CARD_SOURCE);
    const tokens = new Set<string>();
    for (const m of src.matchAll(/--(?:color|edge-color|space|pair|section)[a-z0-9-]*/g)) {
      tokens.add(m[0]);
    }
    for (const token of tokens) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `card uses token ${token} which is missing from globals.css`).toMatch(declRegex);
    }
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_consistency_props_interface_preserved_card', () => {
    const src = readSource(CARD_SOURCE);
    expect(src).toMatch(/interface\s+CohortCardProps\b/);
    expect(src).toMatch(/CohortCardProps\s*\{[\s\S]{0,200}cohort:\s*Cohort/);
  });

  it('data_card_no_link_import', () => {
    const src = readSource(CARD_SOURCE);
    // CohortCard no longer imports next/link — delegated to EditorialCard via href prop
    expect(src).not.toMatch(/from\s+['"]next\/link['"]/);
  });
});
