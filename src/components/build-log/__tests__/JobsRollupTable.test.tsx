// JobsRollupTable tests (styling-overhaul-7.4 hybrid red).
//
// Preserves the existing prop contract (rows: readonly JobRollupEntry[]),
// the data-testid='status-badge-{status}' cross-consumer pin (set by
// the real StatusBadge component, which we render unmocked here),
// the table semantics (thead/tbody/tr/th/td), and the progressbar
// aria contract. Adds brand-aware assertions per phase-7-pages.md:
//   - <Marble edge="strong"> wrapper around <table>
//   - thead bg-(--color-bone), th uses .label utility
//   - hover:bg-(--color-parchment) on tbody tr
//   - Numeric columns use tabular-nums + font-mono
//   - Progressbar fill uses --color-oxblood
//
// Source-level sentinels enforce brand utility adoption + no banned
// placeholder utility tokens.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { JobsRollupTable } from '../JobsRollupTable';
import type { JobRollupEntry } from '@/content/schemas';

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const COMP_SOURCE_PATH = join(__dirname_compat, '..', 'JobsRollupTable.tsx');
const COMP_SOURCE = readFileSync(COMP_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-accent',
  'text-muted',
  'text-link',
  'text-foreground',
  'text-parchment',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'text-xs',
  'uppercase',
  'tracking-wide',
  'tracking-tight',
  'rounded-lg',
  'rounded-md',
  'border-mist',
  'bg-mist',
  'hover:border-accent',
  'hover:opacity-90',
  'bg-accent',
  'font-semibold',
  'font-medium',
];

function makeRow(overrides: Partial<JobRollupEntry> = {}): JobRollupEntry {
  return {
    slug: 'demo',
    title: 'Demo Job',
    alias: 'dj',
    totalFeatures: 6,
    completedFeatures: 3,
    liveFeatures: 0,
    percentComplete: 50,
    status: 'in-progress',
    ...overrides,
  };
}

describe('JobsRollupTable', () => {
  // ─── Preserved behavior pins ───

  it('unit_table_one_row_per_entry', () => {
    const rows = [
      makeRow({ slug: 'a', title: 'Job A' }),
      makeRow({ slug: 'b', title: 'Job B' }),
      makeRow({ slug: 'c', title: 'Job C' }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bodyRows = container.querySelectorAll('tbody tr');
    expect(bodyRows).toHaveLength(3);
  });

  it('unit_table_title_links_to_job_detail', () => {
    const rows = [makeRow({ slug: 'community-showcase', title: 'Community Showcase' })];
    render(<JobsRollupTable rows={rows} />);
    const link = screen.getByRole('link', { name: /Community Showcase/ });
    expect(link).toHaveAttribute('href', '/build-log/jobs/community-showcase');
  });

  it('unit_table_alias_in_parens_when_present', () => {
    const rows = [makeRow({ slug: 'community-showcase', title: 'Community Showcase', alias: 'cs' })];
    render(<JobsRollupTable rows={rows} />);
    expect(screen.getByText('(cs)')).toBeInTheDocument();
  });

  it('unit_table_alias_omitted_when_absent', () => {
    const { alias: _omit, ...rest } = makeRow();
    void _omit;
    render(<JobsRollupTable rows={[rest as JobRollupEntry]} />);
    expect(screen.queryByText(/^\(/)).toBeNull();
  });

  it('unit_table_status_badge_per_row', () => {
    const rows = [
      makeRow({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRow({
        slug: 'b',
        title: 'B',
        status: 'complete',
        percentComplete: 100,
        completedFeatures: 6,
      }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    expect(container.querySelector('[data-testid="status-badge-in-progress"]')).toBeInTheDocument();
    expect(container.querySelector('[data-testid="status-badge-complete"]')).toBeInTheDocument();
  });

  it('unit_table_features_count_renders', () => {
    const rows = [makeRow({ totalFeatures: 17, completedFeatures: 12 })];
    render(<JobsRollupTable rows={rows} />);
    expect(screen.getByText(/12 \/ 17/)).toBeInTheDocument();
  });

  it('unit_table_rows_prop_name_preserved', () => {
    // Compile-time + runtime contract: prop must be called `rows`.
    const rows: readonly JobRollupEntry[] = [makeRow()];
    const { container } = render(<JobsRollupTable rows={rows} />);
    expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
  });

  it('a11y_table_progressbar_aria_attributes', () => {
    const rows = [makeRow({ title: 'Demo Job', percentComplete: 42 })];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-valuenow')).toBe('42');
    expect(bar?.getAttribute('aria-valuemin')).toBe('0');
    expect(bar?.getAttribute('aria-valuemax')).toBe('100');
    const label = bar?.getAttribute('aria-label') ?? '';
    expect(label).toMatch(/Demo Job/);
    expect(label).toMatch(/42/);
  });

  it('a11y_table_th_thead_structure', () => {
    const rows = [makeRow()];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const thead = container.querySelector('thead');
    expect(thead).not.toBeNull();
    expect(thead!.querySelectorAll('th').length).toBeGreaterThanOrEqual(4);
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
  });

  it('edge_table_progressbar_null_percent_shows_dash', () => {
    const rows = [
      makeRow({
        slug: 'unknown-job',
        title: 'Unknown Job',
        percentComplete: null,
        status: 'unknown',
        totalFeatures: 0,
        completedFeatures: 0,
      }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toBeNull();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('edge_table_progressbar_zero_for_planned', () => {
    const rows = [
      makeRow({
        slug: 'planned-job',
        title: 'Planned Job',
        percentComplete: 0,
        status: 'planned',
        completedFeatures: 0,
      }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    const bar = container.querySelector('[role="progressbar"]') as HTMLElement | null;
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-valuenow')).toBe('0');
  });

  it('edge_table_empty_rows_renders_thead_only', () => {
    const { container } = render(<JobsRollupTable rows={[]} />);
    expect(container.querySelector('thead')).not.toBeNull();
    const tbody = container.querySelector('tbody');
    expect(tbody).not.toBeNull();
    expect(tbody!.querySelectorAll('tr')).toHaveLength(0);
  });

  // ─── Data integrity / cross-consumer contract ───

  it('data_table_features_count_matches_input', () => {
    const rows = [makeRow({ totalFeatures: 9, completedFeatures: 4 })];
    const { container } = render(<JobsRollupTable rows={rows} />);
    expect(container.textContent).toMatch(/4 \/ 9/);
  });

  it('data_table_status_badge_consumer_contract_preserved', () => {
    // Cross-consumer pin: StatusBadge testid contract relied on by
    // JobCard.test + this file + /status page testid scans.
    const rows = [
      makeRow({ slug: 'a', title: 'A', status: 'in-progress' }),
      makeRow({ slug: 'b', title: 'B', status: 'complete', percentComplete: 100, completedFeatures: 6 }),
    ];
    const { container } = render(<JobsRollupTable rows={rows} />);
    expect(container.querySelector('[data-testid="status-badge-in-progress"]')).not.toBeNull();
    expect(container.querySelector('[data-testid="status-badge-complete"]')).not.toBeNull();
  });

  // ─── Source-grep sentinels ───

  it('infra_table_no_banned_placeholder_utilities: source contains ZERO banned tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(COMP_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_table_imports_brand_primitives: source imports Marble from @/components/brand', () => {
    expect(COMP_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(COMP_SOURCE).toMatch(/\bMarble\b/);
  });

  it('infra_table_uses_label_utility_in_thead: source contains the .label utility class', () => {
    expect(COMP_SOURCE).toMatch(/\blabel\b/);
  });

  it('infra_table_forbidden_pattern_sentinel_clean: source contains no gradient/UI-shadow/pure-color/forbidden-palette tokens', () => {
    const checks: Array<[string, RegExp]> = [
      ['linear-gradient', /\blinear-gradient\s*\(/i],
      ['radial-gradient', /\bradial-gradient\s*\(/i],
      ['bg-gradient util', /\bbg-gradient-(to-[a-z]+|conic|radial)\b/],
      ['Tailwind UI shadow', /\bshadow-(md|lg|xl|2xl|inner)\b/],
      ['pure black hex', /#0{3}(?:0{3})?\b/],
      ['pure white hex', /#f{3}(?:f{3})?\b/i],
      ['pure red hex', /#(?:f00|ff0000)\b/i],
      [
        'forbidden palette utility',
        /\b(?:bg|text|border|ring|from|to|via)-(?:red|orange|yellow|blue|indigo|purple|pink|fuchsia|rose|sky|cyan|teal|green|emerald|lime)-\d{2,3}\b/,
      ],
    ];
    const hits = checks.filter(([, re]) => re.test(COMP_SOURCE)).map(([n]) => n);
    expect(hits).toEqual([]);
  });
});
