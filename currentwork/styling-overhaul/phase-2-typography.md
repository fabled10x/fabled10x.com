# Phase 2: Typography

**Total Size: M + S + S + M**
**Prerequisites: Phase 1 complete (tokens declared)**
**New Types: None**
**New Files: `src/components/brand/DropAccent.tsx`**

Phase 2 swaps the Geist font stack for the brand pairing — Cinzel display +
Inter working face + JetBrains Mono code — declares the type-scale utilities
that enforce the all-caps-display / sentence-case-body rule, ships the oversized
punctuation primitive that ends every brand headline, and retrofits the existing
`.build-log-prose` styles so MDX content picks up the new system without
component rewrites.

---

## Feature 2.1: Font loading swap

**Complexity: M** — Replace `Geist` / `Geist_Mono` in `layout.tsx` with
Cinzel, Inter, and JetBrains Mono. Repoint the CSS variables so downstream
features (utilities, components) read the new families.

### Problem

`src/app/layout.tsx` currently loads `Geist` and `Geist_Mono` via
`next/font/google`, exposing them as `--font-geist-sans` /
`--font-geist-mono`. The brand requires three families (display / body /
mono) and Geist is none of them. Every typographic decision downstream
depends on this swap.

### Implementation

**MODIFY** `src/app/layout.tsx`:

```tsx
import type { Metadata } from "next";
import { Cinzel, Inter, JetBrains_Mono } from "next/font/google";
import { Header } from '@/components/site/Header';
import { Footer } from '@/components/site/Footer';
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["900"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

// metadata unchanged

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${inter.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
```

**MODIFY** `src/app/globals.css` — update the `@theme inline` font aliases (replace
the Phase 1 placeholder that still pointed at `--font-geist-sans`):

```css
@theme inline {
  /* ... palette + spacing tokens ... */

  --font-display: var(--font-display);   /* Cinzel — set on <html> by layout.tsx */
  --font-body: var(--font-body);         /* Inter */
  --font-mono: var(--font-mono);         /* JetBrains Mono */
}
```

Because `next/font` writes the CSS variable directly on `<html>`, the
`@theme` block here just re-declares the names so Tailwind utilities (`font-display`,
`font-body`, `font-mono`) resolve correctly.

### Design Decisions

- **Cinzel weight 900 only.** Display is always all-caps and always heavy.
  Loading a lighter Cinzel weight would be unused bytes. If a future surface
  ever needs a lighter display, revisit then.
- **Inter weights 400/600/700.** Body needs regular for paragraphs, semibold
  for emphasis, bold for the working-face equivalent of "display lite" in
  card subtitles. No 500 (Inter's weight steps are coarse enough that
  600/700 read distinctly).
- **JetBrains Mono weights 400/500.** Code blocks use 400; spec-sheet labels
  / prices use 500 for legibility at small sizes. No bold mono — bold mono
  fights every editorial layout it sits in.
- **`display: "swap"` on all three.** FOIT (flash of invisible text) is
  worse than FOUT for an editorial brand. Inter is the body face; users
  reading should never wait on the network.
- **No third typeface, ever.** Spec is explicit. Future features that
  "need a fourth font" need to talk to the brand spec first.
- **Drop `font-feature-settings: "ss01", "cv11"`.** Geist-specific stylistic
  sets. Inter has its own (`cv05`, `cv11` for the single-story 'a', `ss03` for
  the curly italics) — but Phase 2 doesn't ship a feature-settings opinion;
  if needed later, add per-utility, not globally.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/layout.tsx` |
| MODIFY | `src/app/globals.css` |

---

## Feature 2.2: Type scale + display-rule utilities

**Complexity: S** — Declare CSS-variable-backed type-scale tokens for display
and body sizes, with the all-caps / sentence-case rule baked into the
component-layer utilities that pages and components actually consume.

### Problem

Tailwind 4's default text utilities (`text-xl`, `text-4xl`, etc.) give size
but not semantic role. Without a brand scale, every component picks its own
size, weight, and tracking — and the all-caps-display / sentence-case-body
rule has to be remembered every time someone writes a headline. The brand
needs a scale where reaching for the "headline 1" utility automatically gets
Cinzel, ALL CAPS, the right tracking, and the right size for the brand.

### Implementation

**MODIFY** `src/app/globals.css` — append type-scale tokens to `@theme inline`:

```css
@theme inline {
  /* ... existing tokens ... */

  /* Display scale — Cinzel, all-caps, generously tracked */
  --text-display-1: clamp(2.5rem, 4vw + 1rem, 4rem);   /* hero headline */
  --text-display-2: clamp(1.875rem, 2.5vw + 1rem, 2.75rem); /* section heading */
  --text-display-3: 1.5rem;                                 /* card headline */

  --tracking-display: 0.04em;
  --leading-display: 1.05;

  /* Body scale — Inter, sentence case */
  --text-body-1: 1.125rem;   /* primary body */
  --text-body-2: 1rem;       /* secondary body */
  --text-body-3: 0.875rem;   /* meta, captions */

  --leading-body: 1.6;

  /* Label — Inter, uppercase, very tracked, very small (series tags, accent labels) */
  --text-label: 0.75rem;
  --tracking-label: 0.18em;
}
```

Then add utility classes in the component layer (so authors write
`<h1 className="display-1">` instead of stacking five Tailwind utilities and
hoping):

```css
@layer components {
  .display-1 {
    font-family: var(--font-display), serif;
    font-weight: 900;
    font-size: var(--text-display-1);
    letter-spacing: var(--tracking-display);
    line-height: var(--leading-display);
    text-transform: uppercase;
    color: var(--pair-text-on-marble);
  }
  .display-2 { /* same shape, --text-display-2 */ }
  .display-3 { /* same shape, --text-display-3, color may differ per surface */ }

  .body-1 {
    font-family: var(--font-body), system-ui, sans-serif;
    font-weight: 400;
    font-size: var(--text-body-1);
    line-height: var(--leading-body);
    color: var(--pair-text-on-marble);
  }
  .body-2 { /* same shape, --text-body-2 */ }
  .body-3 { /* same shape, --text-body-3, often muted */ font-size: var(--text-body-3); color: var(--color-muted); }

  .label {
    font-family: var(--font-body), system-ui, sans-serif;
    font-weight: 600;
    font-size: var(--text-label);
    letter-spacing: var(--tracking-label);
    text-transform: uppercase;
    color: var(--pair-accent-on-marble);
  }

  .mono {
    font-family: var(--font-mono), ui-monospace, monospace;
    font-weight: 400;
    font-size: var(--text-body-3);
    letter-spacing: 0;
  }
}
```

### Design Decisions

- **`clamp()` for display sizes.** Headlines fluid-scale between mobile and
  desktop without breakpoints; Phase 9.3 verifies behavior at 200% zoom.
- **All-caps via `text-transform`, not by typing in caps.** Keeps source
  readable, lets Inter sentence-case rendering work cleanly when content
  authors miss the rule, and respects screen-reader pronunciation.
- **Label uses Oxblood, not Ink.** Series tags / accent labels are the
  Marble + Oxblood medium-contrast pair (eye attractor). Encoded in the
  utility so authors don't pick a color.
- **No `display-4` or smaller display step.** If a surface needs display
  text smaller than `display-3`, it isn't really display — it's an Inter
  semibold body. Forcing the question prevents Cinzel from sneaking down
  into UI sizes where it gets unreadable.
- **Component-layer utilities, not Tailwind plugin.** Tailwind 4 supports
  custom plugins, but a `@layer components` block here is one file, no
  tooling, and works with the rest of the brand sentinels (Phase 3.3
  greps for forbidden patterns and understands plain CSS).

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |

---

## Feature 2.3: DropAccent primitive

**Complexity: S** — `<DropAccent>` component renders an oversized Oxblood
punctuation glyph at the end of a headline. Used by the homepage hero, card
titles, and og:image / thumb-preview compositions.

### Problem

The brand's per-headline accent character (`?`, `.`, `→`, `✕`, `✓`) needs
consistent treatment — it's bigger than the headline, Oxblood, and tracks
toward the headline's last letter (often crossing into the photo zone on the
homepage). Inline styling would produce drift across every consumer. A
primitive makes one decision once.

### Implementation

**NEW** `src/components/brand/DropAccent.tsx`:

```tsx
import type { ReactNode } from 'react';

export type AccentGlyph = '?' | '.' | '!' | '→' | '✕' | '✓' | '—';

interface DropAccentProps {
  glyph: AccentGlyph;
  size?: 'inline' | 'large' | 'thumbnail';
  children?: ReactNode;
}

const sizeClass: Record<NonNullable<DropAccentProps['size']>, string> = {
  inline: 'text-[1.5em] leading-none',
  large: 'text-[1.8em] leading-none ml-[0.1em]',
  thumbnail: 'text-[2.2em] leading-none ml-[0.05em]',
};

export function DropAccent({ glyph, size = 'large', children }: DropAccentProps) {
  return (
    <>
      {children}
      <span
        aria-hidden="true"
        className={`text-(--color-oxblood) align-baseline font-display ${sizeClass[size]}`}
      >
        {glyph}
      </span>
    </>
  );
}
```

Usage:

```tsx
<h1 className="display-1">
  Build a 10x agency<DropAccent glyph="?" />
</h1>
```

### Design Decisions

- **`aria-hidden="true"`.** Screen readers don't need "question mark"
  announced after a headline that already ends in a question. The visual
  glyph is decoration; the headline carries the semantic load.
- **Three sizes.** `inline` for embedded use (card titles), `large` for
  hero headlines, `thumbnail` for og:image / YouTube thumb compositions
  where the glyph is the dominant accent.
- **Em-relative sizing.** The accent scales with whatever headline it ends.
  No separate `--text-accent-glyph` token because it has no independent
  identity — it's always sized relative to its host headline.
- **`AccentGlyph` enum locked to the spec's allowed set.** TypeScript
  prevents `<DropAccent glyph="$" />` from compiling. The set is the
  brand's prescribed accent vocabulary; expanding it is a brand decision.
- **No animation.** The brand discipline forbids motion-for-decoration's
  sake. If a future episode wants a hover-reveal accent, that's a
  per-page decision, not a primitive feature.

### Files

| Action | File |
|--------|------|
| NEW    | `src/components/brand/DropAccent.tsx` |

---

## Feature 2.4: `.build-log-prose` retrofit

**Complexity: M** — Update the existing `.build-log-prose` component layer
so MDX content rendered through `MarkdownDocument` picks up the new
typography stack — Cinzel headings, Inter body, JetBrains Mono code,
Oxblood drop cap, Shadow code surfaces, Oxblood blockquote rule.

### Problem

`src/app/globals.css` defines `.build-log-prose` with the placeholder
palette and Geist family inherited from body. After Phases 1 + 2.1 + 2.2,
the MDX surface in `/build-log/**` is the largest body-text rendering on
the site, and it still ships Geist + ember-orange unless retrofitted
explicitly.

### Implementation

**MODIFY** `src/app/globals.css` — replace the existing `.build-log-prose`
block in `@layer components`:

```css
@layer components {
  /* ... display-1, body-1, etc. from 2.2 ... */

  .build-log-prose {
    color: var(--pair-text-on-marble);
    line-height: var(--leading-body);
    font-size: var(--text-body-1);
    font-family: var(--font-body), system-ui, sans-serif;
  }

  .build-log-prose h2 {
    font-family: var(--font-display), serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: var(--tracking-display);
    font-size: var(--text-display-2);
    line-height: var(--leading-display);
    margin-top: var(--space-7);
    margin-bottom: var(--space-4);
    border-bottom: 1px solid var(--edge-color);
    padding-bottom: var(--space-2);
  }
  /* Oxblood drop cap on the first h2 in a prose block */
  .build-log-prose > h2:first-child::first-letter {
    color: var(--color-oxblood);
    font-size: 1.4em;
    line-height: 1;
  }

  .build-log-prose h3 {
    font-family: var(--font-display), serif;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: var(--tracking-display);
    font-size: var(--text-display-3);
    margin-top: var(--space-6);
    margin-bottom: var(--space-3);
  }

  .build-log-prose p {
    margin-top: var(--space-4);
    margin-bottom: var(--space-4);
  }

  .build-log-prose code:not(pre code) {
    font-family: var(--font-mono), ui-monospace, monospace;
    background: var(--color-bone);
    border: 1px solid var(--edge-color-subtle);
    border-radius: var(--radius-soft);
    padding: 0.125rem 0.375rem;
    font-size: 0.875em;
  }

  .build-log-prose pre {
    font-family: var(--font-mono), ui-monospace, monospace;
    background: var(--color-shadow);
    color: var(--color-parchment);
    border-radius: var(--radius-card);
    padding: var(--space-4) var(--space-5);
    overflow-x: auto;
    margin: var(--space-5) 0;
    font-size: var(--text-body-3);
    border: 1px solid var(--edge-color);
  }

  .build-log-prose .build-log-table-wrapper {
    margin: var(--space-5) 0;
  }
  .build-log-prose table {
    border-collapse: collapse;
    width: 100%;
    font-size: var(--text-body-3);
    font-family: var(--font-body), system-ui, sans-serif;
  }
  .build-log-prose th,
  .build-log-prose td {
    border: 1px solid var(--edge-color);
    padding: var(--space-2) var(--space-3);
    text-align: left;
    vertical-align: top;
  }
  .build-log-prose th {
    background: var(--color-bone);
    font-weight: 700;
  }

  .build-log-prose blockquote {
    border-left: 3px solid var(--color-oxblood);
    padding: var(--space-2) var(--space-4);
    background: var(--color-parchment);
    margin: var(--space-5) 0;
    font-style: italic;
  }

  .build-log-prose .build-log-anchor {
    margin-left: var(--space-2);
    color: var(--color-muted);
    text-decoration: none;
    opacity: 0;
    transition: opacity 150ms ease;
  }
  .build-log-prose h2:hover .build-log-anchor,
  .build-log-prose h3:hover .build-log-anchor {
    opacity: 1;
  }
  .build-log-prose .build-log-anchor::before {
    content: '#';
  }

  .build-log-prose a:not(.build-log-anchor) {
    color: var(--color-oxblood);
    text-decoration: underline;
    text-decoration-thickness: 1px;
    text-underline-offset: 3px;
  }

  .build-log-prose a:not(.build-log-anchor):hover {
    color: var(--color-ink);
  }
}
```

### Design Decisions

- **Drop cap on the first `h2`, not body text.** Traditional drop caps go on
  body paragraphs. For build-log entries (which open with an h2 like
  "Discovery" or "Implementation"), placing the cap on the heading produces
  the editorial signature without the OpenType complexity of body drop caps.
- **`pre` background = Shadow, text = Parchment.** Code is the most
  technically-dense content the site renders; giving it its own surface
  (the only Shadow surface in default page rendering) creates a clear
  "this is the artifact" frame.
- **Blockquote border = Oxblood, 3px.** Per spec, Oxblood is the eye
  attractor. The thinner border (3px instead of the placeholder's 4px) is
  more editorial / less alert-band.
- **Link underline thinner + offset.** Default `underline` is too close
  to descenders for an editorial brand. 1px + 3px offset reads as
  craftsperson, not Wikipedia.
- **No `color-mix` muddying.** The placeholder used
  `color-mix(in oklab, var(--color-mist) 50%, transparent)` for blockquote
  background. Switched to a solid Parchment surface — the brand discipline
  is solid colors / material textures, not blends.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/app/globals.css` |

---

## Phase 2 Exit Criteria

- `layout.tsx` loads Cinzel / Inter / JetBrains Mono via `next/font/google`
  and sets `--font-display` / `--font-body` / `--font-mono` on `<html>`.
- `globals.css` declares the type-scale tokens and the `display-1..3`,
  `body-1..3`, `label`, `mono` component utilities.
- `<DropAccent>` is shippable: importable, three sizes, locked glyph enum.
- `.build-log-prose` retrofit lands — every existing build-log page picks up
  Cinzel headings, Oxblood drop cap on the first h2, Shadow code surfaces,
  Inter body.
- `npm run lint` clean. `npm run build` clean. `npm test` green.
- Dev-server visual check: `/build-log/jobs/website-foundation` shows the
  Cinzel + Oxblood treatment on the rendered MDX without any component
  rewrites elsewhere.
