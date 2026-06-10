# build-log-overhaul — Implementation Plan

**Alias:** `blo` — invoke as `/pipeline blo <section>` or `/discovery blo <section>`. Section IDs in YAML + commits use the canonical slug `build-log-overhaul`.

**Visibility:** `public` — the build log is the project's most public surface; this job ships into it.

## Context

`/build-log` today is split across two routes (`/build-log` for the job index
and `/build-log/status` for the live pipeline state) and presented as flat
tables, bullet lists, and lightly-styled `<dl>` blocks. Every piece of data the
TDD pipeline produces — current section, current agent, current stage, live
worktrees with PIDs, completed sections with test counts and commit hashes,
cross-section knowledge patterns, deferred follow-ups — surfaces somewhere,
but the page has no narrative. A YouTube viewer landing cold has no idea what
they're looking at; a technical reader has to ping-pong between routes to
assemble a mental model. The page reads like a CI dashboard intended for the
author, not a "show the work" content surface for a brand whose entire pitch
is "AI agents are building this site in public."

This job consolidates the two routes into a single `/build-log` page that
opens with a story-driven "right now" hero in plain English (one sentence
describing what the agent is doing this moment), follows with a "what is this?"
explainer that translates the seven pipeline phases into layperson labels
(`red → Writing the tests`, `green → Making the tests pass`, etc.) under a
visual stepper, then layers down through enriched job cards (progress bars,
last-shipped timestamps, live-dot indicators), a recent activity feed
(top-N expanded section cards with commit links + collapsed notes preview),
a live-worktrees panel (per-worktree stepper + agent name + slot path), and
finally a collapsed knowledge digest surfacing the cross-section patterns and
deferred-followups stored in `pipeline/active/knowledge.yaml`. `/build-log/status`
becomes a server-side redirect to `/build-log#current` for one release cycle
and is then removed.

The data layer is largely already in place: `getAllJobs`, `getJobsRollup`,
`getSessionStatus`, `getKnowledgeFile`, `getLiveWorktrees`, the `Job` /
`JobRollupEntry` / `SessionStatus` / `KnowledgeFile` schemas, and the
`JobCard` / `StatusBadge` / `MarkdownDocument` components were all shipped by
`build-in-public-docs` (bpd) and the styling-overhaul (so) brand reskin. The
gaps this job fills are (a) a small set of foundation helpers (phase-label
map, relative-time formatter, derived live-status state machine, tighter
`CompletedSectionEntry` shape with a `concurrentJobs` field on `SessionStatus`),
(b) a `<PhaseStepper>` primitive plus enriched `<JobCard>`, (c) five composed
UI blocks (`<Hero>`, `<PipelineExplainer>`, `<RecentActivity>`,
`<LiveWorktreesPanel>`, `<KnowledgeDigest>`), and (d) the page rewrite
itself plus the `/status` redirect and `JobsRollupTable` cleanup. No new
loaders, no new YAML files, no new content types beyond a derived `LiveStatus`
union and a discriminated-union `CompletedSectionEntry`.

The full pre-approved brief that drove this plan lives at
`~/.claude/plans/why-isn-t-the-build-melodic-boole.md`. It contains the
audience-model rationale, the layperson-label translation table, the per-feature
implementation sketches, and the cross-cutting edge cases — referenced in this
README and the phase files but not duplicated.

Out of scope (explicit non-goals):

- Per-section drill-down routes (e.g. `/build-log/section/{id}`). The single-page
  progressive-disclosure model handles depth via native `<details>`; adding
  another route layer is the wrong shape for a page meant to read top-down.
- Real-time websocket updates. Page is server-rendered with
  `dynamic = 'force-dynamic'`; freshness on request is enough.
- Writing to `pipeline/IMPLEMENTATION-LOG.md` from the page. The `/finish` skill
  owns that file; this page only links to it.
- Trend charts, sparklines, historical metrics. Save for a follow-up if the
  page proves popular.
- `localStorage`-backed "I've seen the explainer" persistence. Adds a client
  component for a v1 polish that the native `<details open>` covers well enough.
- Removing `<PhaseNav>` or `<MarkdownDocument>` — both still used elsewhere
  (PhaseNav by nested job/phase routes if they exist; MarkdownDocument by
  `<RecentActivity>` for notes prose).
- Replacing `<JobsRollupTable>` callers anywhere outside `/build-log/status`.
  Verified during 4.3 — if any caller has appeared since the plan was written,
  4.3 widens to migrate them or is deferred.

## What Already Exists

### Already in the repo today (2026-06-07)

- **Two existing routes** — `src/app/build-log/page.tsx` (job index, groups by
  in-progress / planned / complete) and `src/app/build-log/status/page.tsx`
  (live state board). Both use `dynamic = 'force-dynamic'`, both define their
  own JSON-LD `CollectionPage`, both wrap a `<Container as="main">` from
  `src/components/site/Container.tsx`.
- **Build-log components** — `src/components/build-log/`:
  - `JobCard.tsx` — card per job consuming `JobRollupEntry` + first-paragraph
    excerpt. Renders status badge, alias, completed-feature count, "View" link.
  - `JobsRollupTable.tsx` — at-a-glance table with status, progress bar, feature
    counts. Used only by `/build-log/status` today; deleted in 4.3.
  - `StatusBadge.tsx` — pill for `'planned' | 'in-progress' | 'complete' |
    'unknown'`. Brand-reskinned in so-5.2 (Oxblood / Verdigris / Ink / Bone).
  - `MarkdownDocument.tsx` — `react-markdown` + `remark-gfm` + rehype-{slug,
    autolink, highlight}. Currently used for `session.notes`; consumed by
    `<RecentActivity>` for completed-section notes prose.
  - `PhaseNav.tsx` — phase-navigation rail used by nested job/phase routes if
    they exist. Untouched by this job.
- **Loaders under `src/lib/build-log/`**:
  - `jobs.ts` — `getAllJobs()` walking `currentwork/{slug}/README.md` + phase
    files; module-level cache, `Object.freeze` on returned arrays.
  - `pipeline-state.ts` — `getSessionStatus()`, `getKnowledgeFile()`,
    `getJobsRollup()` reading `pipeline/active/session.yaml` and
    `pipeline/active/knowledge.yaml`.
  - `worktree-state.ts` — `getLiveWorktrees()` via `git worktree list
    --porcelain` plus `.pipeline.pid` files plus per-section `beats.yaml`.
    Returns `{ sectionId, currentPhase, pid, slotPath, ... }[]`.
  - Supporting: `repo-root.ts`, `parse-readme.ts`, `parse-phase.ts`.
- **Schemas** — `src/content/schemas/build-log.ts` defines `Job`, `JobPhase`,
  `JobFeature`, `SessionStatus`, `KnowledgeFile`, `JobRollupEntry`.
  `src/content/schemas/validators.ts` provides Zod runtime validation for each.
  `completedSections` is currently typed as `readonly (string | { section: string;
  completedAt?: string })[]` — loose, with no accessors. Tightened in 1.4.
- **Pipeline state files** — `pipeline/active/session.yaml` has `current_section`,
  `current_agent`, `current_stage`, `concurrent_jobs: []` (empty list today, but
  the field is present and the field name follows the YAML snake-case
  convention), and `completed_sections` (currently 100+ entries, mix of object
  and string forms). `pipeline/active/knowledge.yaml` has the project_context,
  patterns array, deferred_followups list, and gotchas. Both files are large
  (session.yaml ~3200 lines, knowledge.yaml ~6000 lines).
- **`pipeline/IMPLEMENTATION-LOG.md`** — exists, currently empty
  (`_No entries yet._`). `/finish` is the natural writer; out of scope here.
- **Site chrome** — `src/components/site/{Container,Header,Footer,NavLink}.tsx`.
  `<Container>` supports a polymorphic `as` prop. All brand-reskinned by
  styling-overhaul phases 1–6.
- **Brand tokens** — `src/app/globals.css` exposes the Marble / Parchment / Ink
  / Oxblood / Verdigris / Bone / Shadow palette plus Cinzel + Inter + JetBrains
  Mono type stack. Tailwind 4 utility surface includes `bg-marble`, `text-ink`,
  `text-(--color-oxblood)`, `border-bone`, `font-display`, `font-mono`.
- **Brand primitives** — `src/components/brand/{Section,SectionDivider,
  EditorialCard,Button,DropAccent}.tsx`. `<EditorialCard>` enforces the
  three-level hierarchy this page's cards inherit; `<Section>` and
  `<SectionDivider>` carry the vertical rhythm; `<Button>` is the canonical
  cta primitive (used by Hero's "what is this?" jump link).
- **Test infra** — Vitest 2.1.8 + jsdom, `@testing-library/jest-dom/vitest`,
  MSW 2.7 (unused on this job — no network), coverage thresholds
  70 branches / 80 functions / 80 lines / 80 statements (`vitest.config.ts`).
- **Pre-approved brief** — `~/.claude/plans/why-isn-t-the-build-melodic-boole.md`
  is the user-approved spec that this job tree implements.
- **Helper to migrate** — `extractSectionId(entry)` is inlined in
  `src/app/build-log/status/page.tsx`. Extracted to `src/lib/build-log/normalize.ts`
  in 2.3 alongside the new `toEntry(raw)` discriminated-union normalizer.

### Delivered by completed sister jobs

This job runs against a stable baseline; it does not depend on any in-flight
job. The build-log routes themselves were shipped by `build-in-public-docs`
(bpd 1.1–3.1), and styling-overhaul phases 1–6 brand-reskinned the components
this job composes. No prerequisite job is pending.

## Feature Overview (15 Features, 4 Phases)

| #   | Feature                                                                                  | Phase                          | Size | Status  |
|-----|------------------------------------------------------------------------------------------|--------------------------------|------|---------|
| 1.1 | `phase-labels` const map + canonical 7-phase ordering + branded `PhaseName` type         | 1 - Foundation utilities       | S    | Shipped |
| 1.2 | `relative-time` helper — pure `formatRelativeTime(iso, nowIso)` SSR-safe formatter       | 1 - Foundation utilities       | S    | Shipped |
| 1.3 | `derive-live-status` — pure state-machine returning `'active' \| 'idle' \| 'paused' \| 'stale' \| 'unknown'` | 1 - Foundation utilities | M    | Shipped |
| 1.4 | Schema additions — `concurrentJobs?` on `SessionStatus`, discriminated `CompletedSectionEntry` union | 1 - Foundation utilities | S    | Shipped |
| 2.1 | `<PhaseStepper>` primitive — horizontal dot/line stepper for the 7 pipeline phases       | 2 - Display primitives         | M    | Shipped |
| 2.2 | Enriched `<JobCard>` — progress bar + last-activity timestamp + live-dot indicator       | 2 - Display primitives         | M    | Shipped |
| 2.3 | `normalize` lib — `extractSectionId(entry)` + `toEntry(raw)` discriminated-union accessor | 2 - Display primitives         | S    | Shipped |
| 3.1 | `<Hero>` block — "right now" sentence + three stat tiles + `id="current"` anchor          | 3 - Composed UI blocks         | M    | Shipped |
| 3.2 | `<PipelineExplainer>` block — "what is this?" copy + stepper legend in `<details open>`  | 3 - Composed UI blocks         | S    | Shipped |
| 3.3 | `<RecentActivity>` block — top-5 expanded section cards + compact tail (cap 25 + show-older) | 3 - Composed UI blocks      | L    | Shipped |
| 3.4 | `<LiveWorktreesPanel>` block — per-worktree card with stepper + agent + slot path        | 3 - Composed UI blocks         | M    | Shipped |
| 3.5 | `<KnowledgeDigest>` block — patterns + deferred-followups summary in `<details>`         | 3 - Composed UI blocks         | S    | Planned |
| 4.1 | Page rewrite of `/build-log` — compose all blocks, single merged JSON-LD                 | 4 - Page assembly + cleanup    | M    | Planned |
| 4.2 | `/build-log/status` → `/build-log#current` server-side redirect + test                    | 4 - Page assembly + cleanup    | S    | Planned |
| 4.3 | Delete `<JobsRollupTable>` + its test + barrel re-export                                 | 4 - Page assembly + cleanup    | S    | Planned |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

Total rough job size: **M** — comparable to styling-overhaul phase 4 or phase 6
(both M-density jobs). No new loaders, no new packages, no new content types
beyond derived TS unions; the weight is in composing five UI blocks against an
existing data layer with a strict edge-case matrix.

## Dependency Graph

```
Phase 1: Foundation utilities  (pure functions + schema)
│
│   1.1 ──┐
│   1.2 ──┤── all four can run in parallel; 1.3 needs 1.1's PhaseName
│   1.4 ──┘   for its 'paused' check, but only the type — not the values
│        1.3 (after 1.1)
│
v
Phase 2: Display primitives    (small components + lib)
│
│   2.1 (needs 1.1) ──┐
│   2.2 (needs 1.4) ──┤── all three can run in parallel after Phase 1
│   2.3 (needs 1.4) ──┘
│
v
Phase 3: Composed UI blocks    (the page's five major regions)
│
│   3.1 (needs 1.2 + 1.3 + 1.4) ──┐
│   3.2 (needs 2.1)               ─┤── all five can run in parallel after Phase 2
│   3.3 (needs 1.2 + 2.3)         ─┤
│   3.4 (needs 2.1)               ─┤
│   3.5 (standalone — schema only) ┘
│
v
Phase 4: Page assembly + cleanup
│
    4.1 (needs ALL Phase 3 blocks)
        │
        ├── 4.2 (after 4.1 — redirect target lives in 4.1's page)
        └── 4.3 (after 4.1 — JobsRollupTable's last caller was /status, now gone)
```

Hard dependencies:

- **1.1 standalone** — pure const + branded type. No runtime deps.
- **1.2 standalone** — pure function over two ISO strings. No runtime deps.
- **1.4 standalone** — schema additions. Zod is already installed.
- **1.3 → 1.1** — `deriveLiveStatus`'s decision tree references `PhaseName`
  for the `'paused'` check against `currentStage`. Type-only dependency; 1.1
  must land before 1.3 starts its `/red`.
- **Phase 1 → Phase 2** — every Phase 2 feature consumes a Phase 1 artifact:
  2.1 uses the phase-labels map, 2.2 uses the tightened `CompletedSectionEntry`
  and `concurrentJobs`, 2.3 implements the normalizer the schema added in 1.4.
- **Phase 2 → Phase 3** — 3.1 (Hero) renders the stepper via 2.1; 3.2 uses 2.1
  as a legend; 3.3 uses 2.3's `toEntry()` accessor; 3.4 renders 2.1 per-worktree;
  3.5 is the standalone exception (uses only schema + the existing
  `MarkdownDocument`).
- **Phase 3 → 4.1** — the page rewrite imports and composes every Phase 3
  block. Cannot start until all five blocks ship.
- **4.1 → 4.2, 4.3** — `/status`'s redirect target is the `id="current"` anchor
  introduced in 4.1's page. `JobsRollupTable`'s last and only caller is
  `/status`; once 4.1 lands and 4.2 redirects `/status` away, 4.3 deletes the
  table without leaving dangling imports.

## New Content Types Required

| Type                       | Phase | Purpose                                                                                                  |
|----------------------------|-------|----------------------------------------------------------------------------------------------------------|
| `PhaseName`                | 1     | Branded union of the seven pipeline phase names (`'discovery' \| 'red' \| ...`); single source of truth   |
| `LiveStatus`               | 1     | Derived state union (`'active' \| 'idle' \| 'paused' \| 'stale' \| 'unknown'`) returned by `deriveLiveStatus` |
| `CompletedSectionEntry`    | 1     | Discriminated union `\| { kind: 'detailed', ... } \| { kind: 'minimal', id }` covering both YAML shapes  |
| `SessionStatus.concurrentJobs?` | 1 | Optional `readonly string[]` mirroring `session.concurrent_jobs` in the YAML for plural-agent hero copy   |

All four land in `src/content/schemas/build-log.ts` and update
`src/content/schemas/validators.ts`. No new schema files, no new modules in
the barrel.

## Critical Files Reference

| File                                                                  | Role                                                                                   |
|-----------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| `src/lib/build-log/phase-labels.ts`                                   | NEW (1.1) — `phaseLabel(name)` accessor + `PHASE_ORDER` tuple + `PhaseName` branded type |
| `src/lib/build-log/relative-time.ts`                                  | NEW (1.2) — pure `formatRelativeTime(iso, nowIso)` formatter                            |
| `src/lib/build-log/derive-live-status.ts`                             | NEW (1.3) — pure `deriveLiveStatus({ session, worktrees, completedSections, nowIso })`  |
| `src/lib/build-log/normalize.ts`                                      | NEW (2.3) — `extractSectionId(entry)` + `toEntry(raw)` discriminated-union normalizer    |
| `src/lib/build-log/__tests__/phase-labels.test.ts`                    | NEW (1.1)                                                                              |
| `src/lib/build-log/__tests__/relative-time.test.ts`                   | NEW (1.2)                                                                              |
| `src/lib/build-log/__tests__/derive-live-status.test.ts`              | NEW (1.3)                                                                              |
| `src/lib/build-log/__tests__/normalize.test.ts`                       | NEW (2.3)                                                                              |
| `src/content/schemas/build-log.ts`                                    | MODIFY (1.4) — add `PhaseName`, `LiveStatus`, `CompletedSectionEntry`, extend `SessionStatus` |
| `src/content/schemas/validators.ts`                                   | MODIFY (1.4) — extend `SessionStatusSchema` with `concurrentJobs`, tighten completed-sections schema |
| `src/content/schemas/__tests__/validators.test.ts`                    | MODIFY (1.4) — assert new fields parse + bad shapes reject                              |
| `src/components/build-log/PhaseStepper.tsx`                           | NEW (2.1) — horizontal stepper primitive                                                |
| `src/components/build-log/JobCard.tsx`                                | MODIFY (2.2) — add progress bar + last-activity + live-dot props                        |
| `src/components/build-log/Hero.tsx`                                   | NEW (3.1)                                                                              |
| `src/components/build-log/PipelineExplainer.tsx`                      | NEW (3.2)                                                                              |
| `src/components/build-log/RecentActivity.tsx`                         | NEW (3.3)                                                                              |
| `src/components/build-log/LiveWorktreesPanel.tsx`                     | NEW (3.4)                                                                              |
| `src/components/build-log/KnowledgeDigest.tsx`                        | NEW (3.5)                                                                              |
| `src/components/build-log/JobsRollupTable.tsx`                        | DELETE (4.3)                                                                           |
| `src/components/build-log/JobsRollupTable.test.tsx`                   | DELETE (4.3)                                                                           |
| `src/components/build-log/index.ts`                                   | MODIFY (Phase 2/3/4) — barrel exports for new components, remove rollup table          |
| `src/components/build-log/__tests__/PhaseStepper.test.tsx`            | NEW (2.1)                                                                              |
| `src/components/build-log/__tests__/JobCard.test.tsx`                 | MODIFY (2.2) — extend coverage for all 8 (live × activity × progress) combinations     |
| `src/components/build-log/__tests__/Hero.test.tsx`                    | NEW (3.1) — 5 fixtures, one per `LiveStatus` variant                                    |
| `src/components/build-log/__tests__/PipelineExplainer.test.tsx`       | NEW (3.2)                                                                              |
| `src/components/build-log/__tests__/RecentActivity.test.tsx`          | NEW (3.3)                                                                              |
| `src/components/build-log/__tests__/LiveWorktreesPanel.test.tsx`      | NEW (3.4)                                                                              |
| `src/components/build-log/__tests__/KnowledgeDigest.test.tsx`         | NEW (3.5)                                                                              |
| `src/app/build-log/page.tsx`                                          | REWRITE (4.1) — composes Hero + Explainer + JobsAtAGlance + RecentActivity + LiveWorktrees + KnowledgeDigest |
| `src/app/build-log/__tests__/page.test.tsx`                           | MODIFY (4.1) — extend to cover the new sections, anchor, edge states                    |
| `src/app/build-log/status/page.tsx`                                   | REWRITE (4.2) — single-line `redirect('/build-log#current')`                            |
| `src/app/build-log/status/__tests__/page.test.tsx`                    | MODIFY (4.2) — assert redirect call                                                    |
| `src/lib/build-log/pipeline-state.ts`                                 | REFERENCE — `getSessionStatus` / `getKnowledgeFile` / `getJobsRollup` (no changes)     |
| `src/lib/build-log/worktree-state.ts`                                 | REFERENCE — `getLiveWorktrees` (no changes)                                            |
| `src/lib/build-log/jobs.ts`                                           | REFERENCE — `getAllJobs` (no changes)                                                  |
| `pipeline/active/session.yaml`                                        | READ-ONLY at build time — source of truth for live state                               |
| `pipeline/active/knowledge.yaml`                                      | READ-ONLY at build time — source of truth for patterns + deferred followups            |
| `pipeline/IMPLEMENTATION-LOG.md`                                      | LINKED — footer of new page links here (no writes)                                     |
| `~/.claude/plans/why-isn-t-the-build-melodic-boole.md`                | REFERENCE — pre-approved brief that drove this job                                     |

## Verification Plan

| Phase | Verification                                                                                                                                                                                                                                                                       |
|-------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 1     | `npm run lint` clean. `npm test` — `phaseLabel('discovery') === 'Researching the change'`; every entry in `PHASE_ORDER` has a label; `formatRelativeTime` table-test covers `"just now"` / `"3m ago"` / `"2h ago"` / `"yesterday"` / `"3 days ago"` / `"2 weeks ago"` / `"on 2026-06-07"` (>30d) / `""` (invalid); `deriveLiveStatus` returns `'active'` for one-worktree fixture, `'paused'` for `currentAgent === 'pending'`, `'idle'` for recent-completed-no-worktree, `'stale'` for >72h gap, `'unknown'` for null session; `SessionStatusSchema.parse(realSessionYaml)` succeeds with `concurrentJobs` present; `CompletedSectionEntrySchema` accepts both string and object shapes and normalizes to discriminated union. `tsc --noEmit` clean. `npm run build` clean.   |
| 2     | `<PhaseStepper currentPhase="green" />` rendered in jsdom asserts seven dots present, third dot has `data-current="true"`, `aria-label` reads "Build phase: Making the tests pass". Enriched `<JobCard>` covers all 8 (`live? × hasActivity? × any-progress?`) combinations — live-dot present iff `liveWorktreeCount > 0`; "Last shipped 3h ago" present iff `lastActivityIso` truthy; progress bar width matches `percentComplete`. `extractSectionId` / `toEntry` round-trip table tests cover string-only, full-detail object, and partial-object entries. `npm test` green. `tsc --noEmit` clean. |
| 3     | Each composed block rendered with the fixture matrix below. **Hero**: 5 fixtures (one per `LiveStatus`); active variant pluralizes when `worktrees.length > 1`; stat tiles compute correctly from `(completedSections, rollup)`; `id="current"` anchor present. **PipelineExplainer**: snapshot of copy + stepper-legend rendering. **RecentActivity**: 4 fixtures (0 entries → "no sections shipped yet"; 1–5 entries → all expanded; 6+ → top-5 expanded plus compact tail; >25 → tail capped, "show older" `<details>` present). Notes prose never auto-rendered — always inside closed `<details>` with ≤1000-char preview in `<summary>`. **LiveWorktreesPanel**: 4 fixtures (empty → entire block hidden; single; multiple with pluralized header; one worktree with null `pid` shows orphan-slot badge instead of "pid: —"). **KnowledgeDigest**: 3 fixtures (empty → block hidden; populated → patterns + deferred-followups summaries inside `<details>`; parse-failed → block hidden). axe-clean in jsdom for every block. `npm test` green. `tsc --noEmit` clean. |
| 4     | Page test asserts hero + explainer + jobs grouping + recent activity + live worktrees + knowledge digest + footer all render; anchor `id="current"` exists; merged JSON-LD `CollectionPage` is a single `<script>` tag; `groupJobs` passes `worktrees` + `completedSections` through to each `JobCard`. Redirect test asserts `/build-log/status` invokes `redirect('/build-log#current')`. `JobsRollupTable` import audit: `grep -r 'JobsRollupTable' src/` returns zero matches after deletion. `npm run build` clean — both `/build-log` and `/build-log/status` prerender, status as a 307 redirect. `npm run dev` manual pass: load `/build-log` in browser, exercise explainer open/close, RecentActivity notes disclosure, KnowledgeDigest disclosure with mouse + keyboard; hit `/build-log/status` and confirm redirect lands at `/build-log#current`. |
| All   | `npm run lint` clean. `npm test` green + coverage holds (70/80/80/80). `tsc --noEmit` clean. `npm run build` clean. Manual smoke on `npm run start`: keyboard-only tab through every interactive element on `/build-log`; verify status badges, stepper highlights, and live-dot all readable in screen-reader mode (VoiceOver / Orca). |

## Phase Documentation

- [Phase 1: Foundation utilities](./phase-1-foundation.md) — `phase-labels`, `relative-time`, `derive-live-status`, schema additions
- [Phase 2: Display primitives](./phase-2-primitives.md) — `<PhaseStepper>`, enriched `<JobCard>`, `normalize` lib
- [Phase 3: Composed UI blocks](./phase-3-blocks.md) — `<Hero>`, `<PipelineExplainer>`, `<RecentActivity>`, `<LiveWorktreesPanel>`, `<KnowledgeDigest>`
- [Phase 4: Page assembly + cleanup](./phase-4-assembly.md) — page rewrite, `/status` redirect, delete `<JobsRollupTable>`

## Open Items (Resolve During Implementation)

- **Stale threshold (24h / 72h)** — `deriveLiveStatus` uses 24h for the
  `'idle'` window and 72h for `'stale'`. Both are constants in
  `derive-live-status.ts` so they can be tuned without code churn. Final values
  to be confirmed during `/green 1.3` against real session-history density.
- **Phase-label copy** — the seven layperson labels (`Researching the change`,
  `Writing the tests`, `Making the tests pass`, `Polishing the code`,
  `Shipping it`, `Merging to main`, `Safety checks`) are the author's first
  draft. `/discovery 1.1` should propose alternatives if the labels read
  awkwardly in a complete sentence inside the Hero ("Right now an AI agent is
  Making the tests pass for `build-log-overhaul-1.2`"). Lowercase the verb-form
  when used inline if that reads better.
- **Stat-tile numbers** — Hero shows three numeric tiles: sections shipped,
  tests written (sum from `completedSections[].tests` where present), jobs in
  progress. If the "tests written" sum looks misleading because many older
  entries are minimal-form (no `tests` field), 3.1 can drop to two tiles
  (shipped + jobs-in-progress) at green time.
- **GitHub commit URL** — `<RecentActivity>` links commit hashes to
  `https://github.com/{org}/{repo}/commit/{hash}`. Org / repo derived from
  `package.json`'s `repository.url` at build time. If `repository.url` is
  missing or non-GitHub, the commit hash renders as plain monospaced text — no
  crash, no broken link.
- **`JobCard` props compatibility** — 2.2 adds `liveWorktreeCount` and
  `lastActivityIso` to `JobCard` props. The existing index page already imports
  `<JobCard>`; 4.1's rewrite passes the new props. Until 4.1 lands, the
  existing index page must continue to render — `liveWorktreeCount` and
  `lastActivityIso` ship as optional props with sensible no-op defaults.
- **No-JS path** — every `<details>` element works natively without JS;
  `<PhaseStepper>` is pure CSS; redirect is server-side. /discovery for each
  Phase 3 section should add a smoke check that the block renders without
  `data-`-driven JS.
- **Self-reference** — when this job is in flight, the page will literally
  display `build-log-overhaul-{N.M}` as the current section. This is a feature,
  not a bug; confirmed there's no infinite-loop risk because the page is
  prerendered against a static snapshot of `pipeline/active/`.
- **Merged JSON-LD** — 4.1 emits one `CollectionPage` JSON-LD blob covering
  both legacy descriptions; old `/status` JSON-LD is deleted in 4.2 alongside
  the page body.
- **`concurrent_jobs` real data** — the field is currently `[]` in production.
  `/red 1.4` should hand-build a populated fixture for testing the plural
  hero variant; no production data is required.

## Section IDs for TDD Workflow

Each feature maps to one section ID consumed by `/discovery`, `/red`, `/green`,
`/refactor`, `/finish`. Section IDs use the canonical slug `build-log-overhaul`,
not the alias `blo`.

| Section ID                       | Feature                                                                  |
|----------------------------------|--------------------------------------------------------------------------|
| `build-log-overhaul-1.1`         | `phase-labels` const map + `PhaseName` branded type                      |
| `build-log-overhaul-1.2`         | `relative-time` helper                                                   |
| `build-log-overhaul-1.3`         | `derive-live-status` helper + `LiveStatus` type                          |
| `build-log-overhaul-1.4`         | Schema additions (`concurrentJobs`, `CompletedSectionEntry`)             |
| `build-log-overhaul-2.1`         | `<PhaseStepper>` primitive                                               |
| `build-log-overhaul-2.2`         | Enriched `<JobCard>` (progress + last-activity + live-dot)               |
| `build-log-overhaul-2.3`         | `normalize` lib (`extractSectionId`, `toEntry`)                          |
| `build-log-overhaul-3.1`         | `<Hero>` block                                                           |
| `build-log-overhaul-3.2`         | `<PipelineExplainer>` block                                              |
| `build-log-overhaul-3.3`         | `<RecentActivity>` block                                                 |
| `build-log-overhaul-3.4`         | `<LiveWorktreesPanel>` block                                             |
| `build-log-overhaul-3.5`         | `<KnowledgeDigest>` block                                                |
| `build-log-overhaul-4.1`         | `/build-log` page rewrite                                                |
| `build-log-overhaul-4.2`         | `/build-log/status` → `/build-log#current` redirect                       |
| `build-log-overhaul-4.3`         | Delete `<JobsRollupTable>` + tests + barrel re-export                     |

These IDs are consumed by `pipeline/active/session.yaml` and used as directory
names under `pipeline/active/`.
