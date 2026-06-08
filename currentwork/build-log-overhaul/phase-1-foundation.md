# Phase 1: Foundation utilities

**Total Size: S + S + M + S**
**Prerequisites:** None — operates on existing schemas and existing pipeline state files. `zod` already installed via `build-in-public-docs`.
**New Types:** `PhaseName`, `LiveStatus`, `CompletedSectionEntry`, `SessionStatus.concurrentJobs?`
**New Files:** `src/lib/build-log/phase-labels.ts`, `relative-time.ts`, `derive-live-status.ts` (+ co-located tests). `src/content/schemas/build-log.ts` and `validators.ts` extended.

Phase 1 ships no visible UI. It establishes the pure-function foundation every
later phase composes against: a single source of truth for phase-name copy
(1.1), an SSR-safe relative-time formatter (1.2), the state-machine that
decides what the Hero says (1.3), and the schema tightening that makes the
`completedSections` array safe to drill into without `typeof` guards in every
consumer (1.4). All four are exhaustively unit-tested before any component
sees them. After this phase ships, every input to the Hero is a pure function
of `(session, worktrees, completedSections, nowIso)` — no `Date.now()` inside
components, no `any`-typed entries leaking into JSX.

The four sections are independent except for 1.3 → 1.1 (1.3 imports the
`PhaseName` branded type for its `'paused'` check). 1.1, 1.2, and 1.4 can run
in parallel.

---

## Feature 1.1: Phase labels + canonical ordering

**Complexity: S** — One file: a frozen `PHASE_ORDER` tuple, a `PHASE_LABELS` const map, a `phaseLabel(name)` accessor, and a `PhaseName` branded type derived from the tuple.

### Problem

Today, the layperson-friendly phase names (`Researching the change`, `Writing
the tests`, etc.) don't exist anywhere — the only phase names in code are the
raw internal strings (`discovery`, `red`, `green`, `refactor`, `finish`,
`release`, `preflight`/`postflight`) that the pipeline skills write into
`session.yaml` and `beats.yaml`. The Hero (3.1), the PipelineExplainer (3.2),
the PhaseStepper (2.1), and the LiveWorktreesPanel (3.4) all need the same
internal→friendly mapping. Inlining it four times invites drift; centralizing
it in `phase-labels.ts` gives the brand-voice copy one place to evolve.

### Implementation

**NEW** `src/lib/build-log/phase-labels.ts`:

```ts
/**
 * Canonical ordering of the seven TDD pipeline phases as they appear left-to-right
 * in the PhaseStepper. Source of truth — every PhaseName must appear here exactly once.
 */
export const PHASE_ORDER = [
  'preflight',
  'discovery',
  'red',
  'green',
  'refactor',
  'finish',
  'release',
] as const;

export type PhaseName = (typeof PHASE_ORDER)[number];

/**
 * Layperson-friendly label for each phase. Tense matches inline use in the Hero
 * sentence "Right now an AI agent is {label.toLowerCase()} for {section-id}."
 */
export const PHASE_LABELS: Readonly<Record<PhaseName, string>> = Object.freeze({
  preflight: 'Running safety checks',
  discovery: 'Researching the change',
  red: 'Writing the tests',
  green: 'Making the tests pass',
  refactor: 'Polishing the code',
  finish: 'Shipping it',
  release: 'Merging to main',
});

/**
 * Accessor that returns the friendly label or, for unknown phase names
 * (e.g. a future phase the agents add before this file is updated), the raw
 * input as a fallback. Never throws — render layer must remain tolerant.
 */
export function phaseLabel(name: string | null | undefined): string {
  if (!name) return '';
  if ((PHASE_ORDER as readonly string[]).includes(name)) {
    return PHASE_LABELS[name as PhaseName];
  }
  return name;
}

/**
 * Type guard. Useful in `deriveLiveStatus` and consumers that narrow a raw
 * `session.current_agent` string before reaching for `PHASE_LABELS`.
 */
export function isPhaseName(value: string | null | undefined): value is PhaseName {
  return !!value && (PHASE_ORDER as readonly string[]).includes(value);
}
```

**NEW** `src/lib/build-log/__tests__/phase-labels.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import {
  PHASE_ORDER,
  PHASE_LABELS,
  phaseLabel,
  isPhaseName,
} from '../phase-labels';

describe('phase-labels', () => {
  it('PHASE_ORDER and PHASE_LABELS cover the same keys exactly', () => {
    const labelKeys = Object.keys(PHASE_LABELS).sort();
    const orderKeys = [...PHASE_ORDER].sort();
    expect(labelKeys).toEqual(orderKeys);
  });

  it.each([...PHASE_ORDER])('phaseLabel(%s) returns the mapped label', (name) => {
    expect(phaseLabel(name)).toBe(PHASE_LABELS[name]);
  });

  it('phaseLabel returns the raw input for unknown phase names', () => {
    expect(phaseLabel('hypothetical-future-phase')).toBe('hypothetical-future-phase');
  });

  it('phaseLabel returns empty string for null/undefined/empty', () => {
    expect(phaseLabel(null)).toBe('');
    expect(phaseLabel(undefined)).toBe('');
    expect(phaseLabel('')).toBe('');
  });

  it('isPhaseName narrows correctly', () => {
    expect(isPhaseName('green')).toBe(true);
    expect(isPhaseName('bogus')).toBe(false);
    expect(isPhaseName(null)).toBe(false);
  });
});
```

### Design Decisions

- **One file, no barrel re-export.** `src/lib/build-log/phase-labels.ts` is
  imported directly by every consumer. There's no `src/lib/build-log/index.ts`
  barrel today and adding one for one module is premature abstraction.
- **`as const` tuple, not `enum`.** Branded union types via `as const` produce
  cleaner narrowing and serialization than TS `enum`. The project already uses
  `as const` for `ContentTier` / `ContentPillar` (`src/content/schemas/`).
- **Lowercase verb form in labels.** "Making the tests pass" reads correctly
  in the Hero's inline sentence: "Right now an AI agent is making the tests
  pass." The Stepper renders title-case via CSS `text-transform: capitalize`
  on the label cell.
- **`phaseLabel` never throws.** A future phase added by the pipeline skills
  before this file is updated will pass through as raw text. Render-layer
  tolerance > strict typing — the build log must stay rendering even when the
  data layer leaks new strings.
- **`isPhaseName` separate from `phaseLabel`.** The two helpers serve different
  consumers: `phaseLabel` is for displaying, `isPhaseName` is for narrowing
  before downstream logic (used by `deriveLiveStatus` in 1.3).

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/lib/build-log/phase-labels.ts`                        |
| NEW    | `src/lib/build-log/__tests__/phase-labels.test.ts`         |

---

## Feature 1.2: Relative-time formatter

**Complexity: S** — One pure function (`formatRelativeTime`) that takes two ISO strings and returns a layperson-friendly relative timestamp. No `Date.now()`, no client-side rendering surprises.

### Problem

The Hero, the JobCard's "last shipped X ago" line, and the RecentActivity
feed all need to render relative timestamps. SSR + `dynamic = 'force-dynamic'`
means every render captures a `nowIso` once at the top of the page and threads
it down — calling `Date.now()` inside a component would produce nondeterministic
output across SSR ↔ hydration. A pure `formatRelativeTime(iso, nowIso)` that
takes both timestamps as inputs keeps the renderer deterministic and unit-testable.

### Implementation

**NEW** `src/lib/build-log/relative-time.ts`:

```ts
/**
 * Pure relative-time formatter. Takes two ISO 8601 strings — the timestamp to
 * format and the "now" reference — and returns a layperson-friendly string:
 *
 *   < 1 min   → "just now"
 *   < 1 hour  → "Nm ago"
 *   < 1 day   → "Nh ago"
 *   < 2 days  → "yesterday"
 *   < 30 days → "N days ago" or "N weeks ago" (>= 14 days)
 *   ≥ 30 days → "on YYYY-MM-DD"
 *
 * Returns empty string for invalid inputs; never throws.
 *
 * Both args are ISO strings so the function is SSR-safe and trivially
 * unit-testable without mocking Date.now().
 */
export function formatRelativeTime(iso: string | null | undefined, nowIso: string): string {
  if (!iso || !nowIso) return '';

  const target = Date.parse(iso);
  const now = Date.parse(nowIso);
  if (Number.isNaN(target) || Number.isNaN(now)) return '';

  const deltaMs = now - target;

  // Future timestamps (clock skew, hand-built fixture, etc.) — degrade to "just now".
  if (deltaMs < 0) return 'just now';

  const seconds = Math.floor(deltaMs / 1000);
  if (seconds < 60) return 'just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 14) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;

  // Past 30 days — fall back to absolute date in YYYY-MM-DD (ISO date portion).
  return `on ${iso.slice(0, 10)}`;
}
```

**NEW** `src/lib/build-log/__tests__/relative-time.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { formatRelativeTime } from '../relative-time';

const NOW = '2026-06-07T12:00:00Z';

describe('formatRelativeTime', () => {
  it.each([
    ['2026-06-07T11:59:30Z', 'just now'],   // 30s ago
    ['2026-06-07T11:57:00Z', '3m ago'],
    ['2026-06-07T10:00:00Z', '2h ago'],
    ['2026-06-06T12:00:00Z', 'yesterday'],
    ['2026-06-04T12:00:00Z', '3 days ago'],
    ['2026-05-24T12:00:00Z', '2 weeks ago'],
    ['2026-05-01T00:00:00Z', 'on 2026-05-01'],
  ])('formats %s as "%s"', (iso, expected) => {
    expect(formatRelativeTime(iso, NOW)).toBe(expected);
  });

  it('returns "just now" for future timestamps (clock skew)', () => {
    expect(formatRelativeTime('2026-06-07T12:00:30Z', NOW)).toBe('just now');
  });

  it('returns empty string for invalid inputs', () => {
    expect(formatRelativeTime('', NOW)).toBe('');
    expect(formatRelativeTime(null, NOW)).toBe('');
    expect(formatRelativeTime('not-a-date', NOW)).toBe('');
    expect(formatRelativeTime(NOW, 'not-a-date')).toBe('');
  });
});
```

### Design Decisions

- **Both timestamps as args.** Calling `Date.now()` inside the function would
  destroy testability and make every test mock-out `vi.useFakeTimers()`.
  Passing `nowIso` from the page-level render lets one fixture date drive every
  test.
- **No `Intl.RelativeTimeFormat`.** It produces locale-aware copy ("3 minutes
  ago") that varies by viewer locale and would create SSR ↔ hydration mismatches
  on a project that doesn't otherwise care about i18n. Hand-rolled output is
  deterministic and matches the brand-voice ("3m ago", not "3 minutes ago").
- **`yesterday` cutoff at exactly 1 day.** Matches viewer intuition — anything
  more nuanced ("13 hours ago" vs "yesterday") looks pedantic. The Hero's
  inline sentence reads cleanly either way.
- **Weeks at 14+ days.** "2 weeks ago" reads better than "14 days ago" once
  past two weeks; the 14d threshold avoids "1 week ago" overlapping with the
  "N days ago" copy below.
- **`on YYYY-MM-DD` past 30 days.** Beyond a month, relative time stops being
  useful — absolute date is the natural fall-back. Slicing the input ISO is
  intentional: no `new Date(iso).toISOString()` round-trip, which would risk
  TZ drift for offset timestamps like `2026-05-01T12:00:00-05:00`.
- **Empty string for invalid input.** A render-mid bug where a missing
  timestamp turns into "NaN-NaN-NaN ago" is worse than rendering nothing.
  Callers should treat empty string as "no timestamp to show" and conditionally
  render the wrapper element.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/lib/build-log/relative-time.ts`                       |
| NEW    | `src/lib/build-log/__tests__/relative-time.test.ts`        |

---

## Feature 1.3: Derive live status

**Complexity: M** — One pure function `deriveLiveStatus({ session, worktrees, completedSections, nowIso })` returning a `LiveStatus` union. The decision tree has five branches plus an `'unknown'` fallback, and threshold constants are tunable in-module.

### Problem

The Hero (3.1) needs to pick from at least five rendering branches depending on
the pipeline state: live agent running, paused waiting for human input, idle
(recently shipped, no current work), stale (no activity for days), or
unknown (parse failure). Burying that decision tree in the JSX makes the Hero
untestable in isolation. Extracting it as a pure function lets one fixture per
state drive Hero rendering and lets the state machine itself have exhaustive
tests.

The decision tree:

```
'unknown'  if session is null or threw during parse
'active'   if any worktree exists AND session.currentSection matches one
'paused'   if currentAgent === 'pending' OR currentStage endsWith '-failed'
'idle'     if no worktrees, currentSection empty, most-recent
           completedSection within 24h
'stale'    if no worktrees, currentSection empty, no completion in last 72h
           (or never)
```

### Implementation

**NEW** `src/lib/build-log/derive-live-status.ts`:

```ts
import type { SessionStatus, CompletedSectionEntry } from '@/content/schemas';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';
import { isPhaseName } from '@/lib/build-log/phase-labels';
import { toEntry } from '@/lib/build-log/normalize';

export type LiveStatus = 'active' | 'idle' | 'paused' | 'stale' | 'unknown';

/**
 * Idle vs stale threshold — anything more recent than this is "idle", anything
 * older (or never) tips to "stale". Tunable at this constant; both are
 * intentionally generous to avoid "stale" copy appearing during overnight
 * recordings or weekend pauses.
 */
const IDLE_WINDOW_HOURS = 24;
const STALE_WINDOW_HOURS = 72;

interface DeriveInput {
  session: SessionStatus | null;
  worktrees: readonly LiveWorktree[];
  completedSections: readonly CompletedSectionEntry[];
  nowIso: string;
}

export function deriveLiveStatus({
  session,
  worktrees,
  completedSections,
  nowIso,
}: DeriveInput): LiveStatus {
  if (!session) return 'unknown';

  // 'paused' takes precedence over 'active' — a pending agent or a failed
  // stage means the worktree may exist but no agent is doing work.
  const stageRaw = session.currentStage ?? '';
  if (session.currentAgent === 'pending' || stageRaw.endsWith('-failed')) {
    return 'paused';
  }

  if (worktrees.length > 0 && !!session.currentSection) {
    const hasMatch = worktrees.some((w) => w.sectionId === session.currentSection);
    if (hasMatch) return 'active';
  }

  // No live worktree and no current section — figure out idle vs stale by
  // age of the most-recent completed section that carries a timestamp.
  if (!session.currentSection && worktrees.length === 0) {
    const mostRecentMs = mostRecentCompletedAt(completedSections);
    if (mostRecentMs === null) return 'stale';

    const now = Date.parse(nowIso);
    if (Number.isNaN(now)) return 'stale';

    const ageHours = (now - mostRecentMs) / (1000 * 60 * 60);
    if (ageHours <= IDLE_WINDOW_HOURS) return 'idle';
    if (ageHours <= STALE_WINDOW_HOURS) return 'idle';
    return 'stale';
  }

  // Fallback — session has a currentSection but no matching worktree
  // (race during pipeline transition). Treat as idle rather than misleading
  // viewers with "active" copy.
  return 'idle';
}

function mostRecentCompletedAt(
  entries: readonly CompletedSectionEntry[],
): number | null {
  let max: number | null = null;
  for (const raw of entries) {
    const entry = toEntry(raw);
    if (entry.kind !== 'detailed' || !entry.completedAt) continue;
    const ms = Date.parse(entry.completedAt);
    if (Number.isNaN(ms)) continue;
    if (max === null || ms > max) max = ms;
  }
  return max;
}

// Re-export thresholds for tests + documentation.
export const _thresholds = { IDLE_WINDOW_HOURS, STALE_WINDOW_HOURS };
```

**NEW** `src/lib/build-log/__tests__/derive-live-status.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { deriveLiveStatus } from '../derive-live-status';

const NOW = '2026-06-07T12:00:00Z';

const baseSession = {
  id: '2026-06-07-001',
  completedSections: [],
} as const;

describe('deriveLiveStatus', () => {
  it("returns 'unknown' when session is null", () => {
    expect(
      deriveLiveStatus({ session: null, worktrees: [], completedSections: [], nowIso: NOW }),
    ).toBe('unknown');
  });

  it("returns 'paused' when currentAgent is 'pending'", () => {
    expect(
      deriveLiveStatus({
        session: { ...baseSession, currentAgent: 'pending' },
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('paused');
  });

  it("returns 'paused' when currentStage ends in '-failed'", () => {
    expect(
      deriveLiveStatus({
        session: { ...baseSession, currentStage: 'green-failed' },
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('paused');
  });

  it("returns 'active' when a worktree matches session.currentSection", () => {
    expect(
      deriveLiveStatus({
        session: { ...baseSession, currentSection: 'build-log-overhaul-1.2' },
        worktrees: [{ sectionId: 'build-log-overhaul-1.2' } as never],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('active');
  });

  it("returns 'idle' when no work, last shipped within 24h", () => {
    expect(
      deriveLiveStatus({
        session: { ...baseSession },
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-07T08:00:00Z' },
        ],
        nowIso: NOW,
      }),
    ).toBe('idle');
  });

  it("returns 'stale' when no work and last shipped over 72h ago", () => {
    expect(
      deriveLiveStatus({
        session: { ...baseSession },
        worktrees: [],
        completedSections: [
          { section: 'foo-1.1', completedAt: '2026-06-01T00:00:00Z' },
        ],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });

  it("returns 'stale' when no completed_sections at all", () => {
    expect(
      deriveLiveStatus({
        session: { ...baseSession },
        worktrees: [],
        completedSections: [],
        nowIso: NOW,
      }),
    ).toBe('stale');
  });
});
```

### Design Decisions

- **Inputs are dumb objects, not loaders.** `deriveLiveStatus` does not call
  any loader. The page builds the input record once and threads it down,
  enabling fixture-driven tests with no MSW or filesystem mocks.
- **'paused' precedence over 'active'.** A `'pending'` agent or a `'-failed'`
  stage suffix means the worktree may still exist on disk but the pipeline is
  waiting on a human or a fix. Saying "active" in that state would lie.
- **Strict match on `sectionId`.** Worktree presence alone isn't enough —
  multiple worktrees can exist concurrently (per `concurrent_jobs`); only the
  one whose sectionId matches `session.currentSection` is the primary active
  work. Plural-agent variants are handled separately in the Hero copy via
  `worktrees.length > 1`, not in this state machine.
- **24h / 72h as in-module constants.** Re-exported as `_thresholds` for tests
  and easy tuning. The leading underscore signals "internal — do not import
  in production code".
- **`mostRecentCompletedAt` ignores `minimal`-kind entries.** Old completed
  sections backfilled before timestamp tracking was added are string-only and
  have no `completedAt`; they shouldn't affect the live-status decision.
- **Fallback to `'idle'` rather than `'unknown'`.** When `session.currentSection`
  is set but no worktree matches (mid-pipeline transition race), the right
  read is "idle for a moment" rather than "we have no idea what's going on"
  — the latter is reserved for parse failures.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/lib/build-log/derive-live-status.ts`                  |
| NEW    | `src/lib/build-log/__tests__/derive-live-status.test.ts`   |

---

## Feature 1.4: Schema additions

**Complexity: S** — Two small additions to `src/content/schemas/build-log.ts` and matching Zod schema updates in `validators.ts`: a `concurrentJobs?` field on `SessionStatus`, and a tightened `CompletedSectionEntry` discriminated union plus the `LiveStatus` type.

### Problem

`SessionStatus.completedSections` is typed `readonly (string | { section: string;
completedAt?: string })[]`. That works for the existing flat list rendering but
forces every richer consumer to inline `typeof entry === 'string' ? ... : ...`
checks. The real YAML carries far more (commit hash, commit message, test
count, files-new/files-modified, notes prose, pushed boolean). RecentActivity
(3.3) needs to drill in confidently; the loose type makes that ugly.

Separately, `session.concurrent_jobs` exists in the YAML (currently `[]`) but
is not mirrored in `SessionStatus`. The Hero's plural-agent variant needs it.

### Implementation

**MODIFY** `src/content/schemas/build-log.ts` — extend `SessionStatus`, add
`CompletedSectionEntry` discriminated union, add `LiveStatus`:

```ts
export type LiveStatus = 'active' | 'idle' | 'paused' | 'stale' | 'unknown';

/**
 * Detailed entry — the shape `/finish` writes for every completed section.
 * Fields beyond `id` are optional because backfilled / historical entries
 * may omit them; the kind discriminator is set during normalization
 * (see `src/lib/build-log/normalize.ts`).
 */
export interface DetailedCompletedSection {
  kind: 'detailed';
  id: string;
  name?: string;
  completedAt?: string;
  commitHash?: string;
  commitMessage?: string;
  tests?: number;
  filesNew?: number;
  filesModified?: number;
  pushed?: boolean;
  notes?: string;
}

/**
 * Minimal entry — what string-only legacy entries normalize to. Carries only
 * the section id; consumers degrade their UI accordingly.
 */
export interface MinimalCompletedSection {
  kind: 'minimal';
  id: string;
}

export type CompletedSectionEntry = DetailedCompletedSection | MinimalCompletedSection;

export interface SessionStatus {
  id: string;
  startedAt?: string;
  currentPhase?: string;
  currentSection?: string;
  currentAgent?: string;
  currentStage?: string;
  /** Mirror of session.concurrent_jobs — empty array when no concurrent work. */
  concurrentJobs?: readonly string[];
  contextWindow?: {
    iteration?: number;
    totalItems?: number;
    completedItems?: number;
  };
  /**
   * Raw entries as they appear in the YAML — keep the union of string +
   * legacy-object shapes here for backward compatibility. Use `toEntry()`
   * from `src/lib/build-log/normalize.ts` to get a discriminated union.
   */
  completedSections: readonly (
    | string
    | {
        section: string;
        completedAt?: string;
        commit_hash?: string;
        commit_message?: string;
        tests?: number;
        files_new?: number;
        files_modified?: number;
        pushed?: boolean;
        notes?: string;
        name?: string;
      }
  )[];
  notes?: string;
}
```

**MODIFY** `src/content/schemas/validators.ts` — extend the `SessionStatus`
Zod schema. The raw shape stays loose (mirrors YAML); normalization is a
runtime-only concern.

```ts
// Inside SessionStatusSchema:
concurrentJobs: z.array(z.string()).optional(),
completedSections: z.array(
  z.union([
    z.string(),
    z.object({
      section: z.string(),
      completedAt: z.string().optional(),
      commit_hash: z.string().optional(),
      commit_message: z.string().optional(),
      tests: z.number().optional(),
      files_new: z.number().optional(),
      files_modified: z.number().optional(),
      pushed: z.boolean().optional(),
      notes: z.string().optional(),
      name: z.string().optional(),
    }).passthrough(),
  ]),
),
```

(`.passthrough()` preserves unknown future keys so a `/finish` skill upgrade
that writes a new field doesn't fail validation here.)

**MODIFY** `src/content/schemas/__tests__/validators.test.ts` — add cases:

```ts
it('SessionStatusSchema accepts concurrentJobs', () => {
  const parsed = SessionStatusSchema.parse({
    id: 'test',
    completedSections: [],
    concurrentJobs: ['build-log-overhaul-3.2'],
  });
  expect(parsed.concurrentJobs).toEqual(['build-log-overhaul-3.2']);
});

it('SessionStatusSchema accepts string-form completedSections', () => {
  expect(() =>
    SessionStatusSchema.parse({
      id: 'test',
      completedSections: ['section-1.1', 'section-1.2'],
    }),
  ).not.toThrow();
});

it('SessionStatusSchema accepts detailed completedSections with snake_case fields', () => {
  expect(() =>
    SessionStatusSchema.parse({
      id: 'test',
      completedSections: [{
        section: 'foo-1.1',
        completedAt: '2026-06-07T00:00:00Z',
        commit_hash: 'abc1234',
        tests: 42,
        files_new: 3,
        files_modified: 5,
        pushed: true,
        notes: 'shipped clean',
      }],
    }),
  ).not.toThrow();
});

it('SessionStatusSchema preserves unknown keys via .passthrough()', () => {
  const parsed = SessionStatusSchema.parse({
    id: 'test',
    completedSections: [{
      section: 'foo-1.1',
      futureFieldNobodyKnowsAbout: 'lol',
    }],
  });
  expect((parsed.completedSections[0] as Record<string, unknown>).futureFieldNobodyKnowsAbout).toBe('lol');
});
```

### Design Decisions

- **Keep the raw union loose, normalize in lib.** The Zod schema mirrors the
  YAML — both legacy strings and the detailed snake_case object live alongside
  each other in the wild. A `toEntry(raw): CompletedSectionEntry` normalizer
  (built in 2.3) is the only place case conversion happens. This avoids forcing
  every consumer to handle snake_case OR camelCase OR string shape — just
  detailed-vs-minimal at the boundary.
- **Discriminated union with `kind` tag.** TS prefers tag-based narrowing over
  structural narrowing for readability; `entry.kind === 'detailed'` reads better
  than `'completedAt' in entry`.
- **`LiveStatus` in `build-log.ts`, not `derive-live-status.ts`.** The type is
  consumed by `<Hero>` (3.1) which needs to pattern-match on it; the function
  that produces it lives in lib. Keeping the type with the schema means
  consumers import from one canonical location.
- **`concurrentJobs?` optional.** The YAML always has the field today (empty
  array), but treating it as optional in the schema lets older
  `session.yaml` snapshots (or fresh-init sessions where the field hasn't been
  written) parse without manual migration.
- **`.passthrough()` for forward compat.** `/finish` may grow new fields
  (e.g. `coverage_delta`); stripping them would lose data the schema doesn't
  know about yet. Passthrough on the inner object only — outer schema stays
  strict.
- **No new file.** All changes go into existing `build-log.ts` /
  `validators.ts` to keep the schema barrel one-import.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| MODIFY | `src/content/schemas/build-log.ts`                         |
| MODIFY | `src/content/schemas/validators.ts`                        |
| MODIFY | `src/content/schemas/__tests__/validators.test.ts`         |
