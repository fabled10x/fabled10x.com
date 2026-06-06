# Phase 6: Card Primitives

**Total Size: L + S + S + M**
**Prerequisites: Phases 1–5 complete (tokens, typography, surfaces, chrome, button)**
**New Types: None**
**New Files: `src/components/brand/EditorialCard.tsx`**

Phase 6 unifies every card on the site under one editorial primitive that
enforces the brand's three-level hierarchy: accent tag (Oxblood label,
top) → headline (Cinzel Ink, middle) → subtitle (Inter, below). After this
phase, JobCard, ProductCard, and CohortCard are thin compositions over the
shared primitive — no card on the site picks its own typography, edge, or
spacing rhythm.

---

## Feature 6.1: EditorialCard primitive

**Complexity: L** — `<EditorialCard>` accepts `tag`, `headline`, `subtitle`,
`href`, and optional `footer` slot, renders the three hierarchy levels on
a Marble fill with 1px Ink edge, hover lifts via Bone background tint (no
transform).

### Problem

Five card-like surfaces exist today: `JobCard`, `ProductCard`, `CohortCard`,
the episode entry in `/episodes`, the case entry in `/cases`. Each picks its
own typography, padding, and hover treatment. The brand's three-level
hierarchy is hard to enforce without a single primitive — and the
"headline + subtitle + Oxblood label tag" pattern repeats across every one
of them. One primitive captures the brand pattern; cards consume it.

### Implementation

**NEW** `src/components/brand/EditorialCard.tsx`:

```tsx
import Link from 'next/link';
import type { ReactNode } from 'react';
import { DropAccent, type AccentGlyph } from './DropAccent';

interface EditorialCardProps {
  /** Series tag / category — rendered Oxblood label, top of card. */
  tag?: string;
  /** Card headline — Cinzel display, the eye anchor. */
  headline: string;
  /** Optional oversized accent glyph at the end of the headline. */
  accent?: AccentGlyph;
  /** One-line description below the headline. */
  subtitle?: string;
  /** Optional slot for a footer row (status badge, date, price, etc.). */
  footer?: ReactNode;
  /** If provided, the entire card is a link. */
  href?: string;
  className?: string;
}

export function EditorialCard({
  tag,
  headline,
  accent,
  subtitle,
  footer,
  href,
  className = '',
}: EditorialCardProps) {
  const inner = (
    <article
      className={`
        bg-(--color-marble) text-(--pair-text-on-marble)
        border border-(--color-ink)
        p-(--space-5)
        flex flex-col gap-(--space-3)
        transition-colors duration-150
        ${href ? 'hover:bg-(--color-bone) cursor-pointer' : ''}
        ${className}
      `}
    >
      {tag && <span className="label">{tag}</span>}
      <h3 className="display-3">
        {accent ? <DropAccent glyph={accent} size="inline">{headline}</DropAccent> : headline}
      </h3>
      {subtitle && <p className="body-2 text-(--color-muted)">{subtitle}</p>}
      {footer && <div className="mt-(--space-2) flex items-center gap-(--space-3)">{footer}</div>}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-oxblood) focus-visible:outline-offset-2">
        {inner}
      </Link>
    );
  }
  return inner;
}
```

### Design Decisions

- **Three explicit hierarchy slots.** `tag` → `headline` → `subtitle`.
  Optional `footer` is the fourth element per spec ("a button or end-state
  marker sits at the bottom as a separate element, not a fourth hierarchy
  level"). Keeping `footer` distinctly below preserves the three-level
  rule.
- **Hover tint, no transform.** The brand discipline forbids
  motion-for-decoration. A Marble → Bone background shift on hover is
  enough signal that the card is clickable; no `translate-y`, no scale,
  no shadow.
- **`href` makes the whole card clickable.** Many card surfaces today
  wrap a `Link` around the card and then have a nested `<a>` ("view
  details") — this creates double-click semantics and accessibility issues.
  The primitive picks one pattern: whole card is the link or nothing is.
- **`DropAccent` integration.** Optional `accent` prop activates the
  Oxblood drop-accent from Phase 2.3 at the end of the headline.
  Defaulted off — not every card needs an accent.
- **`<article>` for semantic.** Each editorial card represents a discrete
  content artifact (episode, case, job, product). `<article>` is correct;
  the surrounding grid uses `<ul>`/`<li>` in consumer pages.
- **`focus-visible` on the link, not the article.** Whole-card-clickable
  pattern: focus indicator wraps the whole card.
- **1px Ink edge always.** No `edge` prop — every editorial card has the
  same strong edge. If a quieter card is needed somewhere, that's a
  Bone background (different intent) not a quieter EditorialCard.

### Files

| Action | File |
|--------|------|
| NEW    | `src/components/brand/EditorialCard.tsx` |

---

## Feature 6.2: JobCard refactor

**Complexity: S** — Refactor
`src/components/build-log/JobCard.tsx` to consume `<EditorialCard>`. Job
title becomes the headline, slug + feature count become the subtitle,
`<StatusBadge>` slots into the footer.

### Problem

`JobCard` currently re-implements the editorial layout inline. Now that
`<EditorialCard>` exists, the duplication should collapse.

### Implementation

**MODIFY** `src/components/build-log/JobCard.tsx`:

```tsx
import { EditorialCard } from '@/components/brand/EditorialCard';
import { StatusBadge } from './StatusBadge';
import type { Job } from '@/content/schemas';

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const featureLabel = `${job.featureCount} feature${job.featureCount === 1 ? '' : 's'}`;

  return (
    <EditorialCard
      tag="Build Log"
      headline={job.title}
      subtitle={job.excerpt}
      footer={
        <>
          <StatusBadge status={job.status} />
          <span className="body-3 text-(--color-muted)">{featureLabel}</span>
        </>
      }
      href={`/build-log/jobs/${job.slug}`}
    />
  );
}
```

### Design Decisions

- **Tag = "Build Log".** Constant — every JobCard is a build-log entry.
  Provides the Oxblood label anchor at the top.
- **No accent glyph.** Build-log entries are workmanlike — the editorial
  flourish (DropAccent) is reserved for episode / case headlines.
- **Footer composition.** `StatusBadge` + feature-count text sit side by
  side. Standard editorial card footer pattern.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/build-log/JobCard.tsx` |

---

## Feature 6.3: ProductCard refactor

**Complexity: S** — Refactor
`src/components/products/ProductCard.tsx` onto `<EditorialCard>`. Price
renders in JetBrains Mono (the brand's spec-sheet voice for numbers).

### Problem

Same as 6.2 — the ad-hoc editorial layout collapses onto the primitive.
Numbers in editorial brands work best in monospace; the brand spec calls
out this pattern explicitly for spec-sheet content.

### Implementation

**MODIFY** `src/components/products/ProductCard.tsx`:

```tsx
import { EditorialCard } from '@/components/brand/EditorialCard';
import type { Product } from '@/content/schemas';

interface ProductCardProps {
  product: Product;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <EditorialCard
      tag={product.category}
      headline={product.title}
      subtitle={product.tagline}
      footer={
        <span className="mono text-(--color-ink) text-base">
          {formatPrice(product.priceCents)}
        </span>
      }
      href={`/products/${product.slug}`}
    />
  );
}
```

### Design Decisions

- **Tag = `product.category`.** The category (e.g. "Course", "Toolkit",
  "Template") is the Oxblood label. Variable per product.
- **Price in `mono` utility.** Per brand spec: "Cohort grid fields ...
  all monospace" — and prices read as spec-sheet content. The `mono`
  utility from Phase 2.2 carries the JetBrains family.
- **Price size = base.** Mono numbers at body-3 size read too small;
  base (1rem) is the right weight in the footer row.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/products/ProductCard.tsx` |

---

## Feature 6.4: CohortCard + hero + status reskin

**Complexity: M** — Refactor `CohortCard`, `CohortDetailHero`, and
`CohortStatusBadge` onto the editorial system. Cohort grid fields (start
date, duration, seats, price) all render monospace; the rest is editorial
voice.

### Problem

`CohortCard` is the visually busiest card today — it carries series tag,
title, tagline, start date, duration, seats, and price. The current
implementation uses the placeholder `bg-parchment/40` background as a soft
differentiator. The brand has explicit surface primitives now; rework on
those.

The `CohortDetailHero` is the cohort's page-level entry banner.
`CohortStatusBadge` parallels `StatusBadge` but for enrollment states
(open, waitlist, closed).

### Implementation

**MODIFY** `src/components/cohorts/CohortCard.tsx`:

```tsx
import { EditorialCard } from '@/components/brand/EditorialCard';
import { CohortStatusBadge } from './CohortStatusBadge';
import type { Cohort } from '@/content/schemas';

interface CohortCardProps {
  cohort: Cohort;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function CohortCard({ cohort }: CohortCardProps) {
  return (
    <EditorialCard
      tag={cohort.series}
      headline={cohort.title}
      subtitle={cohort.tagline}
      footer={
        <div className="flex flex-wrap items-center gap-(--space-4) w-full">
          <CohortStatusBadge status={cohort.status} />
          <dl className="flex flex-wrap items-center gap-(--space-3) ml-auto">
            <div className="flex items-center gap-(--space-1)">
              <dt className="label">Starts</dt>
              <dd className="mono text-(--color-ink)">{formatDate(cohort.startDate)}</dd>
            </div>
            <div className="flex items-center gap-(--space-1)">
              <dt className="label">Seats</dt>
              <dd className="mono text-(--color-ink)">{cohort.seatsRemaining}/{cohort.seatsTotal}</dd>
            </div>
            <div className="flex items-center gap-(--space-1)">
              <dt className="label">Price</dt>
              <dd className="mono text-(--color-ink)">${(cohort.priceCents / 100).toFixed(0)}</dd>
            </div>
          </dl>
        </div>
      }
      href={`/cohorts/${cohort.slug}`}
    />
  );
}
```

**MODIFY** `src/components/cohorts/CohortDetailHero.tsx`:

```tsx
import { Marble } from '@/components/brand/Marble';
import { Container } from '@/components/site/Container';
import { Section } from '@/components/brand/Section';
import { DropAccent } from '@/components/brand/DropAccent';
import { CohortStatusBadge } from './CohortStatusBadge';
import type { Cohort } from '@/content/schemas';

interface CohortDetailHeroProps {
  cohort: Cohort;
}

export function CohortDetailHero({ cohort }: CohortDetailHeroProps) {
  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">{cohort.series}</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="→" size="large">{cohort.title}</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">{cohort.tagline}</p>
          <div className="mt-(--space-6) flex items-center gap-(--space-4) border-t border-(--edge-color) pt-(--space-4)">
            <CohortStatusBadge status={cohort.status} />
            <span className="mono">{new Date(cohort.startDate).toLocaleDateString()}</span>
            <span className="mono">·</span>
            <span className="mono">{cohort.duration}</span>
          </div>
        </Container>
      </Section>
    </Marble>
  );
}
```

**MODIFY** `src/components/cohorts/CohortStatusBadge.tsx`:

```tsx
import type { CohortStatus } from '@/content/schemas';

interface CohortStatusBadgeProps {
  status: CohortStatus;
}

const variantClass: Record<CohortStatus, string> = {
  open: 'bg-(--color-marble) text-(--color-verdigris) border-(--color-verdigris)',
  waitlist: 'bg-(--color-parchment) text-(--color-ink) border-(--edge-color)',
  closed: 'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle)',
};

const variantLabel: Record<CohortStatus, string> = {
  open: 'Enrolling',
  waitlist: 'Waitlist',
  closed: 'Closed',
};

export function CohortStatusBadge({ status }: CohortStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-(--space-1) label border px-(--space-2) py-px ${variantClass[status]}`}
      aria-label={`Cohort status: ${variantLabel[status]}`}
    >
      {variantLabel[status]}
    </span>
  );
}
```

### Design Decisions

- **`open` → Verdigris.** Enrollment open is a completion / success
  state ("you can act on this") — Verdigris reads correctly.
- **`waitlist` → Ink-on-Parchment.** Active engagement available but
  not direct purchase — the in-motion neutral.
- **`closed` → muted Bone.** Resting / inactive — same family as
  `planned`/`unknown` from StatusBadge.
- **Cohort hero uses `width="prose"`.** Single-cohort detail page is
  reading-heavy; tighten the container.
- **`→` DropAccent on cohort hero.** Cohorts are forward-looking
  ("this is what's next"); the arrow is the right accent vocabulary.
  Episodes get `?` (curiosity), cases get `.` (closure), cohorts get `→`
  (forward).
- **Definition-list (`<dl>`) for stats.** Semantic markup for label /
  value pairs. Screen readers read "Starts: Mar 4, 2026" as one
  relationship.
- **Stats inline in mono.** Spec-sheet voice. The cohort card
  communicates dense practical info; mono treats numbers as artifacts.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/cohorts/CohortCard.tsx` |
| MODIFY | `src/components/cohorts/CohortDetailHero.tsx` |
| MODIFY | `src/components/cohorts/CohortStatusBadge.tsx` |

---

## Phase 6 Exit Criteria

- `<EditorialCard>` enforces the three-level hierarchy; documented examples
  in a sandbox / Storybook-like route.
- `JobCard`, `ProductCard`, `CohortCard` all collapse to thin compositions
  over `<EditorialCard>`. No card renders its own typography, edge, or
  hover state.
- `CohortDetailHero` renders against the editorial system with the `→`
  DropAccent.
- `CohortStatusBadge` mirrors the `StatusBadge` pattern with cohort-specific
  variants.
- `npm test` — forbidden-pattern sentinel green.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean.
- Visual walk: `/build-log`, `/products`, `/cohorts`, `/cohorts/<slug>`
  all render brand-consistent cards / hero.
