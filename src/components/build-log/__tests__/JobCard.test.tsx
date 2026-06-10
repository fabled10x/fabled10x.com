import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { JobCard } from '../JobCard';
import type { JobRollupEntry } from '@/content/schemas';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const JOBCARD_SOURCE = 'src/components/build-log/JobCard.tsx';
const GLOBALS_CSS = readSource('src/app/globals.css');

const baseRollup: JobRollupEntry = {
  slug: 'demo-job',
  title: 'Demo Job',
  alias: 'dj',
  totalFeatures: 6,
  completedFeatures: 3,
  liveFeatures: 0,
  percentComplete: 50,
  status: 'in-progress',
};

function rootElement(container: HTMLElement): HTMLElement {
  const el = container.firstElementChild as HTMLElement | null;
  expect(el).not.toBeNull();
  return el!;
}

function findArticle(container: HTMLElement): HTMLElement {
  const article = container.querySelector('article');
  expect(article).not.toBeNull();
  return article as HTMLElement;
}

describe('JobCard (post-EditorialCard refactor)', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_job_card_renders_editorial_card_article_root', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    const article = root.querySelector('article');
    expect(article).not.toBeNull();
    expect(article!.className).toMatch(/bg-\(--color-marble\)/);
    expect(article!.className).toMatch(/border-\(--color-ink\)/);
  });

  it('unit_job_card_tag_is_build_log_label', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const tag = container.querySelector('article span.label');
    expect(tag).not.toBeNull();
    expect(tag!.textContent).toBe('Build Log');
  });

  it('unit_job_card_headline_strips_implementation_plan_suffix', () => {
    const { container } = render(
      <JobCard
        rollup={{ ...baseRollup, title: 'Demo Job — Implementation Plan' }}
        excerpt="x"
      />,
    );
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.textContent).toBe('Demo Job');
    expect(h3!.className).toMatch(/\bdisplay-3\b/);
  });

  it('unit_job_card_headline_unchanged_when_no_suffix', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.textContent).toBe('Demo Job');
  });

  it('unit_job_card_subtitle_is_excerpt', () => {
    const { container } = render(
      <JobCard rollup={baseRollup} excerpt="The story of demo job." />,
    );
    const p = container.querySelector('article > p');
    expect(p).not.toBeNull();
    expect(p!.textContent).toBe('The story of demo job.');
    expect(p!.className).toMatch(/\bbody-2\b/);
    expect(p!.className).toMatch(/text-\(--color-muted\)/);
  });

  it('unit_job_card_footer_contains_status_badge', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const badge = container.querySelector('[data-testid="status-badge-in-progress"]');
    expect(badge).not.toBeNull();
    const article = findArticle(container);
    const footerDiv = Array.from(article.children).find((c) => c.tagName === 'DIV');
    expect(footerDiv).toBeDefined();
    expect((footerDiv as HTMLElement).contains(badge as Node)).toBe(true);
  });

  it('unit_job_card_footer_renders_feature_counts_with_percent', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const article = findArticle(container);
    const footerDiv = Array.from(article.children).find((c) => c.tagName === 'DIV') as HTMLElement;
    expect(footerDiv.textContent).toMatch(/3 \/ 6 features/);
    expect(footerDiv.textContent).toMatch(/50%/);
  });

  it('unit_job_card_footer_omits_percent_when_null', () => {
    const { container } = render(
      <JobCard
        rollup={{ ...baseRollup, percentComplete: null, totalFeatures: 0, completedFeatures: 0 }}
        excerpt="x"
      />,
    );
    const article = findArticle(container);
    const footerDiv = Array.from(article.children).find((c) => c.tagName === 'DIV') as HTMLElement;
    expect(footerDiv.textContent).toMatch(/0 \/ 0 features/);
    expect(footerDiv.textContent).not.toMatch(/%/);
  });

  it('unit_job_card_renders_alias_when_present', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const article = findArticle(container);
    // Alias hint lives in the footer alongside status + counts
    expect(article.textContent).toContain('dj');
  });

  it('unit_job_card_omits_alias_when_undefined', () => {
    const { alias: _omit, ...rest } = baseRollup;
    void _omit;
    const { container } = render(
      <JobCard rollup={rest as JobRollupEntry} excerpt="x" />,
    );
    const article = findArticle(container);
    // No "dj" anywhere in the rendered card
    expect(article.textContent).not.toContain('dj');
    // And no parenthesized hint of any kind in the footer
    const footerDiv = Array.from(article.children).find((c) => c.tagName === 'DIV') as HTMLElement | undefined;
    if (footerDiv) {
      expect(footerDiv.textContent).not.toMatch(/\([^)]+\)/);
    }
  });

  it('unit_job_card_href_points_to_job_page', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const root = rootElement(container) as HTMLAnchorElement;
    expect(root.tagName).toBe('A');
    expect(root.getAttribute('href')).toBe('/build-log/jobs/demo-job');
  });

  it('unit_job_card_no_own_typography_classes', () => {
    const src = readSource(JOBCARD_SOURCE);
    // No inline typography utilities — typography is owned by EditorialCard primitive
    expect(src).not.toMatch(/\btext-xl\b/);
    expect(src).not.toMatch(/\bfont-display\b/);
    expect(src).not.toMatch(/\btext-sm\b/);
    expect(src).not.toMatch(/\btext-xs\b/);
    expect(src).not.toMatch(/\bline-clamp-\d+\b/);
  });

  it('unit_job_card_no_own_edge_or_radius_classes', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).not.toMatch(/bg-marble-texture/);
    expect(src).not.toMatch(/border-mist/);
    expect(src).not.toMatch(/\brounded(?:-\w+)?\b/);
    expect(src).not.toMatch(/hover:border-accent/);
    expect(src).not.toMatch(/\btext-link\b/);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_job_card_composes_with_editorial_card', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="An excerpt." />);
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    const article = root.querySelector('article') as HTMLElement;
    expect(article).not.toBeNull();
    // Hierarchy: tag span → h3 → p subtitle → footer div
    const children = Array.from(article.children) as HTMLElement[];
    expect(children[0].tagName).toBe('SPAN');
    expect(children[0].className).toMatch(/\blabel\b/);
    expect(children[0].textContent).toBe('Build Log');
    expect(children[1].tagName).toBe('H3');
    expect(children[1].className).toMatch(/\bdisplay-3\b/);
    expect(children[2].tagName).toBe('P');
    expect(children[2].className).toMatch(/\bbody-2\b/);
    expect(children[3].tagName).toBe('DIV');
    // Footer carries the EditorialCard footer wrapper classes
    expect(children[3].className).toMatch(/mt-\(--space-2\)/);
  });

  it('integration_job_card_preserves_props_api', () => {
    const src = readSource(JOBCARD_SOURCE);
    // Props interface must still expose { rollup, excerpt }
    expect(src).toMatch(/JobCardProps[\s\S]{0,400}rollup:\s*JobRollupEntry/);
    expect(src).toMatch(/JobCardProps[\s\S]{0,400}excerpt:\s*string/);
    // Function signature must accept both (rollup + excerpt first; 2.2 adds optional props after)
    expect(src).toMatch(/function JobCard\(\s*\{\s*rollup,\s*excerpt,/);
  });

  // ─── Security ──────────────────────────────────────────────────────────

  it('sec_tampering_excerpt_text_content_escapes_html', () => {
    const malicious = '<script>alert(1)</script>';
    const { container } = render(<JobCard rollup={baseRollup} excerpt={malicious} />);
    const article = findArticle(container);
    expect(article.textContent).toContain('<script>alert(1)</script>');
    expect(container.querySelector('script')).toBeNull();
  });

  it('sec_info_disclosure_no_dangerously_set_inner_html', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).not.toMatch(/dangerouslySetInnerHTML/);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────

  it('a11y_job_card_uses_semantic_article', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const article = container.querySelector('article');
    expect(article).not.toBeNull();
  });

  it('a11y_job_card_headline_is_h3', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.textContent).toBe('Demo Job');
  });

  it('a11y_job_card_link_has_focus_visible_outline', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    expect(root.className).toMatch(/focus-visible:outline\b/);
    expect(root.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
    expect(root.className).toMatch(/focus-visible:outline-offset-2/);
  });

  it('a11y_job_card_no_nested_interactive_elements', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    // Whole card is the link — no nested anchors or buttons inside it
    expect(root.querySelectorAll('a').length).toBe(0);
    expect(root.querySelectorAll('button').length).toBe(0);
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_job_card_no_use_client_directive', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_job_card_imports_editorial_card_from_brand_barrel', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(src).toMatch(/import\s*\{[^}]*\bEditorialCard\b[^}]*\}\s*from\s+['"]@\/components\/brand['"]/);
  });

  it('infra_job_card_source_drops_deprecated_classes', () => {
    const src = readSource(JOBCARD_SOURCE);
    const DEPRECATED = [
      /bg-marble-texture/,
      /border-mist/,
      /\brounded(?:-\w+)?\b/,
      /hover:border-accent/,
      /\btext-link\b/,
      /\btext-xl\b/,
      /\bfont-display\b/,
      /\bline-clamp-\d+\b/,
    ];
    for (const re of DEPRECATED) {
      expect(src, `JobCard source still contains deprecated pattern ${re}`).not.toMatch(re);
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────

  it('edge_input_job_card_zero_total_features', () => {
    const { container } = render(
      <JobCard
        rollup={{
          ...baseRollup,
          totalFeatures: 0,
          completedFeatures: 0,
          percentComplete: null,
          status: 'unknown',
        }}
        excerpt="x"
      />,
    );
    const article = findArticle(container);
    const footerDiv = Array.from(article.children).find((c) => c.tagName === 'DIV') as HTMLElement;
    expect(footerDiv.textContent).toMatch(/0 \/ 0 features/);
    expect(footerDiv.textContent).not.toMatch(/%/);
  });

  it('edge_input_job_card_very_long_title', () => {
    const long = 'A'.repeat(500);
    const { container } = render(
      <JobCard rollup={{ ...baseRollup, title: long }} excerpt="x" />,
    );
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.textContent!.length).toBeGreaterThanOrEqual(500);
    expect(h3.className).toMatch(/\bdisplay-3\b/);
    const article = findArticle(container);
    expect(article.className).toMatch(/bg-\(--color-marble\)/);
  });

  it('edge_input_job_card_empty_excerpt', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="" />);
    // Card must still mount with the headline and tag present
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.textContent).toBe('Demo Job');
    const tag = container.querySelector('article span.label');
    expect(tag).not.toBeNull();
    expect(tag!.textContent).toBe('Build Log');
  });

  // ─── Error Recovery ────────────────────────────────────────────────────

  it('err_token_unresolved_globals_check_jobcard_consumed_tokens', () => {
    // JobCard's footer uses --color-muted via the body-3 mono spans
    const required = ['--color-muted'];
    for (const token of required) {
      const declRegex = new RegExp(`${token}\\s*:`);
      expect(GLOBALS_CSS, `globals.css missing token ${token}`).toMatch(declRegex);
    }
  });

  // ─── Data Integrity ────────────────────────────────────────────────────

  it('data_consistency_job_card_classname_deterministic', () => {
    const renders = Array.from({ length: 5 }, () =>
      render(<JobCard rollup={baseRollup} excerpt="x" />),
    );
    const classNames = renders.map((r) => findArticle(r.container).className);
    expect(new Set(classNames).size).toBe(1);
    renders.forEach((r) => r.unmount());
  });

  it('data_consistency_jobcard_props_interface_matches_planned_shape', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).toMatch(/JobCardProps[\s\S]{0,400}rollup:\s*JobRollupEntry/);
    expect(src).toMatch(/JobCardProps[\s\S]{0,400}excerpt:\s*string/);
  });
});

// ════════════════════════════════════════════════════════════════════════════
// Section 2.2: Enriched JobCard — progress bar + last-activity + live-dot.
// Hybrid posture: new enrichment behavior tests fail until /green; preserved
// absence/guard tests stay green. Enrichments flow through EditorialCard's
// `footer` ReactNode slot (do NOT modify EditorialCard).
// ════════════════════════════════════════════════════════════════════════════

const NOW_2_2 = '2026-06-07T12:00:00Z';
const NINE_AM_2_2 = '2026-06-07T09:00:00Z'; // 3h before NOW → "3h ago"
const FUTURE_2_2 = '2026-06-07T15:00:00Z'; // after NOW → "just now"

describe('JobCard (enriched 2.2)', () => {
  // ─── Unit ──────────────────────────────────────────────────────────────
  it('unit_job_card_renders_live_dot_when_count_positive', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" liveWorktreeCount={1} />);
    expect(screen.getByTestId('live-dot')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveClass('sr-only');
  });

  it('unit_job_card_no_live_dot_when_count_zero', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });

  it('unit_job_card_renders_last_activity_when_iso_and_now', () => {
    render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso={NINE_AM_2_2}
        nowIso={NOW_2_2}
      />,
    );
    const node = screen.getByTestId('last-activity');
    expect(node).toHaveTextContent(/Last shipped/);
    expect(node).toHaveTextContent(/3h ago/);
  });

  it('unit_job_card_omits_last_activity_when_iso_missing', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" nowIso={NOW_2_2} />);
    expect(screen.queryByTestId('last-activity')).toBeNull();
  });

  it('unit_job_card_renders_progress_bar_with_aria_valuenow', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('unit_job_card_hides_progress_bar_when_percent_null', () => {
    render(
      <JobCard rollup={{ ...baseRollup, percentComplete: null }} excerpt="x" />,
    );
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('unit_job_card_progress_fill_width_matches_percent', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement | null;
    expect(fill).not.toBeNull();
    expect(fill!.style.width).toBe('50%');
  });

  it('unit_job_card_feature_count_text_preserved_alongside_bar', () => {
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    const article = findArticle(container);
    expect(article.textContent).toMatch(/3 \/ 6 features/);
    expect(article.textContent).toMatch(/50%/);
  });

  // ─── Integration ───────────────────────────────────────────────────────
  it('integration_job_card_renders_all_enrichments_together', () => {
    render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        liveWorktreeCount={2}
        lastActivityIso={NINE_AM_2_2}
        nowIso={NOW_2_2}
      />,
    );
    expect(screen.getByTestId('live-dot')).toBeInTheDocument();
    expect(screen.getByTestId('last-activity')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it.each([
    [0, false, false],
    [0, false, true],
    [0, true, false],
    [0, true, true],
    [2, false, false],
    [2, false, true],
    [2, true, false],
    [2, true, true],
  ])(
    'integration_job_card_eight_combinations_render_without_crashing (live=%d, activity=%s, progress=%s)',
    (liveWorktreeCount, hasActivity, hasProgress) => {
      const { container } = render(
        <JobCard
          rollup={hasProgress ? baseRollup : { ...baseRollup, percentComplete: null }}
          excerpt="x"
          liveWorktreeCount={liveWorktreeCount}
          lastActivityIso={hasActivity ? NINE_AM_2_2 : null}
          nowIso={NOW_2_2}
        />,
      );
      expect(container.querySelector('article')).toBeInTheDocument();
    },
  );

  it('integration_job_card_backward_compatible_default_props', () => {
    // The /build-log/page.tsx:165 call site: <JobCard rollup excerpt />
    const { container } = render(<JobCard rollup={baseRollup} excerpt="x" />);
    expect(container.querySelector('article')).toBeInTheDocument();
    expect(screen.queryByTestId('live-dot')).toBeNull();
    expect(screen.queryByTestId('last-activity')).toBeNull();
  });

  // ─── Security ──────────────────────────────────────────────────────────
  it('sec_tampering_last_activity_renders_as_escaped_text', () => {
    const { container } = render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso={'<script>alert(1)</script>'}
        nowIso={NOW_2_2}
      />,
    );
    // Unparseable ISO → formatRelativeTime returns '' → no last-activity line,
    // and crucially no script element is ever created.
    expect(container.querySelector('script')).toBeNull();
    expect(screen.queryByTestId('last-activity')).toBeNull();
  });

  it('sec_tampering_progress_width_is_numeric_no_css_injection', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    const fill = bar.firstElementChild as HTMLElement;
    // percent derives from typed number percentComplete (?? 0) → numeric percent only
    expect(fill.style.width).toMatch(/^\d+%$/);
  });

  // ─── Accessibility ─────────────────────────────────────────────────────
  it('a11y_progress_bar_has_role_and_aria_value_attributes', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
  });

  it('a11y_progress_bar_has_descriptive_aria_label', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-label', '3 of 6 features complete');
  });

  it('a11y_live_dot_is_aria_hidden_with_sr_only_text', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" liveWorktreeCount={1} />);
    const dot = screen.getByTestId('live-dot');
    expect(dot).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByText('Active')).toHaveClass('sr-only');
  });

  it('a11y_enriched_card_no_nested_interactive', () => {
    const { container } = render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        liveWorktreeCount={2}
        lastActivityIso={NINE_AM_2_2}
        nowIso={NOW_2_2}
      />,
    );
    const root = rootElement(container);
    expect(root.tagName).toBe('A');
    expect(root.querySelectorAll('a').length).toBe(0);
    expect(root.querySelectorAll('button').length).toBe(0);
  });

  // ─── Infrastructure ────────────────────────────────────────────────────
  it('infra_job_card_no_use_client_after_enrichment', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_job_card_source_has_no_text_xs_or_deprecated', () => {
    const src = readSource(JOBCARD_SOURCE);
    const DEPRECATED = [
      /\btext-xs\b/,
      /\btext-sm\b/,
      /\bline-clamp-\d+\b/,
      /\bfont-display\b/,
      /\brounded(?:-\w+)?\b/,
      /bg-marble-texture/,
      /border-mist/,
    ];
    for (const re of DEPRECATED) {
      expect(src, `JobCard source contains forbidden pattern ${re}`).not.toMatch(re);
    }
  });

  it('infra_job_card_imports_relative_time_formatter', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).toMatch(
      /import\s*\{[^}]*\bformatRelativeTime\b[^}]*\}\s*from\s+['"]@\/lib\/build-log\/relative-time['"]/,
    );
  });

  it('infra_job_card_progress_uses_brand_tokens', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).toMatch(/bg-\(--color-bone\)/);
    expect(src).toMatch(/bg-\(--color-ink\)/);
    // No bare bg-bone / bg-ink utility (must use paren-token syntax)
    expect(src).not.toMatch(/\bbg-bone\b/);
    expect(src).not.toMatch(/\bbg-ink\b/);
  });

  it('infra_job_card_tokens_resolve_in_globals', () => {
    const required = ['--color-bone', '--color-ink', '--color-muted', '--color-oxblood'];
    for (const token of required) {
      expect(GLOBALS_CSS, `globals.css missing token ${token}`).toMatch(
        new RegExp(`${token}\\s*:`),
      );
    }
  });

  // ─── Edge Cases ────────────────────────────────────────────────────────
  it('edge_input_percent_complete_zero', () => {
    render(<JobCard rollup={{ ...baseRollup, percentComplete: 0 }} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('0%');
  });

  it('edge_input_percent_complete_hundred', () => {
    render(
      <JobCard
        rollup={{ ...baseRollup, percentComplete: 100, completedFeatures: 6 }}
        excerpt="x"
      />,
    );
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '100');
    expect((bar.firstElementChild as HTMLElement).style.width).toBe('100%');
  });

  it('edge_input_live_worktree_count_large', () => {
    const { container } = render(
      <JobCard rollup={baseRollup} excerpt="x" liveWorktreeCount={99} />,
    );
    expect(container.querySelectorAll('[data-testid="live-dot"]').length).toBe(1);
  });

  it('edge_input_now_iso_empty_with_activity_iso', () => {
    render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso={NINE_AM_2_2}
        nowIso=""
      />,
    );
    expect(screen.queryByTestId('last-activity')).toBeNull();
  });

  it('edge_input_invalid_last_activity_iso', () => {
    const { container } = render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso={'not-a-date'}
        nowIso={NOW_2_2}
      />,
    );
    expect(screen.queryByTestId('last-activity')).toBeNull();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('edge_input_zero_total_features_no_percent', () => {
    const { container } = render(
      <JobCard
        rollup={{
          ...baseRollup,
          totalFeatures: 0,
          completedFeatures: 0,
          percentComplete: null,
        }}
        excerpt="x"
      />,
    );
    const article = findArticle(container);
    expect(article.textContent).toMatch(/0 \/ 0 features/);
    expect(article.textContent).not.toMatch(/%/);
    expect(screen.queryByRole('progressbar')).toBeNull();
  });

  it('edge_input_very_long_title_with_enrichments', () => {
    const long = 'A'.repeat(500);
    const { container } = render(
      <JobCard
        rollup={{ ...baseRollup, title: long }}
        excerpt="x"
        liveWorktreeCount={1}
        lastActivityIso={NINE_AM_2_2}
        nowIso={NOW_2_2}
      />,
    );
    const h3 = container.querySelector('h3') as HTMLElement;
    expect(h3.textContent!.length).toBeGreaterThanOrEqual(500);
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  // ─── Error Recovery ────────────────────────────────────────────────────
  it('err_invalid_iso_degrades_to_no_activity_line', () => {
    const { container } = render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso={'garbage-not-iso'}
        nowIso={NOW_2_2}
      />,
    );
    expect(screen.queryByTestId('last-activity')).toBeNull();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it('err_future_activity_iso_renders_just_now', () => {
    render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso={FUTURE_2_2}
        nowIso={NOW_2_2}
      />,
    );
    expect(screen.getByTestId('last-activity')).toHaveTextContent(/Last shipped just now/);
  });

  // ─── Data Integrity ────────────────────────────────────────────────────
  it('data_consistency_enriched_classname_deterministic', () => {
    const renders = Array.from({ length: 5 }, () =>
      render(
        <JobCard
          rollup={baseRollup}
          excerpt="x"
          liveWorktreeCount={1}
          lastActivityIso={NINE_AM_2_2}
          nowIso={NOW_2_2}
        />,
      ),
    );
    const classNames = renders.map((r) => findArticle(r.container).className);
    expect(new Set(classNames).size).toBe(1);
    renders.forEach((r) => r.unmount());
  });

  it('data_progress_fill_width_string_format', () => {
    for (const p of [0, 25, 50, 100]) {
      const { container, unmount } = render(
        <JobCard rollup={{ ...baseRollup, percentComplete: p }} excerpt="x" />,
      );
      const bar = container.querySelector('[role="progressbar"]') as HTMLElement;
      const fill = bar.firstElementChild as HTMLElement;
      expect(fill.style.width).toBe(`${p}%`);
      unmount();
    }
  });

  it('data_ssr_no_date_now_in_source', () => {
    const src = readSource(JOBCARD_SOURCE);
    expect(src).not.toMatch(/Date\.now\(\)/);
    expect(src).not.toMatch(/new Date\(/);
  });
});
