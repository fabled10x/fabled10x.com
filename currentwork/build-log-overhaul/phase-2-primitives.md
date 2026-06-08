# Phase 2: Display primitives

**Total Size: M + M + S**
**Prerequisites:** Phase 1 complete — `phase-labels.ts` (used by 2.1), `CompletedSectionEntry` discriminated union + `concurrentJobs` (used by 2.2's prop shape), validator updates (consumed by 2.3's normalizer).
**New Types:** None — all types defined in Phase 1.
**New Files:** `src/components/build-log/PhaseStepper.tsx`, `src/lib/build-log/normalize.ts`. `src/components/build-log/JobCard.tsx` extended.

Phase 2 is the small reusable primitives Phase 3's composed blocks consume.
After this phase ships, the `<PhaseStepper>` exists as a story-able primitive
(can be hand-rendered against any of the seven phases), `<JobCard>` carries
all the data the new page needs (progress bar + last-activity + live-dot),
and the `normalize` lib accessor lets every consumer drill into completed-section
data without `typeof` guards. None of the new primitives are mounted in the
live page yet — they ship as importable modules with full test coverage,
ready for Phase 3's composition.

The three sections run in parallel after Phase 1: 2.1 imports
`phase-labels`, 2.2 imports the tightened `SessionStatus`, and 2.3 implements
the normalizer that backs Phase 1's discriminated union. No order between
them within the phase.

---

## Feature 2.1: PhaseStepper primitive

**Complexity: M** — A horizontal dot/line stepper component rendering the seven canonical phases with the current one highlighted. Used as a legend by `<PipelineExplainer>` (3.2) and per-worktree by `<LiveWorktreesPanel>` (3.4). CSS-only highlight — no JS animation.

### Problem

The new page needs a visual representation of "where in the pipeline" a piece
of work is. Today there is no such primitive; the existing status board lists
phases as `phase: green` mono text. A small inline stepper communicates
position glanceably (especially for layperson viewers who don't read the
phase name yet) and reuses the same brand palette as `<StatusBadge>`.

The same primitive serves two distinct roles: an explainer legend (no current
phase highlighted, all seven dots equally rendered with their labels visible)
and a per-worktree position indicator (current phase highlighted, labels
hidden or compacted depending on size).

### Implementation

**NEW** `src/components/build-log/PhaseStepper.tsx`:

```tsx
import { PHASE_ORDER, PHASE_LABELS, isPhaseName } from '@/lib/build-log/phase-labels';
import type { PhaseName } from '@/lib/build-log/phase-labels';

export interface PhaseStepperProps {
  /** Phase to highlight as currently-active. null/undefined → no current dot. */
  currentPhase?: PhaseName | string | null;
  /** Layout density. 'md' shows labels under each dot; 'sm' is dots-only. */
  size?: 'sm' | 'md';
  /** Optional aria-label override. Defaults to "Build phase: {label}". */
  ariaLabel?: string;
  className?: string;
}

export function PhaseStepper({
  currentPhase,
  size = 'md',
  ariaLabel,
  className = '',
}: PhaseStepperProps) {
  const current = isPhaseName(currentPhase) ? currentPhase : null;
  const currentIndex = current ? PHASE_ORDER.indexOf(current) : -1;
  const label =
    ariaLabel ??
    (current ? `Build phase: ${PHASE_LABELS[current]}` : 'Build phase legend');

  return (
    <ol
      role="group"
      aria-label={label}
      className={`flex items-center gap-2 ${className}`}
      data-size={size}
    >
      {PHASE_ORDER.map((name, i) => {
        const isCurrent = i === currentIndex;
        const isCompleted = currentIndex >= 0 && i < currentIndex;
        return (
          <li
            key={name}
            data-phase={name}
            data-current={isCurrent || undefined}
            data-completed={isCompleted || undefined}
            className="flex flex-col items-center gap-1 text-xs"
          >
            <span
              aria-hidden="true"
              className={[
                'block w-2.5 h-2.5 rounded-full border',
                isCurrent && 'bg-(--color-oxblood) border-(--color-oxblood)',
                isCompleted && 'bg-(--color-bone) border-(--color-ink)',
                !isCurrent && !isCompleted && 'bg-transparent border-(--color-bone)',
              ].filter(Boolean).join(' ')}
            />
            {size === 'md' && (
              <span className="font-mono text-(--color-muted) capitalize text-[10px]">
                {PHASE_LABELS[name]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
```

**NEW** `src/components/build-log/__tests__/PhaseStepper.test.tsx`:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PhaseStepper } from '../PhaseStepper';

describe('PhaseStepper', () => {
  it('renders all 7 phases', () => {
    render(<PhaseStepper currentPhase="green" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(7);
  });

  it('marks the current phase via data-current', () => {
    const { container } = render(<PhaseStepper currentPhase="green" />);
    const currents = container.querySelectorAll('[data-current="true"]');
    expect(currents).toHaveLength(1);
    expect(currents[0].getAttribute('data-phase')).toBe('green');
  });

  it('marks earlier phases as completed via data-completed', () => {
    const { container } = render(<PhaseStepper currentPhase="green" />);
    const completed = container.querySelectorAll('[data-completed="true"]');
    // green is index 3 (preflight, discovery, red are completed)
    expect(completed).toHaveLength(3);
  });

  it('renders legend mode when currentPhase is null', () => {
    const { container } = render(<PhaseStepper currentPhase={null} />);
    expect(container.querySelector('[data-current="true"]')).toBeNull();
    expect(container.querySelector('[data-completed="true"]')).toBeNull();
  });

  it('uses friendly aria-label including the layperson phase name', () => {
    render(<PhaseStepper currentPhase="green" />);
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      'Build phase: Making the tests pass',
    );
  });

  it('hides labels in sm mode', () => {
    render(<PhaseStepper currentPhase="green" size="sm" />);
    expect(screen.queryByText('Researching the change')).toBeNull();
  });

  it('passes through unknown phase names safely (data-current = none)', () => {
    const { container } = render(<PhaseStepper currentPhase={'unknown-future' as never} />);
    expect(container.querySelector('[data-current="true"]')).toBeNull();
  });
});
```

### Design Decisions

- **Pure presentation, no internal state.** No `useState`, no client directive
  required. Renders in the server tree.
- **Brand-token colors via `bg-(--color-oxblood)` Tailwind 4 syntax.** Matches
  the project's existing pattern in `<StatusBadge>` and `<JobCard>`. Uses
  Oxblood for "current" and Bone for "completed" to align with the brand's
  no-saturated-primaries discipline.
- **`data-` attribute–driven styling.** Easier to assert in tests than hashed
  Tailwind class lists. Sentinel: searching by `[data-current="true"]` is
  stable across class-name changes.
- **`<ol>` not `<ul>`.** Phase order is meaningful; an ordered list is the
  correct semantic.
- **`role="group"` with `aria-label`.** Screen reader announces the whole
  control as "Build phase: Making the tests pass" rather than enumerating each
  dot — the per-dot announcement would be noisy and useless.
- **Two sizes only.** `'md'` shows labels (the legend role); `'sm'` is dots-only
  (per-worktree role). A third "lg" was considered for the Hero but the Hero
  doesn't render a stepper directly — it uses the PhaseLabel only.
- **`isPhaseName` guard before highlight.** A future internal phase name not in
  `PHASE_ORDER` won't highlight anything but the stepper still renders cleanly.
- **No animation.** The brand discipline (no UI shadows, minimal motion) rules
  out the transitions a more elaborate stepper would have. Position is
  conveyed by color, not animation.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/components/build-log/PhaseStepper.tsx`                |
| NEW    | `src/components/build-log/__tests__/PhaseStepper.test.tsx` |
| MODIFY | `src/components/build-log/index.ts` — export `PhaseStepper` |

---

## Feature 2.2: Enriched JobCard

**Complexity: M** — Adds progress bar (ported from `<JobsRollupTable>`), last-activity timestamp ("Last shipped 3h ago"), and live-dot indicator to the existing `<JobCard>`. All three new pieces are optional props with no-op defaults so the existing index page keeps rendering until 4.1 lands.

### Problem

Today's `<JobCard>` shows the job title, alias, status badge, completed-feature
count, excerpt, and a "View" link. It does not show progress (the rollup table
does, separately), last activity (nowhere), or whether work is currently
happening under this job (nowhere). To make the consolidated page glanceable,
those three signals belong on the card itself.

The card must stay backward-compatible during the rollout window: until 4.1
rewrites the page consumer, the existing `BuildLogIndexPage` calls `<JobCard>`
without the new props. Defaults must produce the current visual.

### Implementation

**MODIFY** `src/components/build-log/JobCard.tsx` — extend props, add three
new render blocks. Approximate shape (existing markup preserved, additions
inline-commented):

```tsx
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import type { JobRollupEntry } from '@/content/schemas';

export interface JobCardProps {
  rollup: JobRollupEntry;
  excerpt: string;
  /** NEW (2.2): Number of currently-live worktrees whose sectionId starts with this job's slug. */
  liveWorktreeCount?: number;
  /** NEW (2.2): ISO timestamp of this job's most-recently-completed section. */
  lastActivityIso?: string | null;
  /** NEW (2.2): "Now" ISO threaded down from the page render. Required when `lastActivityIso` is set. */
  nowIso?: string;
}

export function JobCard({
  rollup,
  excerpt,
  liveWorktreeCount = 0,
  lastActivityIso = null,
  nowIso = '',
}: JobCardProps) {
  const isLive = liveWorktreeCount > 0;
  const lastActivity =
    lastActivityIso && nowIso ? formatRelativeTime(lastActivityIso, nowIso) : '';
  const percent = rollup.percentComplete ?? 0;

  return (
    <article className="border border-bone bg-marble p-5 flex flex-col gap-3">
      <header className="flex items-baseline justify-between gap-3">
        <h3 className="font-display text-xl">
          <a href={`/build-log/jobs/${rollup.slug}`} className="hover:text-(--color-oxblood)">
            {rollup.title}
          </a>
          {rollup.alias && (
            <span className="ml-2 font-mono text-sm text-(--color-muted)">({rollup.alias})</span>
          )}
        </h3>
        <div className="flex items-center gap-2">
          {isLive && (
            <span
              className="inline-block w-1.5 h-1.5 rounded-full bg-(--color-oxblood)"
              aria-hidden="true"
              data-testid="live-dot"
            />
          )}
          {isLive && <span className="sr-only">Active</span>}
          <StatusBadge status={rollup.status} />
        </div>
      </header>

      <p className="text-sm text-(--color-ink) line-clamp-3">{excerpt}</p>

      {rollup.percentComplete !== null && (
        <div className="flex items-center gap-3 text-xs">
          <div
            className="flex-1 h-1 bg-bone overflow-hidden"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${rollup.completedFeatures} of ${rollup.totalFeatures} features complete`}
          >
            <div
              className="h-full bg-(--color-ink)"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono text-(--color-muted) tabular-nums">
            {rollup.completedFeatures}/{rollup.totalFeatures}
          </span>
        </div>
      )}

      {lastActivity && (
        <p className="text-xs text-(--color-muted)" data-testid="last-activity">
          Last shipped {lastActivity}
        </p>
      )}
    </article>
  );
}
```

**MODIFY** `src/components/build-log/__tests__/JobCard.test.tsx` — extend to
cover the eight `(isLive × hasActivity × hasProgress)` combinations:

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { JobCard } from '../JobCard';
import type { JobRollupEntry } from '@/content/schemas';

const baseRollup: JobRollupEntry = {
  slug: 'demo',
  title: 'Demo job',
  totalFeatures: 4,
  completedFeatures: 2,
  liveFeatures: 0,
  percentComplete: 50,
  status: 'in-progress',
};

const NOW = '2026-06-07T12:00:00Z';

describe('JobCard (enriched)', () => {
  it('renders live-dot when liveWorktreeCount > 0', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" liveWorktreeCount={1} />);
    expect(screen.getByTestId('live-dot')).toBeInTheDocument();
    expect(screen.getByText('Active')).toHaveClass('sr-only');
  });

  it('does NOT render live-dot when liveWorktreeCount = 0', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    expect(screen.queryByTestId('live-dot')).toBeNull();
  });

  it('renders last-activity when lastActivityIso + nowIso provided', () => {
    render(
      <JobCard
        rollup={baseRollup}
        excerpt="x"
        lastActivityIso="2026-06-07T09:00:00Z"
        nowIso={NOW}
      />,
    );
    expect(screen.getByTestId('last-activity')).toHaveTextContent(/3h ago/);
  });

  it('omits last-activity when lastActivityIso missing', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" nowIso={NOW} />);
    expect(screen.queryByTestId('last-activity')).toBeNull();
  });

  it('renders progress bar with correct aria-valuenow', () => {
    render(<JobCard rollup={baseRollup} excerpt="x" />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '50');
  });

  it('hides progress bar when percentComplete is null', () => {
    render(<JobCard rollup={{ ...baseRollup, percentComplete: null }} excerpt="x" />);
    expect(screen.queryByRole('progressbar')).toBeNull();
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
    'renders combination (live=%d, activity=%s, progress=%s) without crashing',
    (liveWorktreeCount, hasActivity, hasProgress) => {
      const { container } = render(
        <JobCard
          rollup={
            hasProgress
              ? baseRollup
              : { ...baseRollup, percentComplete: null }
          }
          excerpt="x"
          liveWorktreeCount={liveWorktreeCount}
          lastActivityIso={hasActivity ? '2026-06-07T09:00:00Z' : null}
          nowIso={NOW}
        />,
      );
      expect(container.querySelector('article')).toBeInTheDocument();
    },
  );
});
```

### Design Decisions

- **All new props optional with no-op defaults.** The existing
  `BuildLogIndexPage` already mounts `<JobCard>` and must continue rendering
  until 4.1 lands. Required props would break the existing page mid-rollout.
- **`liveWorktreeCount` not `isLive` boolean.** The number is occasionally
  useful (e.g. pluralizing the sr-only "Active" announcement) and is no harder
  to thread down than a boolean.
- **`nowIso` required when `lastActivityIso` is set.** The relative-time
  formatter needs both; making the second arg optional but the first required
  ensures consumers don't accidentally call `formatRelativeTime(iso, '')`.
- **Progress bar uses brand Ink fill against Bone track.** Matches the
  forbidden-pattern sentinel: no gradients, no shadows, brand tokens only.
- **Live-dot is sr-hidden plus a separate `<span class="sr-only">Active</span>`.**
  Decoration + announcement split is the standard a11y pattern; an `aria-label`
  on the dot itself would conflict with the surrounding card's link semantics.
- **No animation on the live-dot.** Brand discipline. If a pulsing dot is
  warranted later, that's a follow-up CSS-only `@keyframes` addition; out of
  scope here.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| MODIFY | `src/components/build-log/JobCard.tsx`                     |
| MODIFY | `src/components/build-log/__tests__/JobCard.test.tsx`      |

---

## Feature 2.3: normalize lib

**Complexity: S** — Extract the inline `extractSectionId` helper from `src/app/build-log/status/page.tsx` into `src/lib/build-log/normalize.ts` and add `toEntry(raw): CompletedSectionEntry` — the discriminated-union normalizer that 1.4's schema additions reference.

### Problem

`src/app/build-log/status/page.tsx` has an inline `extractSectionId(entry)`
helper that handles the string-vs-object completed-section shape. RecentActivity
(3.3) needs the same access pattern plus the richer object fields. Inlining the
helper would mean two places to keep in sync; extracting it to lib makes
`normalize.ts` the only place where YAML shape decisions live.

Beyond just `extractSectionId`, RecentActivity needs to drill into commit hash,
test count, files-new, etc. The raw shape mixes string-only entries with two
object variants (the old-style `{ section, completedAt }` and the new-style
detailed object with snake_case keys). `toEntry(raw)` collapses all three
into the `CompletedSectionEntry` discriminated union introduced in 1.4.

### Implementation

**NEW** `src/lib/build-log/normalize.ts`:

```ts
import type { CompletedSectionEntry, SessionStatus } from '@/content/schemas';

type RawEntry = SessionStatus['completedSections'][number];

/**
 * Extract just the section id from any completed-section entry shape.
 * Preserved from the inline helper that lived in `src/app/build-log/status/page.tsx`.
 */
export function extractSectionId(entry: RawEntry): string {
  return typeof entry === 'string' ? entry : entry.section;
}

/**
 * Normalize a raw entry (string OR snake_case object) into the discriminated
 * union the UI consumes. Snake_case keys are camelCased; missing optional
 * fields stay undefined; the kind tag distinguishes detailed (object) from
 * minimal (string-only) entries.
 */
export function toEntry(raw: RawEntry): CompletedSectionEntry {
  if (typeof raw === 'string') {
    return { kind: 'minimal', id: raw };
  }
  return {
    kind: 'detailed',
    id: raw.section,
    name: raw.name,
    completedAt: raw.completedAt,
    commitHash: raw.commit_hash,
    commitMessage: raw.commit_message,
    tests: raw.tests,
    filesNew: raw.files_new,
    filesModified: raw.files_modified,
    pushed: raw.pushed,
    notes: raw.notes,
  };
}
```

**MODIFY** `src/app/build-log/status/page.tsx` — replace inline
`extractSectionId` definition with an import from `@/lib/build-log/normalize`.
(One-cycle change before /status is deleted in 4.2.)

**NEW** `src/lib/build-log/__tests__/normalize.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractSectionId, toEntry } from '../normalize';

describe('extractSectionId', () => {
  it('returns the raw string for string entries', () => {
    expect(extractSectionId('section-1.1')).toBe('section-1.1');
  });

  it('returns .section for object entries', () => {
    expect(extractSectionId({ section: 'section-1.2' })).toBe('section-1.2');
  });
});

describe('toEntry', () => {
  it('returns minimal entry for string input', () => {
    expect(toEntry('section-1.1')).toEqual({ kind: 'minimal', id: 'section-1.1' });
  });

  it('camel-cases snake_case fields', () => {
    const out = toEntry({
      section: 'section-1.2',
      completedAt: '2026-06-07T00:00:00Z',
      commit_hash: 'abc1234',
      commit_message: 'shipped',
      tests: 42,
      files_new: 3,
      files_modified: 5,
      pushed: true,
      notes: 'all green',
      name: 'Section 1.2',
    });
    expect(out).toEqual({
      kind: 'detailed',
      id: 'section-1.2',
      name: 'Section 1.2',
      completedAt: '2026-06-07T00:00:00Z',
      commitHash: 'abc1234',
      commitMessage: 'shipped',
      tests: 42,
      filesNew: 3,
      filesModified: 5,
      pushed: true,
      notes: 'all green',
    });
  });

  it('passes through undefined for missing optional fields', () => {
    const out = toEntry({ section: 'section-1.3' });
    expect(out).toEqual({ kind: 'detailed', id: 'section-1.3' });
  });
});
```

### Design Decisions

- **Pure functions in a `lib/` module.** No React, no JSX, no DOM imports —
  importable from both server components and tests.
- **Two functions exported, not one combo function.** `extractSectionId` is
  cheap and used in many places (sidebar lists, footer link, log entries) where
  the full entry would be overkill. `toEntry` is the heavier normalization.
- **Snake_case → camelCase done here, nowhere else.** The Zod schema accepts
  snake_case to mirror the YAML; the UI never sees snake_case. `toEntry` is
  the choke point.
- **No defensive coercion of `tests`/`filesNew` to numbers.** The Zod schema
  already validates type; if it parsed, the fields are numbers or undefined.
- **No memoization.** Entries are small; the page processes ~100 of them once
  per render. Premature optimization.

### Files

| Action | File                                                       |
|--------|------------------------------------------------------------|
| NEW    | `src/lib/build-log/normalize.ts`                           |
| NEW    | `src/lib/build-log/__tests__/normalize.test.ts`            |
| MODIFY | `src/app/build-log/status/page.tsx` — replace inline `extractSectionId` with import |
