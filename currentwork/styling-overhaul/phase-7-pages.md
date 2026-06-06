# Phase 7: Page Surfaces

**Total Size: L + M + M + L + M + M**
**Prerequisites: Phases 1–6 complete (tokens, typography, surfaces, chrome, primitives, cards)**
**New Types: None**
**New Files: `src/app/not-found.tsx`, `src/app/error.tsx` (if not already present)**

Phase 7 reskins every public page surface against the new brand. Sections
7.2 through 7.6 can all run in parallel — they depend only on Phases 3–6
and don't share files. Section 7.1 owns the homepage hero, the brand's
single brushstroke-seam composition, and is the most visible page so
should land first.

---

## Feature 7.1: Homepage hero

**Complexity: L** — Rebuild `src/app/page.tsx` around the brand's
brushstroke-seam composition: marble overlay on the left containing the
series tag, Cinzel headline crossing into the photo zone, Inter subtitle,
EmailCapture, and DropAccent at the end of the headline. Below the fold,
section entries gated by `<SectionDivider>`.

### Problem

The homepage is the brand's single highest-stakes surface. The current
`/` is a placeholder that lays out latest episode + section entries in
plain editorial cards. The brand spec defines the homepage hero as the
canonical brushstroke-seam composition — implementing it here makes the
brand legible from the first scroll.

### Implementation

**MODIFY** `src/app/page.tsx`:

```tsx
import { Marble } from '@/components/brand/Marble';
import { Bone } from '@/components/brand/Bone';
import { BrushstrokeSeam } from '@/components/brand/BrushstrokeSeam';
import { Section } from '@/components/brand/Section';
import { SectionDivider } from '@/components/brand/SectionDivider';
import { Container } from '@/components/site/Container';
import { DropAccent } from '@/components/brand/DropAccent';
import { EditorialCard } from '@/components/brand/EditorialCard';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { getLatestEpisode } from '@/lib/content/episodes';
import Image from 'next/image';

export default async function HomePage() {
  const latest = await getLatestEpisode();

  return (
    <>
      {/* Hero — brushstroke-seam composition */}
      <BrushstrokeSeam
        direction="left"
        feather="10rem"
        foreground="var(--color-marble)"
        background="var(--color-shadow)"
        backgroundContent={
          <Image
            src="/hero/marble-column.jpg"
            alt=""
            fill
            priority
            className="object-cover opacity-90"
          />
        }
      >
        <Section rhythm="lg">
          <Container className="grid grid-cols-1 md:grid-cols-2 gap-(--space-7)">
            <div className="md:max-w-prose flex flex-col gap-(--space-5)">
              <span className="label">The Fabled 10X Developer</span>
              <h1 className="display-1">
                <DropAccent glyph="?" size="large">Build the whole thing alone</DropAccent>
              </h1>
              <p className="body-1 text-(--color-muted)">
                One person. An agent team. Full SaaS delivery — episodes,
                playbooks, and the open library of how it's done.
              </p>
              <EmailCapture source="home-hero" buttonLabel="Join the library" />
            </div>
            {/* Right column is the visible photo zone — intentionally empty for composition */}
          </Container>
        </Section>
      </BrushstrokeSeam>

      <SectionDivider top="var(--color-marble)" bottom="var(--color-parchment)" />

      {/* Latest episode */}
      {latest && (
        <Section rhythm="md" className="bg-(--color-parchment)">
          <Container>
            <span className="label">Latest Episode</span>
            <div className="mt-(--space-4)">
              <EditorialCard
                tag={`${latest.series} · Act ${latest.act}`}
                headline={latest.title}
                subtitle={latest.summary}
                accent="?"
                href={`/episodes/${latest.slug}`}
              />
            </div>
          </Container>
        </Section>
      )}

      <SectionDivider top="var(--color-parchment)" bottom="var(--color-marble)" />

      {/* Section entries */}
      <Section rhythm="md">
        <Container>
          <h2 className="display-2">The library</h2>
          <ul className="mt-(--space-5) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
            <li>
              <EditorialCard
                tag="Catalog"
                headline="Episodes"
                subtitle="Flagship series, playbooks, shorts, livestreams."
                href="/episodes"
              />
            </li>
            <li>
              <EditorialCard
                tag="Field Notes"
                headline="Case Studies"
                subtitle="Production builds with research, decisions, outcomes."
                href="/cases"
              />
            </li>
            <li>
              <EditorialCard
                tag="In Progress"
                headline="Build Log"
                subtitle="Every job's plan, phases, and post-mortem."
                href="/build-log"
              />
            </li>
            <li>
              <EditorialCard
                tag="Storefront"
                headline="Products"
                subtitle="Toolkits, templates, and cohort programs."
                href="/products"
              />
            </li>
          </ul>
        </Container>
      </Section>

      <SectionDivider top="var(--color-marble)" bottom="var(--color-bone)" />

      {/* Sister project callout */}
      <Bone>
        <Section rhythm="md">
          <Container width="prose" className="text-center">
            <span className="label">Sister Project</span>
            <h2 className="display-2 mt-(--space-3)">
              <DropAccent glyph="→">The Large Language Library</DropAccent>
            </h2>
            <p className="body-1 mt-(--space-4) text-(--color-muted)">
              Our public, AI-optimized knowledge base. Every episode here
              links out to entries there.
            </p>
            <a
              href="https://largelanguagelibrary.ai"
              target="_blank"
              rel="noreferrer"
              className="mt-(--space-5) inline-block label text-(--color-verdigris) border-b border-(--color-verdigris) pb-(--space-1)"
            >
              largelanguagelibrary.ai →
            </a>
          </Container>
        </Section>
      </Bone>
    </>
  );
}
```

### Design Decisions

- **Headline crosses the seam.** The right edge of the headline visually
  extends past the marble overlay into the photo zone. The brushstroke
  feather is `10rem`, sized to let "alone" cross the seam on desktop
  while remaining contained on mobile.
- **`marble-column.jpg` as the default background.** A marble-column /
  manuscript-page texture is brand-correct. If the user provides a
  custom photo, swap the `src`. Defaults defined per the open item in
  the README.
- **Hero label is the channel name, not a series tag.** The hero
  introduces the brand; the rest of the homepage introduces sections.
  Label hierarchy: channel name → section name → category.
- **DropAccent uses `?`.** The brand's opening question — "can you
  actually build the whole thing alone?" — encoded in the punctuation.
- **Three SectionDividers.** One between hero and latest-episode, one
  between latest and section entries, one between section entries and
  sister-project. Each is a brushstroke transition; the rhythm carries
  the brand's signature throughout the page without overloading any
  single seam.
- **Section entries as `<ul>` / `<li>` of EditorialCards.** Semantic
  list of navigational targets.
- **Sister-project section on Bone.** Differentiates it from the rest of
  the page; positions it as the "completion" footnote (Verdigris-on-Bone,
  same treatment as the Footer's LLL link).

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/page.tsx` |
| NEW    | `public/hero/marble-column.jpg` (or whatever texture lands) |

---

## Feature 7.2: Episodes index + detail

**Complexity: M** — `/episodes` becomes an editorial grid of
`<EditorialCard>` per episode; `/episodes/[slug]` renders as a marble
manuscript — Roman numerals for series/act/episode, Cinzel chapter
headings, Inter body via `.build-log-prose` (retrofitted in Phase 2.4).

### Problem

The current episodes pages render in the placeholder palette. The brand
spec encourages Roman numerals for numerals and a manuscript-page
treatment for long-form reading. Detail pages especially need this
transformation; the index just needs to swap card primitives.

### Implementation

**MODIFY** `src/app/episodes/page.tsx`:

```tsx
import { Marble } from '@/components/brand/Marble';
import { Section } from '@/components/brand/Section';
import { Container } from '@/components/site/Container';
import { EditorialCard } from '@/components/brand/EditorialCard';
import { getAllEpisodes } from '@/lib/content/episodes';

export const metadata = { title: 'Episodes' };

function toRoman(n: number): string {
  const map: [number, string][] = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let result = '';
  for (const [val, sym] of map) {
    while (n >= val) { result += sym; n -= val; }
  }
  return result;
}

export default async function EpisodesPage() {
  const episodes = await getAllEpisodes();
  return (
    <Marble>
      <Section rhythm="md">
        <Container>
          <span className="label">Catalog</span>
          <h1 className="display-1 mt-(--space-3)">Episodes</h1>
          <p className="body-1 mt-(--space-4) text-(--color-muted) max-w-prose">
            Flagship series, playbooks, shorts, livestreams. Newest first.
          </p>
          <ul className="mt-(--space-7) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
            {episodes.map((ep) => (
              <li key={ep.slug}>
                <EditorialCard
                  tag={`${ep.series} · ${toRoman(ep.act)}.${toRoman(ep.episode)}`}
                  headline={ep.title}
                  subtitle={ep.summary}
                  accent="?"
                  href={`/episodes/${ep.slug}`}
                />
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </Marble>
  );
}
```

**MODIFY** `src/app/episodes/[slug]/page.tsx` — the detail page renders
the MDX body through `MarkdownDocument` + `.build-log-prose`, with a
manuscript-style hero above:

```tsx
import { notFound } from 'next/navigation';
import { Marble } from '@/components/brand/Marble';
import { Section } from '@/components/brand/Section';
import { Container } from '@/components/site/Container';
import { DropAccent } from '@/components/brand/DropAccent';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { getEpisodeBySlug, getAllEpisodes } from '@/lib/content/episodes';
// toRoman from a shared helper or inlined

export async function generateStaticParams() {
  const eps = await getAllEpisodes();
  return eps.map(e => ({ slug: e.slug }));
}

export const dynamicParams = false;

interface EpisodeDetailParams { params: Promise<{ slug: string }> }

export default async function EpisodeDetail({ params }: EpisodeDetailParams) {
  const { slug } = await params;
  const ep = await getEpisodeBySlug(slug);
  if (!ep) return notFound();

  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">{ep.series} · Act {toRoman(ep.act)} · Episode {toRoman(ep.episode)}</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="?" size="large">{ep.title}</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">{ep.summary}</p>

          <div className="mt-(--space-7) border-t border-(--edge-color) pt-(--space-7)">
            <MarkdownDocument source={ep.body} className="build-log-prose" />
          </div>

          {ep.lllEntryUrls?.length > 0 && (
            <div className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)">
              <LllCrosslinks urls={ep.lllEntryUrls} />
            </div>
          )}
        </Container>
      </Section>
    </Marble>
  );
}
```

### Design Decisions

- **Roman numerals for act/episode.** Per spec — "Roman or Greek numerals
  where numerals appear." Provides instant editorial signal vs. the
  arabic-numeric AI-startup default.
- **`toRoman` inline helper or shared util.** If multiple pages use it,
  move to `src/lib/format/roman.ts` — Phase 7.2 owns deciding based on
  whether 7.3 also wants Roman numerals (cases probably don't).
- **Detail page uses `width="prose"`.** Long-form reading.
- **`accent="?"` on episode titles.** Episodes ask questions; the `?`
  is the right vocabulary.
- **Border-t for section separators.** Within a manuscript page, the
  brushstroke seam would be too loud. 1px Ink rules read as
  manuscript-page section breaks.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/episodes/page.tsx` |
| MODIFY | `src/app/episodes/[slug]/page.tsx` |
| MODIFY | `src/components/crosslinks/LllCrosslinks.tsx` (Verdigris-on-Bone treatment) |
| NEW    | `src/lib/format/roman.ts` (if shared) |

---

## Feature 7.3: Cases index + detail

**Complexity: M** — `/cases` and `/cases/[slug]` mirror the episodes
pattern with a "spec-sheet sidebar" treatment: client name + dates +
status render in JetBrains Mono as a labeled definition list on the
detail page.

### Problem

Case studies are denser than episodes — they carry client metadata,
dates, status, deliverables, outcomes. The editorial system handles the
narrative; the spec-sheet sidebar handles the artifact metadata.

### Implementation

**MODIFY** `src/app/cases/page.tsx` — mirror the episodes index pattern,
swapping the tag/accent vocabulary:

```tsx
// ... same Marble/Section/Container shell ...
<span className="label">Field Notes</span>
<h1 className="display-1 mt-(--space-3)">Case Studies</h1>
// ...
<EditorialCard
  tag={cse.client}
  headline={cse.title}
  subtitle={cse.summary}
  accent="."
  href={`/cases/${cse.slug}`}
  footer={<CaseStatusBadge status={cse.status} />}
/>
```

**MODIFY** `src/app/cases/[slug]/page.tsx`:

```tsx
// shell: Marble / Section rhythm="lg" / Container width="prose"
<span className="label">{cse.industry}</span>
<h1 className="display-1 mt-(--space-3)">
  <DropAccent glyph="." size="large">{cse.title}</DropAccent>
</h1>
<p className="body-1 mt-(--space-5) text-(--color-muted)">{cse.summary}</p>

{/* Spec-sheet sidebar */}
<aside className="mt-(--space-6) border-t border-b border-(--edge-color) py-(--space-4)">
  <dl className="grid grid-cols-1 md:grid-cols-3 gap-(--space-4)">
    <div>
      <dt className="label">Client</dt>
      <dd className="mono mt-(--space-1)">{cse.client}</dd>
    </div>
    <div>
      <dt className="label">Engagement</dt>
      <dd className="mono mt-(--space-1)">{cse.startDate} → {cse.endDate ?? 'ongoing'}</dd>
    </div>
    <div>
      <dt className="label">Status</dt>
      <dd className="mt-(--space-1)"><CaseStatusBadge status={cse.status} /></dd>
    </div>
  </dl>
</aside>

<div className="mt-(--space-7)">
  <MarkdownDocument source={cse.body} className="build-log-prose" />
</div>
```

### Design Decisions

- **`accent="."` on cases.** Cases are closed loops — "we did this, here's
  what happened." A period reads as completion. (Episodes ask, cases
  close.)
- **Spec-sheet as `<dl>`.** Same pattern as the cohort hero. Semantic
  label/value relationship; screen readers handle correctly.
- **Border top + bottom, no card.** The spec sheet sits in the
  manuscript page, not as a surface-distinct artifact.
- **`endDate ?? 'ongoing'`.** Engagements without an end date render
  "ongoing" rather than empty — the spec sheet should never have a
  dangling field.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/cases/page.tsx` |
| MODIFY | `src/app/cases/[slug]/page.tsx` |
| MODIFY | `src/components/cases/CaseStatusBadge.tsx` (if it exists; otherwise inline at the page) |

---

## Feature 7.4: Build-log surfaces

**Complexity: L** — `/build-log` (jobs index), `/build-log/jobs/[slug]`
(job overview), `/build-log/jobs/[slug]/[phase]` (phase detail), and
`/build-log/status` (aggregate dashboard) all reskin to Bone background
surfaces with Parchment inner panels for log content. `JobsRollupTable`
and `PhaseNav` get the editorial treatment.

### Problem

The build-log is the most content-dense section of the site (every job's
phases × every phase's progress). The placeholder palette renders it as
generic dashboard chrome. The brand needs it to read as "the archive room
of the library" — Bone surfaces (workspace), Parchment inner panels (the
log itself), Cinzel headings, JetBrains Mono for any code / log content.

### Implementation

**MODIFY** `src/app/build-log/page.tsx`:

```tsx
// shell: Bone / Section / Container width="wide"
<span className="label">In Progress</span>
<h1 className="display-1 mt-(--space-3)">Build Log</h1>
<p className="body-1 mt-(--space-4) text-(--color-muted) max-w-prose">
  Every job's plan, phases, and post-mortem. Updated as work proceeds.
</p>

<div className="mt-(--space-7)">
  <JobsRollupTable jobs={jobs} />
</div>

<div className="mt-(--space-8)">
  <h2 className="display-2">All Jobs</h2>
  <ul className="mt-(--space-5) grid grid-cols-1 md:grid-cols-2 gap-(--space-4)">
    {jobs.map(j => <li key={j.slug}><JobCard job={j} /></li>)}
  </ul>
</div>
```

**MODIFY** `src/app/build-log/jobs/[slug]/page.tsx`:

```tsx
// shell: Bone / Section / Container width="prose"
<span className="label">{job.status}</span>
<h1 className="display-1 mt-(--space-3)">{job.title}</h1>
<StatusBadge status={job.status} className="mt-(--space-3)" />

<div className="mt-(--space-7)">
  <PhaseNav slug={job.slug} phases={job.phases} />
</div>

{/* Parchment inner panel for the README body */}
<Parchment edge="strong" className="mt-(--space-7) p-(--space-6)">
  <MarkdownDocument source={job.readme} className="build-log-prose" />
</Parchment>
```

**MODIFY** `src/app/build-log/jobs/[slug]/[phase]/page.tsx`:

Same shell as job overview; the phase body sits inside a Parchment panel
with the `.build-log-prose` retrofit handling Cinzel headings, Shadow
code blocks, Oxblood blockquote rule.

**MODIFY** `src/app/build-log/status/page.tsx`:

Dashboard view of all jobs. Bone surface, JobsRollupTable as the main
content, no inner panel (the table is the artifact).

**MODIFY** `src/components/build-log/JobsRollupTable.tsx`:

```tsx
// Wrap in <Marble edge="strong"> with editorial table treatment:
// - <thead> bg-(--color-bone), label utility for th text
// - <tbody> tr borders, mono for numeric columns (features count, progress %)
// - StatusBadge in the status column
// - Hover state: tr bg-(--color-parchment)
```

**MODIFY** `src/components/build-log/PhaseNav.tsx`:

```tsx
// Restyle as a horizontal scroll-rail of phase chips:
// - Each phase: label, current/completed/upcoming state
// - Active: Oxblood underline + Ink text
// - Completed: Verdigris ✓ + Ink text
// - Upcoming: muted Ink
// - Inline-flex, gap-(--space-3)
```

### Design Decisions

- **Bone as the build-log primary surface.** Differentiates it from
  Marble (homepage / episodes / cases) and Parchment (footer). The
  archive-room metaphor: Bone is the workbench, Parchment is the
  document on it.
- **Parchment inner panel with strong edge.** The MDX content reads
  as the "live document" — visually nested inside the workbench.
- **`width="wide"` on index/status.** Tables need horizontal room.
  Detail pages use `width="prose"` because they're reading-heavy.
- **Mono in tabular columns.** Features count, progress %, dates —
  all spec-sheet content.
- **PhaseNav as a chip rail.** Phases are a small linear sequence;
  a chip rail is more legible than tabs (which imply switching).

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/build-log/page.tsx` |
| MODIFY | `src/app/build-log/jobs/[slug]/page.tsx` |
| MODIFY | `src/app/build-log/jobs/[slug]/[phase]/page.tsx` |
| MODIFY | `src/app/build-log/status/page.tsx` |
| MODIFY | `src/components/build-log/JobsRollupTable.tsx` |
| MODIFY | `src/components/build-log/PhaseNav.tsx` |

---

## Feature 7.5: Storefront reskin

**Complexity: M** — `/products`, `/products/[slug]`,
`/products/account`, `/products/account/purchases/[id]`,
`/cohorts`, `/cohorts/[slug]` all reskin against the editorial system.
`BuyButton` (already updated in Phase 5.4) carries the storefront CTA;
account pages render as a quiet workspace.

### Problem

The storefront has multiple page types: product index, product detail,
purchases list, individual purchase / download page. Each was placeholder.
The reskin should make the storefront feel like the same library — not a
generic Stripe-template e-commerce site.

### Implementation

**MODIFY** `src/app/products/page.tsx`:

```tsx
// Marble / Section / Container
<span className="label">Storefront</span>
<h1 className="display-1 mt-(--space-3)">Products</h1>
// Grid of ProductCard
```

**MODIFY** `src/app/products/[slug]/page.tsx`:

```tsx
// Marble / Section rhythm="lg" / Container width="prose"
<span className="label">{product.category}</span>
<h1 className="display-1 mt-(--space-3)">{product.title}</h1>
<p className="body-1 mt-(--space-5) text-(--color-muted)">{product.tagline}</p>

<div className="mt-(--space-7) border-t border-b border-(--edge-color) py-(--space-4) flex items-center justify-between gap-(--space-4)">
  <span className="mono text-2xl">${(product.priceCents / 100).toFixed(0)}</span>
  <BuyButton productSlug={product.slug} price={product.priceCents} />
</div>

<div className="mt-(--space-7)">
  <MarkdownDocument source={product.body} className="build-log-prose" />
</div>
```

**MODIFY** `src/app/products/account/page.tsx`:

```tsx
// Bone / Section / Container width="layout"
<span className="label">Your Account</span>
<h1 className="display-2 mt-(--space-3)">{user.email}</h1>
<div className="mt-(--space-7)"><PurchaseList purchases={purchases} /></div>
<div className="mt-(--space-7)"><SignOutButton /></div>
```

**MODIFY** `src/app/products/account/purchases/[id]/page.tsx`:

```tsx
// Bone / Section / Container width="prose"
<span className="label">Purchase</span>
<h1 className="display-2 mt-(--space-3)">{purchase.product.title}</h1>
<aside className="mt-(--space-5) border-t border-b border-(--edge-color) py-(--space-3)">
  <dl className="grid grid-cols-3 gap-(--space-3)">
    <div><dt className="label">Order</dt><dd className="mono">{purchase.id}</dd></div>
    <div><dt className="label">Date</dt><dd className="mono">{purchase.purchasedAt}</dd></div>
    <div><dt className="label">Amount</dt><dd className="mono">${(purchase.amountCents/100).toFixed(0)}</dd></div>
  </dl>
</aside>
{/* Download links / next steps below */}
```

**MODIFY** `src/app/cohorts/page.tsx`, `src/app/cohorts/[slug]/page.tsx`:

Same shell pattern as episodes / cases — Marble surface, editorial card
grid for the index, `CohortDetailHero` (reskinned in Phase 6.4) for the
detail page, body content via `.build-log-prose`.

### Design Decisions

- **Storefront is Marble (products) + Bone (account).** Products are
  what visitors browse; Marble is the public surface. Account is
  private workspace; Bone signals "this is yours."
- **Price + Buy as a horizontal bar.** Between the title block and the
  body content. The bar reads as the purchase moment — separated from
  marketing copy above and product details below.
- **Purchase detail uses `<dl>` spec sheet.** Same pattern as case
  studies — receipt-as-spec-sheet.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/products/page.tsx` |
| MODIFY | `src/app/products/[slug]/page.tsx` |
| MODIFY | `src/app/products/account/page.tsx` |
| MODIFY | `src/app/products/account/purchases/[id]/page.tsx` |
| MODIFY | `src/app/cohorts/page.tsx` |
| MODIFY | `src/app/cohorts/[slug]/page.tsx` |
| MODIFY | `src/components/account/PurchaseList.tsx` |

---

## Feature 7.6: About + auth + error pages

**Complexity: M** — `/about`, `/login`, `/login/verify`, and the
not-found / error boundaries reskin against quiet marble surfaces. No
brushstroke. Each page is a small, deliberate manuscript page.

### Problem

These pages are the brand's quiet moments: about (the channel's story),
auth (a transient gate), errors (something failed). The brand voice here
is restraint — pure type on marble, no decorative composition. They're
also where casual visitors land directly from search; getting them
brand-correct without distraction matters.

### Implementation

**MODIFY** `src/app/about/page.tsx`:

```tsx
import { Marble } from '@/components/brand/Marble';
import { Section } from '@/components/brand/Section';
import { Container } from '@/components/site/Container';
import { DropAccent } from '@/components/brand/DropAccent';

export const metadata = { title: 'About' };

export default function AboutPage() {
  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">The Channel</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph=".">The Fabled 10X Developer</DropAccent>
          </h1>
          <div className="mt-(--space-7) build-log-prose">
            <p>
              fabled10x is the brand and marketing site for the Fabled10X
              YouTube channel. One person. An agent team. Full SaaS delivery.
            </p>
            {/* ... full about copy ... */}
            <h2>The library</h2>
            <p>
              Our sister project, The Large Language Library, is the
              AI-optimized knowledge base. Every episode here links there.
            </p>
          </div>
        </Container>
      </Section>
    </Marble>
  );
}
```

**MODIFY** `src/app/login/page.tsx`:

```tsx
// Marble / Section / Container width="prose"
<span className="label">Account</span>
<h1 className="display-2 mt-(--space-3)">Sign in to the library</h1>
<p className="body-1 mt-(--space-4) text-(--color-muted)">
  We send a one-time link to your email — no password needed.
</p>
<div className="mt-(--space-7)"><SignInForm /></div>
```

**MODIFY** `src/app/login/verify/page.tsx`:

```tsx
// Marble / Section / Container width="prose"
<span className="label">Check your email</span>
<h1 className="display-2 mt-(--space-3)">
  <DropAccent glyph="✓">A sign-in link is on its way</DropAccent>
</h1>
<p className="body-1 mt-(--space-4) text-(--color-muted)">
  Open the message we just sent. Link expires in 15 minutes.
</p>
```

**NEW or MODIFY** `src/app/not-found.tsx`:

```tsx
import { Marble } from '@/components/brand/Marble';
import { Section } from '@/components/brand/Section';
import { Container } from '@/components/site/Container';
import { DropAccent } from '@/components/brand/DropAccent';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose" className="text-center">
          <span className="label">404</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="✕">No entry by that name</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            The page you asked for isn't in the library.
          </p>
          <Link href="/" className="label text-(--color-oxblood) mt-(--space-5) inline-block border-b border-(--color-oxblood) pb-(--space-1)">
            Return home →
          </Link>
        </Container>
      </Section>
    </Marble>
  );
}
```

**NEW or MODIFY** `src/app/error.tsx`:

Same pattern as not-found, with the error message + a retry CTA via
`<Button>` (calling the `reset` prop Next.js passes to error boundaries).

### Design Decisions

- **No brushstroke on these pages.** Per locked decision — brushstroke
  is reserved for the homepage hero and the SectionDivider primitive.
  Quiet pages stay quiet.
- **DropAccent vocabulary per page.** About uses `.` (this is who we are,
  full stop). Login-verify uses `✓` (action completed). Not-found uses
  `✕` (gentle refusal). Error uses `✕` or `?` depending on context.
- **`width="prose"` everywhere here.** All four pages are reading
  surfaces.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/about/page.tsx` |
| MODIFY | `src/app/login/page.tsx` |
| MODIFY | `src/app/login/verify/page.tsx` |
| NEW or MODIFY | `src/app/not-found.tsx` |
| NEW or MODIFY | `src/app/error.tsx` |

---

## Phase 7 Exit Criteria

- Every public route renders against the brand. No placeholder palette
  anywhere in the page tree.
- Homepage hero shows the brushstroke-seam composition with the headline
  crossing the seam and DropAccent at the end.
- Episodes / cases detail pages render as marble manuscript pages with
  Roman numerals, Cinzel headings, Inter body via `.build-log-prose`.
- Build-log surfaces use Bone backgrounds with Parchment inner panels.
- Storefront and account pages match the editorial system.
- About / auth / error pages are quiet marble compositions with no
  brushstroke.
- `npm test` — forbidden-pattern sentinel green; legibility + contrast
  sentinels (Phase 9) still pending but every page contributes to their
  pass.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean.
- Manual walk: every URL in the route inventory loads and looks
  brand-consistent.
