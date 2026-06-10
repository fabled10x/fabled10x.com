# {Feature Area} — Implementation Plan

**Alias:** `{xx}` — invoke as `/pipeline {xx} <section>`. Section IDs in YAML + commits use the canonical slug.

**Visibility:** `public` — set to `private` for jobs that must not appear in `build-in-public-docs` or commit-message history. Private jobs MUST live under `private-work/{slug}/`, not `currentwork/{slug}/`. The `audit` skill warns on visibility/location mismatch.

## Context

{Why this change is needed. What problem it solves. What prompted it. 2-3 paragraphs max.}

## What Already Exists

{Bullet list of relevant existing code, schemas, components, hooks that can be reused. Include file paths.}

- **Schema/Feature**: Description of what exists (`path/to/file.ts`)

## Feature Overview (N Features, M Phases)

| # | Feature | Phase | Size | Status |
|---|---------|-------|------|--------|
| 1.1 | {Feature name} | 1 - {Phase name} | S/M/L/XL | Planned |

**Size guide**: S = few hours, single file. M = half day, 2-3 files. L = full day, 4+ files. XL = multi-day, new content type + loader + UI.

## Dependency Graph

```
Phase 1: {Name} (1.1 → 1.2)
    │
    v
Phase 2: {Name} (2.1, 2.2) — can run in parallel
    │
    ├──────────┐
    v          v
Phase 3    Phase 4
{Name}     {Name}
```

{Note which phases can run in parallel and which have hard dependencies.}

## New Content Types Required

| Type | Phase | Purpose |
|------|-------|---------|
| {TypeName} | 1 | {One-line purpose} |

{Write "None" if no new types. Types live under `src/content/schemas/`.}

## Critical Files Reference

| File | Role |
|------|------|
| `src/content/schemas/index.ts` | Barrel export of all content model types |
| `path/to/file.ts` | {What this file does and why it matters} |

## Verification Plan

| Phase | Verification |
|-------|-------------|
| 1 | {How to verify phase 1 is working — tests, manual checks, build} |
| All | `npm run lint` — no errors. `npm test` — all pass. `npm run build` — clean |

## Phase Documentation

- [Phase 1: {Name}](./phase-1-{slug}.md)
- [Phase 2: {Name}](./phase-2-{slug}.md)

---

# Phase File Template

Use this structure for each `phase-N-{slug}.md` file:

```markdown
# Phase N: {Name}

**Total Size: S + M + ...**
**Prerequisites: {Phase dependencies or "None"}**
**New Types: {Type names or "None"}**
**New Files: {File paths or "None"}**

---

## Feature N.M: {Feature Name}

**Complexity: S/M/L/XL** — {One-line summary of what this does}

### Problem

{What's wrong or missing. Why the audience needs this. 2-3 sentences.}

### Implementation

{Describe the changes. Use code blocks for type definitions, new interfaces,
and key implementation snippets. Reference exact file paths and line numbers
where modifications happen.}

#### {Subsection per file or logical unit}

**MODIFY** `path/to/file.ts` — {What changes}:

or

**NEW** `path/to/new-file.ts` — {What this file does}:

### Design Decisions

- **{Decision}** — {Rationale. Why this approach over alternatives.}

### Files

| Action | File |
|--------|------|
| MODIFY | `path/to/existing.ts` |
| NEW    | `path/to/new-file.ts` |

---

## Feature N.M+1: {Next Feature}

{Same structure as above}
```

---

# Section IDs for TDD Workflow

Each feature maps to a section ID used by the `/discovery`, `/red`, `/green`, `/refactor` skills:

| Section ID | Feature |
|------------|---------|
| `{area}-N.M` | {Feature name} |

These IDs are used in `pipeline/active/session.yaml` (public jobs) or `pipeline/active/session-private.yaml` (private jobs, gitignored), and as directory names under `pipeline/active/{section-id}/` (public) or `pipeline/private/{section-id}/` (private, gitignored).
