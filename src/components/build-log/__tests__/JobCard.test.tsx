import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render } from '@testing-library/react';
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
    // Function signature must accept both
    expect(src).toMatch(/function JobCard\(\s*\{\s*rollup,\s*excerpt\s*\}/);
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
