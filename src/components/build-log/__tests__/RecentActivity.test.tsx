import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { RecentActivity } from '../RecentActivity';
import * as buildLogBarrel from '..';
import type { SessionStatus, JobRollupEntry } from '@/content/schemas';

// Resolve repo root from THIS file (not process.cwd()) so source-regex reads
// pass inside worktree slots. Matches Hero.test.tsx / PhaseStepper.test.tsx.
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const SRC_PATH = 'src/components/build-log/RecentActivity.tsx';
const BARREL_PATH = 'src/components/build-log/index.ts';
const source = () => readFileSync(join(REPO_ROOT, SRC_PATH), 'utf8');

const NOW = '2026-06-07T12:00:00Z';
const ROLLUP: readonly JobRollupEntry[] = [
  {
    slug: 'foo',
    title: 'Foo job',
    totalFeatures: 5,
    completedFeatures: 3,
    liveFeatures: 0,
    percentComplete: 60,
    status: 'in-progress',
  },
];

type Entries = SessionStatus['completedSections'];

// Build N detailed entries foo-1.1 .. foo-1.N (chronological, oldest first).
const detailedEntries = (
  n: number,
  over: (i: number) => Partial<{
    completedAt: string;
    commit_hash: string | number;
    tests: number;
    notes: string;
  }> = () => ({}),
): Entries =>
  Array.from({ length: n }, (_, i) => ({
    section: `foo-1.${i + 1}`,
    completedAt: '2026-06-07T08:00:00Z',
    ...over(i),
  }));

describe('RecentActivity', () => {
  // ── Unit ──────────────────────────────────────────────────────────
  it('unit_empty_state: renders warming-up copy when no entries', () => {
    render(<RecentActivity entries={[]} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText(/no sections shipped yet/i)).toBeInTheDocument();
  });

  it('unit_top5_expanded: top-5 entries render as expanded cards with Stat tiles', () => {
    const entries = detailedEntries(3, (i) => ({ tests: 10 * (i + 1) }));
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText('foo-1.3')).toBeInTheDocument();
    // one "Tests" Stat label per expanded card
    expect(screen.getAllByText('Tests')).toHaveLength(3);
  });

  it('unit_reverse_chronological: entries render newest-first across buckets', () => {
    const entries = detailedEntries(6);
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    const headings = screen.getAllByRole('heading', { level: 3 });
    // 6 entries -> 5 expanded cards (h3), 1 compact row (no h3)
    expect(headings).toHaveLength(5);
    // newest (foo-1.6) is the first expanded card
    expect(headings[0]).toHaveTextContent('foo-1.6');
  });

  it('unit_compact_tail_6_25: entries 6-25 render compact (only 5 expanded "Tests")', () => {
    const entries = detailedEntries(10, () => ({ tests: 5 }));
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getAllByText('Tests')).toHaveLength(5);
  });

  it('unit_show_older_beyond_25: entries beyond 25 hidden behind "Show N older"', () => {
    const entries = detailedEntries(30);
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText('Show 5 older')).toBeInTheDocument();
  });

  it('unit_minimal_no_detail: string-form entry renders "no detail recorded"', () => {
    render(
      <RecentActivity entries={['legacy-1.1']} rollup={ROLLUP} nowIso={NOW} />,
    );
    expect(screen.getByText(/no detail recorded/i)).toBeInTheDocument();
  });

  it('unit_commit_link_github: commit hash links to GitHub when repo URL provided', () => {
    render(
      <RecentActivity
        entries={[
          {
            section: 'foo-1.1',
            commit_hash: 'abcdef1234567',
            completedAt: '2026-06-07T08:00:00Z',
          },
        ]}
        rollup={ROLLUP}
        nowIso={NOW}
        githubRepoUrl="https://github.com/x/y"
      />,
    );
    const link = screen.getByRole('link', { name: /abcdef1/ });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/x/y/commit/abcdef1234567',
    );
  });

  it('unit_commit_plaintext_no_url: commit hash is plain text without repo URL', () => {
    render(
      <RecentActivity
        entries={[
          {
            section: 'foo-1.1',
            commit_hash: 'abcdef1234567',
            completedAt: '2026-06-07T08:00:00Z',
          },
        ]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    expect(screen.queryByRole('link', { name: /abcdef1/ })).toBeNull();
    expect(screen.getByText('abcdef1')).toBeInTheDocument();
  });

  it('unit_notes_closed_by_default: notes sit in a closed <details>', () => {
    const { container } = render(
      <RecentActivity
        entries={[
          {
            section: 'foo-1.1',
            notes: 'a'.repeat(20000),
            completedAt: '2026-06-07T00:00:00Z',
          },
        ]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    const notesDetails = Array.from(
      container.querySelectorAll('details'),
    ).find((d) => d.textContent?.includes('Notes ('));
    expect(notesDetails).toBeDefined();
    expect(notesDetails!.hasAttribute('open')).toBe(false);
  });

  it('unit_job_name_join: joins job name when a rollup slug prefixes the id', () => {
    render(
      <RecentActivity
        entries={[{ section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z' }]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/from Foo job/i)).toBeInTheDocument();
  });

  it('unit_stat_emdash_when_undefined: Stat renders em-dash for undefined values', () => {
    render(
      <RecentActivity
        entries={[{ section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z' }]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    // tests / filesNew / filesModified all undefined -> three em-dashes
    expect(screen.getAllByText('—')).toHaveLength(3);
  });

  // ── Integration ───────────────────────────────────────────────────
  it('int_full_session_reverse: 30-entry session spans all 3 buckets newest-first', () => {
    const entries = detailedEntries(30, () => ({ tests: 7 }));
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);
    expect(screen.getByText('Show 5 older')).toBeInTheDocument();
  });

  it('int_mixed_minimal_detailed: string + object entries coexist', () => {
    const entries: Entries = [
      'legacy-old',
      { section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z', tests: 3 },
    ];
    render(<RecentActivity entries={entries} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByText('foo-1.1')).toBeInTheDocument();
    expect(screen.getByText(/no detail recorded/i)).toBeInTheDocument();
  });

  // ── Accessibility ─────────────────────────────────────────────────
  it('a11y_section_labelledby: section is labelled by the Recent activity heading', () => {
    const { container } = render(
      <RecentActivity entries={detailedEntries(2)} rollup={ROLLUP} nowIso={NOW} />,
    );
    const heading = screen.getByRole('heading', {
      level: 2,
      name: /recent activity/i,
    });
    expect(heading).toHaveAttribute('id', 'recent-heading');
    const section = container.querySelector(
      'section[aria-labelledby="recent-heading"]',
    );
    expect(section).not.toBeNull();
  });

  it('a11y_summary_operable: disclosures use native keyboard-operable <summary>', () => {
    render(<RecentActivity entries={detailedEntries(30)} rollup={ROLLUP} nowIso={NOW} />);
    const summary = screen.getByText('Show 5 older');
    expect(summary.tagName).toBe('SUMMARY');
    expect(summary.parentElement?.tagName).toBe('DETAILS');
  });

  it('a11y_heading_hierarchy: h2 section heading with h3 card titles, no h1', () => {
    render(<RecentActivity entries={detailedEntries(2)} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
    expect(screen.getAllByRole('heading', { level: 3 }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('heading', { level: 1 })).toBeNull();
  });

  // ── Infrastructure ────────────────────────────────────────────────
  it('infra_purity_no_use_client: source is a pure RSC (no use client / hooks)', () => {
    const src = source();
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).not.toMatch(/useState/);
    expect(src).not.toMatch(/useEffect/);
  });

  it('infra_barrel_export: barrel re-exports RecentActivity + RecentActivityProps', () => {
    expect(buildLogBarrel).toHaveProperty('RecentActivity');
    const barrelSrc = readFileSync(join(REPO_ROOT, BARREL_PATH), 'utf8');
    expect(barrelSrc).toMatch(/RecentActivityProps/);
  });

  // ── Edge cases ────────────────────────────────────────────────────
  it('edge_state_exactly_5_no_compact: 5 entries -> all expanded, no tail', () => {
    const { container } = render(
      <RecentActivity entries={detailedEntries(5)} rollup={ROLLUP} nowIso={NOW} />,
    );
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(5);
    expect(screen.queryByText(/older/i)).toBeNull();
    // only the expanded <ul> renders (no compact, no older list)
    expect(container.querySelectorAll('ul')).toHaveLength(1);
  });

  it('edge_state_exactly_25_no_older: 25 entries -> compact present, no older', () => {
    const { container } = render(
      <RecentActivity entries={detailedEntries(25)} rollup={ROLLUP} nowIso={NOW} />,
    );
    expect(screen.queryByText(/older/i)).toBeNull();
    // expanded + compact = 2 lists
    expect(container.querySelectorAll('ul')).toHaveLength(2);
  });

  it('edge_input_huge_notes_40kb: 40KB notes stay closed, preview bounded + flattened', () => {
    const notes = (`${'a'.repeat(100)}\n`).repeat(400); // ~40k chars w/ newlines
    const { container } = render(
      <RecentActivity
        entries={[
          { section: 'foo-1.1', notes, completedAt: '2026-06-07T00:00:00Z' },
        ]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    const summary = Array.from(container.querySelectorAll('summary')).find((s) =>
      s.textContent?.includes('Notes ('),
    );
    expect(summary).toBeDefined();
    expect(summary!.textContent).toContain('Notes (40KB)');
    expect(summary!.textContent).toContain('…'); // ellipsis (truncated)
    expect(summary!.textContent).not.toContain('\n'); // whitespace flattened
  });

  it('edge_input_missing_optional_fields: no stats/commit -> em-dashes, no Commit line', () => {
    render(
      <RecentActivity
        entries={[{ section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z' }]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    expect(screen.getAllByText('—')).toHaveLength(3);
    expect(screen.queryByText(/Commit:/)).toBeNull();
  });

  it('edge_state_single_entry: one entry -> single expanded card', () => {
    render(<RecentActivity entries={detailedEntries(1)} rollup={ROLLUP} nowIso={NOW} />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(1);
  });

  // ── Error recovery ────────────────────────────────────────────────
  it('err_malformed_entry_render_stability: missing completedAt/commit renders cleanly', () => {
    expect(() =>
      render(
        <RecentActivity
          entries={[{ section: 'foo-1.1' }]}
          rollup={ROLLUP}
          nowIso={NOW}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText('foo-1.1')).toBeInTheDocument();
  });

  // ── Data integrity ────────────────────────────────────────────────
  it('data_serialization_numeric_hash_coercion: numeric commit_hash renders as string', () => {
    render(
      <RecentActivity
        entries={[
          {
            section: 'foo-1.1',
            commit_hash: 1234567,
            completedAt: '2026-06-07T08:00:00Z',
          },
        ]}
        rollup={ROLLUP}
        nowIso={NOW}
        githubRepoUrl="https://github.com/x/y"
      />,
    );
    const link = screen.getByRole('link', { name: /1234567/ });
    expect(link).toHaveAttribute(
      'href',
      'https://github.com/x/y/commit/1234567',
    );
  });

  it('data_sensitivity_notes_not_autoexpanded: notes <details> never auto-opens', () => {
    const { container } = render(
      <RecentActivity
        entries={[
          {
            section: 'foo-1.1',
            notes: 'x'.repeat(50000),
            completedAt: '2026-06-07T00:00:00Z',
          },
        ]}
        rollup={ROLLUP}
        nowIso={NOW}
      />,
    );
    const notesDetails = Array.from(
      container.querySelectorAll('details'),
    ).find((d) => d.textContent?.includes('Notes ('));
    expect(notesDetails!.hasAttribute('open')).toBe(false);
  });
});
