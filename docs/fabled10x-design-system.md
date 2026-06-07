# Fabled 10X — Design System

Canonical reference for the brand stack. Components consume from this list;
nothing else.

## Palette

| Token | Hex | Role |
|-------|-----|------|
| Marble | #F7F4EC | Primary surface |
| Parchment | #F0E6D2 | Secondary warm surface |
| Ink | #1C1814 | Text, button fills — warm near-black, never pure |
| Oxblood | #6B2020 | The one saturated accent |
| Verdigris | #2F5D50 | Completion / success states only |
| Bone | #E8DCC4 | Layered secondary parchment |
| Shadow | #2A2520 | Vignettes, edges, code surfaces |

## Contrast Pairs

Three explicit levels of contrast, used consistently:

| Pair | Use |
|------|-----|
| Marble + Ink | Maximum contrast — body text, headlines (must be legible) |
| Marble + Oxblood | Medium contrast — accents (eye attractors, not reading material) |
| Ink + Oxblood | Rare — dark button against the rest of the page |

## Typography

Display: **Cinzel Black** — Roman/inscriptional roots. ALL CAPS only.
Working face: **Inter** — modern humanist sans. Sentence case only.
Monospace: **JetBrains Mono** — terminals, code, prices, spec-sheet labels.

No third typeface, ever.

## Material Language

**Allowed**: marble, parchment, ink-on-paper texture, columns, arches, friezes,
Roman/Greek numerals, curly braces used decoratively, carved letterforms,
brushstroke / painted edges, subtle material satin.

**Forbidden**: gradients, drop shadows that look like UI, glowing circuits,
neural meshes, robot icons, lightning bolts, rockets, gears, sparkles, 3D
rendering, isometric perspective, pure black, pure white, pure red, any
saturated primary other than Oxblood.

**Exceptions — scrims**: a translucent color wash layered over a texture or
photograph for text legibility is brand-approved. Same shape as the
illuminated-manuscript hero overlay (`HeroBackdrop`) and the marble nav
texture (`.bg-marble-texture`). These are functional readability overlays,
not decorative color sweeps — the "no gradients" rule targets the latter.
Implemented via a two-stop translucent cream wash because CSS has no other
one-property way to lay a tint over a `background-image`. Allow-listed
per-pattern in `src/__tests__/brand/forbidden-patterns.test.ts`. A scrim is
always: same hue across both stops, low alpha range, functional purpose
(legibility). Anything else — color shifts, decorative purpose — is still
forbidden.

Test: if the element could appear on an object pulled from a museum or
archaeological dig, it belongs. If it could appear on an AI startup's About
page, it doesn't.

## Composition

The defining move: brushstroke-seam composition. Marble overlay painted across
the left of a darker photo/texture zone, with the brushstroke edge feathered
organically. Headline crosses from marble onto photo.

Three hierarchy levels per surface: accent tag (Oxblood label) → headline
(Cinzel Ink) → subtitle (Inter Ink-muted).

## Mobile-first legibility

Every thumbnail / og:image checked at 320×180 before shipping. If the main
headline isn't legible at that scale, the design fails.

## Asset paths

| Asset | Path |
|-------|------|
| Logo SVG | `public/logo.svg` |
| Favicon | `public/favicon.svg` |
| Apple touch icon | `public/apple-touch-icon.png` |
| Android Chrome 192 | `public/android-chrome-192.png` |
| Android Chrome 512 | `public/android-chrome-512.png` |
| Fonts (for `next/og`) | `public/fonts/{Cinzel-Black,Inter-Regular,Inter-SemiBold,Inter-Bold}.ttf` |

## Implementation references

- Token source — `src/app/globals.css` (`@theme inline` block)
- Surface primitives — `src/components/brand/{Marble,Parchment,Bone,Shadow}.tsx`
- Brushstroke seam — `src/components/brand/BrushstrokeSeam.tsx`
- Logo — `src/components/brand/Logo.tsx`
- Editorial card — `src/components/brand/EditorialCard.tsx`
- Drop accent — `src/components/brand/DropAccent.tsx`
- Sentinels — `src/__tests__/brand/{forbidden-patterns,contrast,legibility}.test.ts`
