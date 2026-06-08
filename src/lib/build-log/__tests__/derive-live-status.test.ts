// derive-live-status helper (build-log-overhaul-1.3) — pure state-machine
// returning the LiveStatus union the Hero (3.1) renders from. Inputs are dumb
// objects threaded from the page-level loader; no Date.now(), no IO. Decision
// tree (in precedence order): null session → 'unknown'; pending agent OR
// stage ends '-failed' → 'paused'; worktree matches currentSection → 'active';
// no work + within 72h since last completion → 'idle'; older or never → 'stale';
// session.currentSection set but no matching worktree (mid-pipeline race) → 'idle'.

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  deriveLiveStatus,
  _thresholds,
  type LiveStatus,
} from '../derive-live-status';
import type { SessionStatus } from '@/content/schemas';
import type { LiveWorktree } from '../worktree-state';

const NOW = '2026-06-07T12:00:00Z';
const NOW_MS = Date.parse(NOW);

function makeSession(overrides: Partial<SessionStatus> = {}): SessionStatus {
  return {
    id: '2026-06-07-test',
    completedSections: [],
    ...overrides,
  };
}

function makeWorktree(sectionId: string): LiveWorktree {
  return {
    sectionId,
    slotPath: `/tmp/section-${sectionId}`,
    branch: `section/${sectionId}`,
  };
}

describe('deriveLiveStatus (build-log-overhaul-1.3)', () => {
  // ───────────────────────────────────────────────────────────────
  // Unit — decision tree branch coverage
  // ───────────────────────────────────────────────────────────────

  it('unit_unknown_session_null: returns "unknown" when session is null', () => {
    expect(
      deriveLiveStatus({
        session: null,
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('unknown');
  });

  it('unit_paused_agent_pending: returns "paused" when session.currentAgent === "pending"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentAgent: 'pending' }),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('paused');
  });

  it('unit_paused_stage_ends_failed: returns "paused" when currentStage endsWith "-failed"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentStage: 'green-failed' }),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('paused');
  });

  it('unit_paused_precedence_over_active: pending agent + matching worktree → paused, not active', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({
          currentAgent: 'pending',
          currentSection: 'foo-1.1',
        }),
        worktrees: [makeWorktree('foo-1.1')],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('paused');
  });

  it('unit_active_single_worktree_match: returns "active" when one worktree matches currentSection', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentSection: 'build-log-overhaul-1.3' }),
        worktrees: [makeWorktree('build-log-overhaul-1.3')],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('active');
  });

  it('unit_active_multiple_worktrees_with_match: returns "active" when one of N worktrees matches currentSection (concurrent_jobs)', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentSection: 'foo-2.1' }),
        worktrees: [
          makeWorktree('bar-1.1'),
          makeWorktree('foo-2.1'),
          makeWorktree('baz-3.1'),
        ],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('active');
  });

  it('unit_idle_recent_completion_under_idle_window: 8h-ago completion + no work → "idle"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-07T04:00:00Z' }, // 8h ago
        ],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('unit_idle_between_idle_and_stale_window: 48h-ago completion → "idle" (generous-grace branch)', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-05T12:00:00Z' }, // 48h ago
        ],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('unit_stale_completion_past_stale_window: 96h-ago completion → "stale"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-03T12:00:00Z' }, // 96h ago
        ],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it('unit_stale_no_completed_sections: empty completedSections + no work → "stale"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it('unit_fallback_idle_currentSection_but_no_match: currentSection set, no worktree match → "idle" (race fallback)', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentSection: 'foo-1.1' }),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('unit_most_recent_picks_max_timestamp: mostRecent picks the MAX completedAt, order-independent', () => {
    // Three entries in random order — newest is 4h ago → 'idle'
    const result = deriveLiveStatus({
      session: makeSession(),
      worktrees: [],
      completedSections: [
        { section: 'old-1.1', completedAt: '2026-05-01T00:00:00Z' }, // ancient
        { section: 'newest-1.3', completedAt: '2026-06-07T08:00:00Z' }, // 4h ago
        { section: 'mid-1.2', completedAt: '2026-06-04T00:00:00Z' }, // ~84h ago
      ],
      nowIso: NOW,
    });
    expect(result).toBe('idle');
  });

  it('unit_thresholds_re_exported: _thresholds.IDLE_WINDOW_HOURS === 24 and _thresholds.STALE_WINDOW_HOURS === 72', () => {
    expect(_thresholds.IDLE_WINDOW_HOURS).toBe(24);
    expect(_thresholds.STALE_WINDOW_HOURS).toBe(72);
  });

  it('unit_live_status_union_values: LiveStatus accepts every documented variant at runtime', () => {
    const variants: LiveStatus[] = ['active', 'idle', 'paused', 'stale', 'unknown'];
    expect(variants).toHaveLength(5);
    expect(new Set(variants).size).toBe(5);
  });

  // ───────────────────────────────────────────────────────────────
  // Integration — actual session.yaml shape + cross-module wiring
  // ───────────────────────────────────────────────────────────────

  it('integration_real_session_yaml_shape: accepts a SessionStatus snapshot identical to the YAML shape today', () => {
    // Mirrors the real session.yaml: completedSections is an array of objects
    // with section/completedAt (and other fields the helper ignores).
    const realShape: SessionStatus = {
      id: '2026-06-08-real',
      startedAt: '2026-06-08T00:00:00Z',
      currentPhase: 'build-log-overhaul',
      currentSection: 'build-log-overhaul-1.3',
      currentAgent: 'red',
      currentStage: 'build-log-overhaul-1.3-discovery-complete',
      completedSections: [
        { section: 'build-log-overhaul-1.2', completedAt: '2026-06-08T00:00:00Z' },
        { section: 'build-log-overhaul-1.1', completedAt: '2026-06-07T00:00:00Z' },
      ],
    };
    const result = deriveLiveStatus({
      session: realShape,
      worktrees: [makeWorktree('build-log-overhaul-1.3')],
      completedSections: realShape.completedSections,
      nowIso: NOW,
    });
    expect(['active', 'idle', 'paused', 'stale', 'unknown']).toContain(result);
    expect(result).toBe('active');
  });

  it('integration_phase_labels_isPhaseName_import: module loads without error and exposes the LiveStatus + _thresholds surface (smokes the phase-labels dep wiring)', () => {
    // Loading the module + calling the function exercises the import graph;
    // a missing or mis-resolved phase-labels / worktree-state / schemas import
    // would throw before the assertion runs.
    expect(typeof deriveLiveStatus).toBe('function');
    expect(_thresholds).toBeDefined();
    expect(typeof _thresholds.IDLE_WINDOW_HOURS).toBe('number');
    expect(typeof _thresholds.STALE_WINDOW_HOURS).toBe('number');
  });

  // ───────────────────────────────────────────────────────────────
  // Infrastructure — file structure + SSR-safety + tunability sentinels
  // ───────────────────────────────────────────────────────────────

  it('infra_derive_live_status_file_exists: src/lib/build-log/derive-live-status.ts exists and exports deriveLiveStatus + LiveStatus + _thresholds', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(
      repoRoot,
      'src/lib/build-log/derive-live-status.ts',
    );
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, 'utf-8');
    expect(source).toMatch(/export\s+function\s+deriveLiveStatus\b/);
    expect(source).toMatch(/export\s+type\s+LiveStatus\b/);
    expect(source).toMatch(/export\s+const\s+_thresholds\b/);
  });

  it('infra_no_barrel_re_export: src/lib/build-log/index.ts does NOT exist (no barrel per planning §1.1 design decision)', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const barrelPath = path.join(repoRoot, 'src/lib/build-log/index.ts');
    expect(existsSync(barrelPath)).toBe(false);
  });

  it('infra_no_date_now_in_source: derive-live-status.ts contains no Date.now() / bare-new-Date() calls (SSR-safety; all temporal data flows via nowIso input)', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(
      repoRoot,
      'src/lib/build-log/derive-live-status.ts',
    );
    const source = readFileSync(sourcePath, 'utf-8');
    expect(source).not.toMatch(/Date\.now\s*\(/);
    // Allow `new Date(arg)` (parsing a passed-in arg) but forbid bare `new Date()`.
    expect(source).not.toMatch(/new\s+Date\s*\(\s*\)/);
  });

  it('infra_threshold_constants_present: derive-live-status.ts source declares IDLE_WINDOW_HOURS = 24 and STALE_WINDOW_HOURS = 72 module-level constants', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(
      repoRoot,
      'src/lib/build-log/derive-live-status.ts',
    );
    const source = readFileSync(sourcePath, 'utf-8');
    expect(source).toMatch(/IDLE_WINDOW_HOURS\s*=\s*24\b/);
    expect(source).toMatch(/STALE_WINDOW_HOURS\s*=\s*72\b/);
  });

  it('infra_type_only_imports: derive-live-status.ts imports SessionStatus + LiveWorktree as `import type` (no runtime dep on schemas / worktree-state at module load)', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(
      repoRoot,
      'src/lib/build-log/derive-live-status.ts',
    );
    const source = readFileSync(sourcePath, 'utf-8');
    // Both SessionStatus and LiveWorktree must arrive via `import type {...}`.
    expect(source).toMatch(
      /import\s+type\s+\{[^}]*SessionStatus[^}]*\}\s+from\s+['"]@\/content\/schemas['"]/,
    );
    expect(source).toMatch(
      /import\s+type\s+\{[^}]*LiveWorktree[^}]*\}\s+from\s+['"]\.\/worktree-state['"]/,
    );
  });

  // ───────────────────────────────────────────────────────────────
  // Edge cases — state / temporal / input
  // ───────────────────────────────────────────────────────────────

  it("edge_state_no_worktrees_and_no_session: null session dominates — 'unknown' even when worktrees and recent completions exist", () => {
    expect(
      deriveLiveStatus({
        session: null,
        worktrees: [makeWorktree('foo-1.1')],
        completedSections: [
          { section: 'recent-1.0', completedAt: '2026-06-07T11:30:00Z' },
        ],
        nowIso: NOW,
      }),
    ).toBe('unknown');
  });

  it('edge_state_multiple_worktrees_no_match: worktrees exist but none match → fallback "idle", not "active"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentSection: 'foo-1.1' }),
        worktrees: [makeWorktree('bar-2.1'), makeWorktree('baz-3.1')],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('edge_state_currentSection_empty_string: empty-string currentSection treated as absent (idle/stale path, NOT "active")', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentSection: '' }),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it('edge_temporal_24h_boundary_idle: completion exactly 24h ago (== IDLE_WINDOW_HOURS) → "idle" (inclusive)', () => {
    const exact24h = new Date(NOW_MS - 24 * 60 * 60 * 1000).toISOString();
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [{ section: 'foo-1.1', completedAt: exact24h }],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('edge_temporal_72h_boundary_idle: completion exactly 72h ago (== STALE_WINDOW_HOURS) → "idle" (inclusive; generous-grace)', () => {
    const exact72h = new Date(NOW_MS - 72 * 60 * 60 * 1000).toISOString();
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [{ section: 'foo-1.1', completedAt: exact72h }],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('edge_temporal_72h_plus_1ms_stale: completion 72h+1ms ago → "stale" (just past the boundary)', () => {
    const past72h = new Date(NOW_MS - 72 * 60 * 60 * 1000 - 1).toISOString();
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [{ section: 'foo-1.1', completedAt: past72h }],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it('edge_temporal_future_completion_treated_as_recent: future timestamp (clock skew) → negative age ≤ 72h → "idle"', () => {
    const future = new Date(NOW_MS + 60 * 60 * 1000).toISOString(); // 1h in the future
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [{ section: 'foo-1.1', completedAt: future }],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('edge_input_completedSections_all_string_entries: only legacy strings → mostRecent returns null → "stale"', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: ['legacy-1.1', 'legacy-1.2', 'legacy-1.3'],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it('edge_input_completedSections_mixed_string_and_object: object timestamp drives decision, string entries skipped', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          'legacy-1.1',
          { section: 'foo-1.2', completedAt: '2026-06-07T08:00:00Z' }, // 4h ago
          'legacy-1.3',
        ],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('edge_input_completedSections_object_without_completedAt: object missing completedAt → entry skipped (same as string)', () => {
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [{ section: 'foo-1.1' }],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it('edge_input_stage_failed_substring_not_match: currentStage with "-failed" as substring (not suffix) does NOT trigger "paused"', () => {
    // '-failed-recovered' contains '-failed' but does not END with it.
    expect(
      deriveLiveStatus({
        session: makeSession({ currentStage: '-failed-then-recovered' }),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).not.toBe('paused');
  });

  it('edge_input_currentAgent_pending_substring_not_match: currentAgent="pending-review" does NOT trigger "paused" — strict equality only', () => {
    expect(
      deriveLiveStatus({
        session: makeSession({ currentAgent: 'pending-review' }),
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).not.toBe('paused');
  });

  // ───────────────────────────────────────────────────────────────
  // Error recovery — total function, no throws
  // ───────────────────────────────────────────────────────────────

  it('err_invalid_nowiso_treats_as_stale: malformed nowIso → Date.parse NaN → "stale" (degraded, non-throwing)', () => {
    expect(() =>
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-07T11:00:00Z' },
        ],
        nowIso: 'not-a-date',
      }),
    ).not.toThrow();
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-07T11:00:00Z' },
        ],
        nowIso: 'not-a-date',
      }),
    ).toBe('stale');
  });

  it("err_malformed_completedAt_skipped: object with non-ISO completedAt → entry skipped, doesn't poison max", () => {
    // One malformed + one valid recent entry → valid timestamp drives decision.
    expect(
      deriveLiveStatus({
        session: makeSession(),
        worktrees: [],
        completedSections: [
          { section: 'bad-1.1', completedAt: 'not-a-date' },
          { section: 'good-1.2', completedAt: '2026-06-07T08:00:00Z' }, // 4h ago
        ],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it('err_function_never_throws: pathological-input matrix never throws (total function)', () => {
    const pathological: Array<Parameters<typeof deriveLiveStatus>[0]> = [
      { session: null, worktrees: [], completedSections: [], nowIso: '' },
      { session: null, worktrees: [], completedSections: [], nowIso: 'garbage' },
      {
        session: makeSession({
          currentAgent: 'pending',
          currentStage: 'green-failed',
          currentSection: '',
        }),
        worktrees: [],
        completedSections: ['x', { section: 'y' }, { section: 'z', completedAt: 'bad' }],
        nowIso: 'bad',
      },
      {
        session: makeSession(),
        worktrees: [makeWorktree('mystery')],
        completedSections: [],
        nowIso: NOW,
      },
    ];
    for (const input of pathological) {
      expect(() => deriveLiveStatus(input)).not.toThrow();
      const out = deriveLiveStatus(input);
      expect(['active', 'idle', 'paused', 'stale', 'unknown']).toContain(out);
    }
  });

  // ───────────────────────────────────────────────────────────────
  // Data integrity — purity, immutability, type invariant, SSR safety
  // ───────────────────────────────────────────────────────────────

  it('data_pure_function_determinism: identical inputs produce identical outputs across 50 invocations', () => {
    const input = {
      session: makeSession({ currentSection: 'foo-1.1' }),
      worktrees: [makeWorktree('foo-1.1')],
      completedSections: [
        { section: 'old-1.0', completedAt: '2026-06-06T12:00:00Z' },
      ],
      nowIso: NOW,
    };
    const outputs = Array.from({ length: 50 }, () => deriveLiveStatus(input));
    expect(new Set(outputs).size).toBe(1);
    expect(outputs[0]).toBe('active');
  });

  it('data_input_not_mutated: frozen inputs survive a call without mutation', () => {
    const session = Object.freeze(makeSession({ currentSection: 'foo-1.1' }));
    const worktrees = Object.freeze([Object.freeze(makeWorktree('foo-1.1'))]);
    const completedSections = Object.freeze([
      Object.freeze({
        section: 'old-1.0',
        completedAt: '2026-06-06T12:00:00Z',
      }),
    ]);
    expect(() =>
      deriveLiveStatus({
        session,
        worktrees,
        completedSections,
        nowIso: NOW,
      }),
    ).not.toThrow();
    // Re-invoke to assert no state leaked between calls
    expect(
      deriveLiveStatus({
        session,
        worktrees,
        completedSections,
        nowIso: NOW,
      }),
    ).toBe('active');
  });

  it('data_return_value_in_union: every code path returns a value in the LiveStatus union', () => {
    const fixtures: Array<{
      label: string;
      input: Parameters<typeof deriveLiveStatus>[0];
    }> = [
      {
        label: 'null session',
        input: { session: null, worktrees: [], completedSections: [], nowIso: NOW },
      },
      {
        label: 'paused agent',
        input: {
          session: makeSession({ currentAgent: 'pending' }),
          worktrees: [],
          completedSections: [],
          nowIso: NOW,
        },
      },
      {
        label: 'paused stage',
        input: {
          session: makeSession({ currentStage: 'red-failed' }),
          worktrees: [],
          completedSections: [],
          nowIso: NOW,
        },
      },
      {
        label: 'active',
        input: {
          session: makeSession({ currentSection: 'x-1.1' }),
          worktrees: [makeWorktree('x-1.1')],
          completedSections: [],
          nowIso: NOW,
        },
      },
      {
        label: 'idle recent',
        input: {
          session: makeSession(),
          worktrees: [],
          completedSections: [
            { section: 'x-1.0', completedAt: '2026-06-07T08:00:00Z' },
          ],
          nowIso: NOW,
        },
      },
      {
        label: 'stale ancient',
        input: {
          session: makeSession(),
          worktrees: [],
          completedSections: [
            { section: 'x-1.0', completedAt: '2026-01-01T00:00:00Z' },
          ],
          nowIso: NOW,
        },
      },
      {
        label: 'idle fallback (no match)',
        input: {
          session: makeSession({ currentSection: 'x-1.1' }),
          worktrees: [makeWorktree('y-2.1')],
          completedSections: [],
          nowIso: NOW,
        },
      },
    ];
    const allowed = new Set<LiveStatus>([
      'active',
      'idle',
      'paused',
      'stale',
      'unknown',
    ]);
    for (const { label, input } of fixtures) {
      const out = deriveLiveStatus(input);
      expect(allowed.has(out), `${label} returned non-union value: ${out}`).toBe(
        true,
      );
    }
  });

  it('data_ssr_hydration_safe: identical input across two calls (SSR + hydrate) returns byte-identical output', () => {
    const input = {
      session: makeSession(),
      worktrees: [],
      completedSections: [
        { section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z' },
      ],
      nowIso: NOW,
    };
    const ssr = deriveLiveStatus(input);
    const hydrate = deriveLiveStatus(input);
    expect(ssr).toBe(hydrate);
    expect(ssr).toBe('idle');
  });
});
