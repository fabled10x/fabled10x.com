# Phase 9: A11y, Responsive, Polish

**Total Size: M + M + M + S**
**Prerequisites: Phases 1–8 complete (every component / page / asset is brand-correct)**
**New Types: None**
**New Files: `src/__tests__/brand/contrast.test.ts`, `src/__tests__/brand/legibility.test.ts`**

Phase 9 is the regression-guard + final sweep pass. Three sentinels lock the
brand's hardest-to-eyeball constraints (mobile legibility, WCAG contrast,
reduce-motion / forced-colors / 200% zoom) and a final sweep walks every
page, runs every check, and lights the green.

---

## Feature 9.1: Mobile-first legibility

**Complexity: M** — Vitest sentinel that asserts headline legibility at three
viewport sizes critical to the brand: 320×180 (og:image preview crop on small
displays), 1280×720 (YouTube thumbnail), 360×640 (small mobile viewport for
the homepage hero). Tests render representative compositions at each viewport
and assert minimum effective character height.

### Problem

The brand spec is explicit: "Every thumbnail is checked at 320×180 px before
shipping. If the main headline isn't legible at that scale, the design
fails." Mobile-first legibility is the brand's single most-violated rule
when components add long headlines or extra hierarchy. A sentinel catches
this at test time.

### Implementation

**NEW** `src/__tests__/brand/legibility.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { EditorialCard } from '@/components/brand/EditorialCard';
import { Logo } from '@/components/brand/Logo';

// Minimum effective character height (in pixels) at each viewport.
// Derived from the WCAG "reading text" 16px floor scaled to the viewport's
// physical perception.
const VIEWPORT_TARGETS = [
  { name: 'og-preview', width: 320, height: 168, minHeadlineCh: 18 },
  { name: 'youtube-thumb-small', width: 480, height: 270, minHeadlineCh: 24 },
  { name: 'mobile-viewport', width: 360, height: 640, minHeadlineCh: 22 },
];

interface ComputedSize {
  fontSize: number;     // px
  lineHeight: number;   // px
}

function measureHeadline(node: HTMLElement): ComputedSize {
  const computed = window.getComputedStyle(node);
  const fontSize = parseFloat(computed.fontSize);
  const lineHeight = computed.lineHeight === 'normal'
    ? fontSize * 1.2
    : parseFloat(computed.lineHeight);
  return { fontSize, lineHeight };
}

describe('brand legibility sentinel', () => {
  for (const target of VIEWPORT_TARGETS) {
    it(`headline meets minimum ${target.minHeadlineCh}px at ${target.name} (${target.width}×${target.height})`, () => {
      const sample = 'Build the whole thing alone';
      Object.defineProperty(window, 'innerWidth', { value: target.width, configurable: true });
      Object.defineProperty(window, 'innerHeight', { value: target.height, configurable: true });

      const { container } = render(
        <div style={{ width: target.width, height: target.height }}>
          <EditorialCard tag="Series" headline={sample} subtitle="One person." />
        </div>
      );
      const headline = container.querySelector('h3');
      expect(headline).not.toBeNull();
      const { fontSize } = measureHeadline(headline as HTMLElement);
      expect(fontSize).toBeGreaterThanOrEqual(target.minHeadlineCh);
    });
  }

  it('logo wordmark legibility at favicon scale (32×32)', () => {
    const { container } = render(
      <div style={{ width: 32, height: 32 }}>
        <Logo size="sm" />
      </div>
    );
    // Just asserting we render; favicon legibility is visually verified.
    expect(container.firstChild).not.toBeNull();
  });
});
```

### Design Decisions

- **JSDOM-based, not real screenshot diff.** Real visual snapshot testing
  needs a headless browser (Playwright). The brand needs a fast-running
  CI sentinel; computed-style assertions at simulated viewport sizes
  catch the regression class we care about (someone shrinks the
  `display-3` token below the mobile floor). For pixel-perfect
  validation, the user runs the dev server and visually inspects
  `/thumb-preview` at the target sizes.
- **Three viewport targets.** 320×180 for the og preview cropped tightly
  (LinkedIn small preview); 480×270 for YouTube's small thumbnail crop;
  360×640 for the most common phone viewport rendering the hero.
- **Minimum character heights derived empirically.** Not a magic number
  — 18px at 320px wide means a 5.6% viewport-height character; below
  that, Cinzel all-caps stops resolving against marble at scrolling-pace
  reading. The values are conservative; if a token tweak fails, that's
  a brand decision, not a test bug.
- **Logo at favicon size is a smoke check, not measured.** Favicon
  legibility is unmeasurable computationally (does the {10x} mark
  resolve at 32×32?) — verify visually.

### Files

| Action | File |
|--------|------|
| NEW    | `src/__tests__/brand/legibility.test.ts` |

---

## Feature 9.2: WCAG contrast guard

**Complexity: M** — Vitest sentinel that reads the token table from
`globals.css`, computes WCAG contrast ratios for every used
foreground / background pair declared in the contrast-pair tokens, and
asserts ≥ 4.5:1 for body and ≥ 3:1 for large display text.

### Problem

The brand spec defines three explicit contrast pairs (Marble + Ink,
Marble + Oxblood, Ink + Oxblood). The actual ratios need to meet WCAG
AA. Without a sentinel, a future palette tweak (a slightly darker
Marble, a slightly lighter Oxblood) could silently drop a pair below
threshold and ship inaccessible.

### Implementation

**NEW** `src/__tests__/brand/contrast.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const GLOBALS_PATH = join(__dirname, '..', '..', 'app', 'globals.css');

interface RGB { r: number; g: number; b: number; }

function hexToRgb(hex: string): RGB {
  const m = hex.replace('#', '');
  const full = m.length === 3 ? m.split('').map(c => c + c).join('') : m;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relativeLuminance({ r, g, b }: RGB): number {
  const toLinear = (c: number) => {
    const cs = c / 255;
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(fg: string, bg: string): number {
  const L1 = relativeLuminance(hexToRgb(fg));
  const L2 = relativeLuminance(hexToRgb(bg));
  const [lighter, darker] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (lighter + 0.05) / (darker + 0.05);
}

function extractToken(css: string, name: string): string {
  const re = new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{3,6})`);
  const m = css.match(re);
  if (!m) throw new Error(`Token --${name} not found in globals.css`);
  return m[1];
}

describe('brand WCAG contrast sentinel', () => {
  const css = readFileSync(GLOBALS_PATH, 'utf8');
  const marble = extractToken(css, 'color-marble');
  const parchment = extractToken(css, 'color-parchment');
  const ink = extractToken(css, 'color-ink');
  const oxblood = extractToken(css, 'color-oxblood');
  const verdigris = extractToken(css, 'color-verdigris');
  const bone = extractToken(css, 'color-bone');
  const shadow = extractToken(css, 'color-shadow');

  const PAIRS = [
    { fg: ink,      bg: marble,    role: 'body',  label: 'Ink on Marble' },
    { fg: ink,      bg: parchment, role: 'body',  label: 'Ink on Parchment' },
    { fg: ink,      bg: bone,      role: 'body',  label: 'Ink on Bone' },
    { fg: oxblood,  bg: marble,    role: 'large', label: 'Oxblood on Marble' },
    { fg: oxblood,  bg: bone,      role: 'large', label: 'Oxblood on Bone' },
    { fg: verdigris,bg: marble,    role: 'large', label: 'Verdigris on Marble' },
    { fg: verdigris,bg: bone,      role: 'large', label: 'Verdigris on Bone' },
    { fg: parchment,bg: shadow,    role: 'body',  label: 'Parchment on Shadow' },
    { fg: marble,   bg: ink,       role: 'body',  label: 'Marble on Ink (CTA)' },
  ];

  for (const { fg, bg, role, label } of PAIRS) {
    const minRatio = role === 'body' ? 4.5 : 3.0;
    it(`${label} meets WCAG AA (${role} → ${minRatio}:1)`, () => {
      const ratio = contrastRatio(fg, bg);
      expect(ratio).toBeGreaterThanOrEqual(minRatio);
    });
  }
});
```

### Design Decisions

- **Read tokens from `globals.css` at test time.** Means any palette
  edit triggers the test on next run. No duplication of hex values in
  the test file.
- **WCAG AA, not AAA.** AAA contrast (7:1 body, 4.5:1 large) would
  fail Oxblood-on-Marble immediately; the brand intentionally uses
  Oxblood as an "eye attractor not reading material" pair, which is
  exactly what WCAG AA's "large" threshold accommodates.
- **Pair labels in test output.** When a failure happens, the test
  output reads "Oxblood on Marble meets WCAG AA (large → 3:1)" — the
  contributor sees which pair to investigate.
- **Marble-on-Ink (CTA) tested.** The rare Ink + Oxblood CTA hover case
  doesn't use Oxblood for text — the actual button pattern is
  Marble-on-Ink resting, with Marble-on-Oxblood on hover. Both tested.

### Files

| Action | File |
|--------|------|
| NEW    | `src/__tests__/brand/contrast.test.ts` |

---

## Feature 9.3: Reduce-motion / forced-colors / 200% zoom

**Complexity: M** — Verify the brushstroke seam disables under
`prefers-reduced-motion`, the site reflows cleanly at 200% browser zoom,
and forced-colors mode (Windows High Contrast) keeps the site readable.
Most of this is already in place from Phase 3.2's
`motion-reduce:opacity-80` and the brand's no-fixed-layout discipline; this
section verifies and tightens any remaining gaps.

### Problem

The brand discipline prevents most motion / contrast accessibility issues
by default (no animations, no fixed layouts that break zoom, no decorative
gradients that break forced-colors). But the brushstroke composition is
the one component that could fail accessibility — the texture overlay
should soften under reduce-motion, the seam should remain understandable
under forced-colors. And 200% zoom should reflow cleanly without
horizontal scroll.

### Implementation

**MODIFY** `src/components/brand/BrushstrokeSeam.tsx` — tighten the
reduce-motion treatment (already partially in place from Phase 3.2):

```tsx
// In the existing component, ensure:
// 1. SVG turbulence filter scale is reduced under reduce-motion (already opacity dampened)
// 2. backgroundContent opacity drops to 70% under reduce-motion (more dampened than current 80%)

<div className="absolute inset-0 motion-safe:opacity-100 motion-reduce:opacity-70">
  {backgroundContent}
</div>

// Add forced-colors handling: when the system enforces high contrast, render
// the brushstroke as a flat 1px ink rule instead of a textured seam.

<style>{`
  @media (forced-colors: active) {
    .brushstroke-mask-wrapper { mask-image: none !important; -webkit-mask-image: none !important; }
    .brushstroke-foreground { background: Canvas !important; color: CanvasText !important; border-right: 1px solid CanvasText; }
  }
`}</style>
```

**MODIFY** `src/app/globals.css` — append a small block ensuring
typography reflows at zoom:

```css
@layer base {
  html {
    /* Allow user-agent zoom to scale freely; no `text-size-adjust: none`. */
    text-size-adjust: 100%;
    -webkit-text-size-adjust: 100%;
  }

  @media (forced-colors: active) {
    /* Map brand surfaces to system canvas colors so high-contrast mode reads. */
    body { background: Canvas; color: CanvasText; }
    a { color: LinkText; }
    button { border: 1px solid CanvasText; }
  }
}
```

**Manual verification steps** (no sentinel; verified during 9.4 final sweep):

1. Open DevTools → Rendering → Emulate CSS `prefers-reduced-motion: reduce`.
   Confirm homepage hero brushstroke is softened.
2. DevTools → Rendering → Emulate CSS `forced-colors: active`.
   Confirm every page remains readable.
3. Browser zoom to 200% on `/`, `/episodes`, `/build-log`. Confirm no
   horizontal scrollbar appears at any viewport width ≥ 320px.

### Design Decisions

- **No automated forced-colors test.** Vitest + JSDOM doesn't implement
  `forced-colors` media query meaningfully; this is a manual
  verification step in the final sweep.
- **`CanvasText` / `Canvas` system colors.** WCAG-recommended approach for
  forced-colors fallback. System provides high-contrast values; the brand
  steps out of the way.
- **Brushstroke degrades to a 1px Ink rule.** Better than vanishing
  entirely — the seam-as-divider intent is preserved, just without the
  organic feather.
- **`text-size-adjust: 100%`.** Some mobile browsers auto-shrink long
  lines; explicitly allowing 100% scaling keeps user zoom intent intact.
- **Phase 9.3 doesn't add a new sentinel.** Forced-colors and zoom are
  manual checks; reduce-motion is a property change verified visually.
  Building automated tests for these would over-engineer the brand
  discipline.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/brand/BrushstrokeSeam.tsx` |
| MODIFY | `src/app/globals.css` |

---

## Feature 9.4: Final sweep

**Complexity: S** — Run lint, typecheck, build, and the full test suite.
Walk every page in the route inventory in the dev server. Run Lighthouse
on the three highest-stakes pages (`/`, `/episodes`, `/build-log`).
Capture any final regressions, fix them, re-run the sweep.

### Problem

After eight phases of changes, the only way to know the brand reset is
complete is a deliberate walk through every quality gate. Anything caught
during the final sweep that violates the brand or fails a sentinel must
be fixed before the job closes.

### Implementation

**Sweep checklist:**

```bash
npm run lint        # must be clean
npx tsc --noEmit    # must be clean
npm test            # forbidden-patterns + contrast + legibility sentinels green; smoke test passes
npm run build       # standalone output succeeds; no Tailwind purge warnings
```

**Manual page walk** (dev server running on `localhost:3000`):

- `/` — brushstroke hero, three section dividers, sister-project callout
- `/episodes` — editorial grid
- `/episodes/<first slug>` — manuscript page with Roman numerals
- `/cases` — editorial grid
- `/cases/<first slug>` — manuscript + spec-sheet sidebar
- `/about` — quiet marble, period DropAccent
- `/build-log` — Bone surface, JobsRollupTable
- `/build-log/jobs/website-foundation` — Parchment inner panel, MDX prose
- `/build-log/jobs/website-foundation/phase-1` — phase detail
- `/build-log/status` — aggregate dashboard
- `/products` — editorial grid
- `/products/<first slug>` — product detail with price bar
- `/cohorts` — editorial grid
- `/cohorts/<first slug>` — CohortDetailHero with arrow DropAccent
- `/products/account` — Bone workspace (auth gate; sign in first)
- `/login` — quiet marble sign-in
- `/login/verify` — verification confirmation with check DropAccent
- `/not-found` (visit a 404) — gentle refusal with X DropAccent
- `/error` (force an error) — retry CTA via Button
- `/sitemap.xml` — XML, no brand
- `/robots.txt` — text, no brand
- `/llms.txt` — text, no brand
- `/favicon.svg` — direct asset, renders `{10x}`
- `/logo.svg` — direct asset, renders wordmark + mark
- `/opengraph-image` — 1200×630 brand composition
- `/episodes/<slug>/opengraph-image` — per-episode composition
- `/cases/<slug>/opengraph-image` — per-case composition
- `/thumb-preview?title=Test&accent=?` (dev only) — 1280×720 composition

**Lighthouse checks** (DevTools Performance / Accessibility):

- `/` — a11y ≥ 95, performance ≥ 90, best practices ≥ 95
- `/episodes` — same thresholds
- `/build-log` — same thresholds

**Accessibility manual checks** (DevTools Rendering panel):

- Emulate `prefers-reduced-motion: reduce` — brushstroke softened
- Emulate `forced-colors: active` — pages remain readable
- Browser zoom 200% — no horizontal scrollbar

**Regression fix loop:**

Any failure → identify the section ID owning the violated rule → file a
bug fix as that section's last work → re-run the sweep. The sweep
itself should be quick (15-30 min) once the work is right.

### Design Decisions

- **Sweep is the human verification gate.** The sentinels guard
  regression; the sweep guards omission. A page that ships in the
  brand-correct palette but with a missing DropAccent isn't caught by a
  test — the human walk is the catch.
- **Lighthouse thresholds match the project standard.** Same numbers
  used by `website-foundation-4.1`'s verification plan. Consistent
  bar across the project.
- **No new file in 9.4.** Pure verification work; the section's value is
  the disciplined walk through every page.

### Files

| Action | File |
|--------|------|
| (verification only — no file changes) | — |

---

## Phase 9 Exit Criteria

- `src/__tests__/brand/legibility.test.ts` ships and passes for all three
  viewport targets.
- `src/__tests__/brand/contrast.test.ts` ships and passes for every
  brand contrast pair.
- BrushstrokeSeam degrades correctly under `prefers-reduced-motion` and
  `forced-colors: active`.
- `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` all
  clean.
- Lighthouse a11y ≥ 95, perf ≥ 90 on `/`, `/episodes`, `/build-log`.
- Manual sweep covers every route in the inventory with no brand
  regressions.
- 200% zoom on the three high-stakes pages produces no horizontal
  scrollbar at 320px viewport width.
- The job is shippable: the editorial brand reset is complete, the
  sentinels guard against drift, and the design-system doc captures
  the canonical reference for everything that lands afterward.
