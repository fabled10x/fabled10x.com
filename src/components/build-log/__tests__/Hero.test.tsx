import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { Hero } from '../Hero';
import * as buildLogBarrel from '..';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';
import type { SessionStatus, JobRollupEntry } from '@/content/schemas';

// Resolve repo root from THIS file (not process.cwd()) so source-regex reads
// pass inside worktree slots. Matches PhaseStepper.test.tsx / StatusBadge.test.tsx.
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const HERO_SOURCE_PATH = 'src/components/build-log/Hero.tsx';
const heroSource = () => readFileSync(join(REPO_ROOT, HERO_SOURCE_PATH), 'utf8');

const NOW = '2026-06-07T12:00:00Z';
const base = {
  rollup: [] as readonly JobRollupEntry[],
  worktrees: [] as readonly LiveWorktree[],
  nowIso: NOW,
};

// Compact fixture builders — keep object literals minimal & valid SessionStatus.
const session = (over: Partial<SessionStatus> = {}): SessionStatus => ({
  id: 's',
  completedSections: [],
  ...over,
});
const wt = (sectionId: string): LiveWorktree =>
  ({ sectionId } as unknown as LiveWorktree);
const rollupEntry = (over: Partial<JobRollupEntry> = {}): JobRollupEntry => ({
  slug: 'x',
  title: 'X',
  totalFeatures: 1,
  completedFeatures: 0,
  liveFeatures: 0,
  percentComplete: 0,
  status: 'in-progress',
  ...over,
});

describe('Hero', () => {
  // ── Unit ────────────────────────────────────────────────────────────────
  it('unit_renders_current_anchor: section id="current" present', () => {
    const { container } = render(
      <Hero liveStatus="unknown" session={null} {...base} />,
    );
    expect(container.querySelector('#current')).toBeInTheDocument();
  });

  it('unit_data_live_status_attribute: data-live-status mirrors prop', () => {
    const { container } = render(
      <Hero liveStatus="idle" session={session()} {...base} />,
    );
    expect(
      container.querySelector('[data-live-status="idle"]'),
    ).toBeInTheDocument();
  });

  it('unit_active_single_agent_sentence: phase label + sectionId', () => {
    render(
      <Hero
        liveStatus="active"
        session={session({
          currentSection: 'build-log-overhaul-1.2',
          currentAgent: 'green',
        })}
        rollup={[]}
        worktrees={[wt('build-log-overhaul-1.2')]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/making the tests pass/i)).toBeInTheDocument();
    expect(screen.getByText(/build-log-overhaul-1\.2/)).toBeInTheDocument();
  });

  it('unit_active_plural_agents_sentence: "N AI agents are working"', () => {
    render(
      <Hero
        liveStatus="active"
        session={session()}
        rollup={[]}
        worktrees={[wt('a-1.1'), wt('b-1.1')]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/2 AI agents are working/i)).toBeInTheDocument();
  });

  it('unit_paused_with_section: paused between phases on {sectionId}', () => {
    render(
      <Hero
        liveStatus="paused"
        session={session({ currentSection: 'foo-1.1', currentAgent: 'pending' })}
        {...base}
      />,
    );
    expect(
      screen.getByText(/paused between phases on foo-1\.1/i),
    ).toBeInTheDocument();
  });

  it('unit_idle_sentence_relative: idle + relative time', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({
          completedSections: [
            { section: 'foo-1.1', completedAt: '2026-06-07T09:00:00Z' },
          ],
        })}
        {...base}
      />,
    );
    expect(screen.getByText(/pipeline is idle.*3h ago/i)).toBeInTheDocument();
  });

  it('unit_stale_sentence: last shipped … site is up-to-date', () => {
    render(
      <Hero
        liveStatus="stale"
        session={session({
          completedSections: [
            { section: 'foo-1.1', completedAt: '2026-06-01T00:00:00Z' },
          ],
        })}
        {...base}
      />,
    );
    expect(
      screen.getByText(/last shipped.*site is up-to-date/i),
    ).toBeInTheDocument();
  });

  it('unit_unknown_sentence: state unavailable copy', () => {
    render(<Hero liveStatus="unknown" session={null} {...base} />);
    expect(screen.getByText(/state unavailable/i)).toBeInTheDocument();
  });

  it('unit_stat_tiles_compute: shipped / tests / in-progress', () => {
    render(
      <Hero
        liveStatus="active"
        session={session({
          currentSection: 'x',
          currentAgent: 'green',
          completedSections: [
            { section: 'a', tests: 10 },
            { section: 'b', tests: 20 },
            'c-string-form',
          ],
        })}
        rollup={[
          rollupEntry({ slug: 'a', title: 'A', status: 'in-progress' }),
          rollupEntry({
            slug: 'b',
            title: 'B',
            completedFeatures: 1,
            percentComplete: 100,
            status: 'complete',
          }),
        ]}
        worktrees={[wt('x')]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('3')).toBeInTheDocument(); // shipped
    expect(screen.getByText('30')).toBeInTheDocument(); // tests
    expect(screen.getByText('1')).toBeInTheDocument(); // in-progress
  });

  it('unit_what_is_this_link: anchor to #whatisthis', () => {
    const { container } = render(
      <Hero liveStatus="unknown" session={null} {...base} />,
    );
    const link = container.querySelector('a[href="#whatisthis"]');
    expect(link).toBeInTheDocument();
  });

  it('unit_stat_value_thousands_separator: tests >= 1000 grouped', () => {
    const many = Array.from({ length: 3 }, (_, i) => ({
      section: `s-${i}`,
      tests: 500,
    }));
    render(
      <Hero
        liveStatus="idle"
        session={session({ completedSections: many })}
        {...base}
      />,
    );
    // 3 * 500 = 1500 → locale separator (e.g. "1,500")
    expect(screen.getByText('1,500')).toBeInTheDocument();
  });

  // ── Integration ───────────────────────────────────────────────────────
  it('int_barrel_reexports_hero: Hero exported from build-log barrel', () => {
    expect(buildLogBarrel).toHaveProperty('Hero');
    expect(buildLogBarrel.Hero).toBe(Hero);
  });

  it('int_composes_phase_label: friendly label, not raw "green"', () => {
    render(
      <Hero
        liveStatus="active"
        session={session({ currentSection: 'z-1.1', currentAgent: 'green' })}
        rollup={[]}
        worktrees={[wt('z-1.1')]}
        nowIso={NOW}
      />,
    );
    expect(screen.queryByText(/\bgreen\b/i)).toBeNull();
    expect(screen.getByText(/making the tests pass/i)).toBeInTheDocument();
  });

  it('int_composes_relative_time: idle 3h-old renders "3h ago"', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({
          completedSections: [
            { section: 'foo-1.1', completedAt: '2026-06-07T09:00:00Z' },
          ],
        })}
        {...base}
      />,
    );
    expect(screen.getByText(/3h ago/)).toBeInTheDocument();
  });

  // ── Security ──────────────────────────────────────────────────────────
  it('sec_tampering_section_id_escaped_text: no <script> element injected', () => {
    const { container } = render(
      <Hero
        liveStatus="paused"
        session={session({
          currentSection: '<script>alert(1)</script>-1.1',
          currentAgent: 'pending',
        })}
        {...base}
      />,
    );
    expect(container.querySelector('script')).toBeNull();
    // The literal text is present (escaped), proving it rendered as text.
    expect(container.textContent).toContain('<script>alert(1)</script>-1.1');
  });

  it('sec_info_disclosure_no_dangerously_set_inner_html: source clean', () => {
    expect(heroSource()).not.toMatch(/dangerouslySetInnerHTML/);
  });

  // ── Accessibility ─────────────────────────────────────────────────────
  it('a11y_hero_heading_labelledby: section labelled by single h1', () => {
    const { container } = render(
      <Hero liveStatus="unknown" session={null} {...base} />,
    );
    const sectionEl = container.querySelector('section');
    const labelledBy = sectionEl?.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const heading = container.querySelector('h1');
    expect(heading?.getAttribute('id')).toBe(labelledBy);
    expect(container.querySelectorAll('h1')).toHaveLength(1);
  });

  it('a11y_stat_tiles_dl_semantics: dl with 3 dt + 3 dd', () => {
    const { container } = render(
      <Hero liveStatus="unknown" session={null} {...base} />,
    );
    expect(container.querySelector('dl')).toBeInTheDocument();
    expect(container.querySelectorAll('dt')).toHaveLength(3);
    expect(container.querySelectorAll('dd')).toHaveLength(3);
  });

  it('a11y_what_is_this_link_accessible_name: link reachable by role+name', () => {
    render(<Hero liveStatus="unknown" session={null} {...base} />);
    expect(
      screen.getByRole('link', { name: /what is this/i }),
    ).toBeInTheDocument();
  });

  // ── Infrastructure (source sentinels) ─────────────────────────────────
  it('infra_no_use_client_directive: Hero is an RSC', () => {
    expect(heroSource()).not.toMatch(/^\s*['"]use client['"]/m);
  });

  it('infra_live_status_import_source: LiveStatus from derive-live-status, not schemas', () => {
    const src = heroSource();
    // LiveStatus must come from the canonical home (1.4 knowledge decision).
    expect(src).toMatch(
      /import\s+type\s+\{[^}]*\bLiveStatus\b[^}]*\}\s+from\s+['"]@\/lib\/build-log\/derive-live-status['"]/,
    );
    // And must NOT be imported from the schemas barrel (it isn't exported there).
    expect(src).not.toMatch(
      /import\s+type\s+\{[^}]*\bLiveStatus\b[^}]*\}\s+from\s+['"]@\/content\/schemas['"]/,
    );
  });

  it('infra_no_rounded_class: brand sharp-corner discipline', () => {
    expect(heroSource()).not.toMatch(/\brounded\b/);
  });

  it('infra_source_uses_brand_color_tokens: references --color- tokens', () => {
    expect(heroSource()).toMatch(/--color-/);
  });

  // ── Edge cases ────────────────────────────────────────────────────────
  it('edge_state_null_session_unknown: null session renders zeros, no throw', () => {
    expect(() =>
      render(<Hero liveStatus="unknown" session={null} {...base} />),
    ).not.toThrow();
    // three zero tiles
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('edge_state_zero_stats: empty pipeline → all tiles 0', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({ completedSections: [] })}
        rollup={[]}
        worktrees={[]}
        nowIso={NOW}
      />,
    );
    expect(screen.getAllByText('0')).toHaveLength(3);
  });

  it('edge_state_worktrees_boundary_one_vs_two: singular vs plural', () => {
    const { rerender } = render(
      <Hero
        liveStatus="active"
        session={session({ currentSection: 'q-1.1', currentAgent: 'green' })}
        rollup={[]}
        worktrees={[wt('q-1.1')]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/an AI agent is/i)).toBeInTheDocument();

    rerender(
      <Hero
        liveStatus="active"
        session={session({ currentSection: 'q-1.1', currentAgent: 'green' })}
        rollup={[]}
        worktrees={[wt('q-1.1'), wt('r-1.1')]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/2 AI agents are working/i)).toBeInTheDocument();
  });

  it('edge_input_string_form_completed_sections: counts shipped, 0 tests', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({
          completedSections: [{ section: 'a', tests: 10 }, 'c-string-form'],
        })}
        {...base}
      />,
    );
    expect(screen.getByText('2')).toBeInTheDocument(); // shipped counts string entry
    expect(screen.getByText('10')).toBeInTheDocument(); // tests = 10 (string adds 0)
  });

  it('edge_input_active_missing_current_agent: falls back to "working"', () => {
    render(
      <Hero
        liveStatus="active"
        session={session({ currentSection: 'm-1.1' })}
        rollup={[]}
        worktrees={[wt('m-1.1')]}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/an AI agent is working for m-1\.1/i)).toBeInTheDocument();
  });

  // ── Error recovery ────────────────────────────────────────────────────
  it('err_stale_data_garbage_current_agent: unknown agent → working, no throw', () => {
    expect(() =>
      render(
        <Hero
          liveStatus="active"
          session={session({
            currentSection: 'g-1.1',
            currentAgent: 'not-a-real-phase',
          })}
          rollup={[]}
          worktrees={[wt('g-1.1')]}
          nowIso={NOW}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText(/an AI agent is working for g-1\.1/i)).toBeInTheDocument();
  });

  it('err_partial_failure_idle_no_completed_at: idle without timestamp', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({ completedSections: [{ section: 'a', tests: 1 }] })}
        {...base}
      />,
    );
    // No completedAt anywhere → plain idle sentence, no "Last shipped" fragment.
    expect(screen.getByText(/the pipeline is idle\./i)).toBeInTheDocument();
    expect(screen.queryByText(/last shipped/i)).toBeNull();
  });

  // ── Data integrity ────────────────────────────────────────────────────
  it('data_consistency_tests_written_detailed_only: sum numeric tests only', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({
          completedSections: [
            { section: 'a', tests: 10 },
            { section: 'b', tests: 20 },
            'c-string-form',
          ],
        })}
        {...base}
      />,
    );
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('data_consistency_shipped_counts_all_kinds: length includes string-form', () => {
    render(
      <Hero
        liveStatus="idle"
        session={session({
          completedSections: ['legacy-1.1', { section: 'a', tests: 5 }, 'legacy-1.2'],
        })}
        {...base}
      />,
    );
    expect(screen.getByText('3')).toBeInTheDocument(); // shipped = 3 regardless of kind
  });
});
