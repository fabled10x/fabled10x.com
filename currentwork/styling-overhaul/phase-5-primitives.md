# Phase 5: Component Primitives

**Total Size: M + S + M + S**
**Prerequisites: Phase 1–4 complete (tokens, typography, surfaces, chrome)**
**New Types: None**
**New Files: `src/components/brand/Button.tsx`**

Phase 5 builds the small set of interaction primitives every page consumes:
a Button primitive that captures the brand's restrained CTA language,
restyled StatusBadge variants for the build-log, an EmailCapture reskin that
treats form submission as a "join the library" gesture, and consistent
chrome across the existing auth + storefront buttons.

---

## Feature 5.1: Button primitive

**Complexity: M** — `<Button>` with `variant` (primary / ghost / quiet),
`size` (sm / md / lg), Ink fill + Marble text for primary, sharp corners,
no shadow, 1px Ink edge. Replaces every inline button class across the site.

### Problem

Buttons live in the `EmailCapture`, `SignInForm`, `SignOutButton`,
`BuyButton`, and various card / hero CTAs. Each one currently picks its
own `bg-*` / `text-*` / `rounded-*` combination. The brand needs one
primitive: Ink fill / Marble text / sharp corners / no shadow / 1px edge,
with two restrained alternatives for less-prominent calls.

### Implementation

**NEW** `src/components/brand/Button.tsx`:

```tsx
import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps<E extends ElementType> = {
  as?: E;
  variant?: Variant;
  size?: Size;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, 'className' | 'children'>;

const variantClass: Record<Variant, string> = {
  primary: `
    bg-(--color-ink) text-(--color-marble)
    border border-(--color-ink)
    hover:bg-(--color-oxblood) hover:border-(--color-oxblood)
  `,
  ghost: `
    bg-transparent text-(--color-ink)
    border border-(--color-ink)
    hover:bg-(--color-ink) hover:text-(--color-marble)
  `,
  quiet: `
    bg-transparent text-(--color-ink)
    border border-(--edge-color-subtle)
    hover:border-(--color-ink)
  `,
};

const sizeClass: Record<Size, string> = {
  sm: 'label py-(--space-1) px-(--space-3)',
  md: 'label py-(--space-2) px-(--space-4)',
  lg: 'label py-(--space-3) px-(--space-5) text-sm',
};

export function Button<E extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps<E>) {
  const Tag = (as ?? 'button') as ElementType;
  return (
    <Tag
      className={`
        inline-flex items-center justify-center gap-(--space-2)
        transition-colors duration-150
        cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
        focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-oxblood) focus-visible:outline-offset-2
        ${variantClass[variant]}
        ${sizeClass[size]}
        ${className}
      `}
      {...rest}
    >
      {children}
    </Tag>
  );
}
```

### Design Decisions

- **Primary hover = Oxblood.** The Ink + Oxblood pair is reserved for
  "rare" per the spec. A primary button hover is exactly that — the user
  has signaled intent and the button reaches out. Resting state stays
  Ink + Marble.
- **Ghost variant for secondary CTAs.** Same Ink type, but transparent
  fill with a border. The Ink + Marble inversion on hover gives the
  call-to-attention without introducing a new color.
- **Quiet variant for tertiary actions.** Just Ink text with a subtle
  edge; the hover only sharpens the edge. Used for "Cancel,"
  "Read more," and other low-stakes actions.
- **`label` utility for type.** The `label` utility from Phase 2.2
  (Inter semibold, uppercase, tracked) is the brand voice for buttons.
  Every button is a small call to a verb; uppercase tracked semibold
  reads as inscribed instruction.
- **Sharp corners.** `rounded-*` is absent. Per brand spec ("carved, not
  pillowy"). The radius scale's `--radius-card` (4px) is for cards, not
  CTAs.
- **No `box-shadow`.** Per brand discipline.
- **`focus-visible` ring uses Oxblood.** Accessibility requirement —
  the focus indicator has to be distinctly visible. Oxblood-on-Marble
  meets WCAG 3:1 large-element contrast and ties to the brand without
  needing a blue ring.
- **Polymorphic `as` prop.** Some buttons render as `<a>` (links styled
  as buttons), some as `<button>` (form submit), some as form-action
  helpers. One primitive covers all three.

### Files

| Action | File |
|--------|------|
| NEW    | `src/components/brand/Button.tsx` |

---

## Feature 5.2: StatusBadge variant restyle

**Complexity: S** — Restyle the existing
`src/components/build-log/StatusBadge.tsx` so the four status variants map
to brand-correct color pairs: `planned` (Steel-on-Bone), `in-progress`
(Ink-on-Parchment), `complete` (Verdigris-on-Marble — the only place
Verdigris reads "done"), `unknown` (muted Ink-on-Bone).

### Problem

The current `StatusBadge` ships with ad-hoc Tailwind color classes
(red / amber / green / gray) that violate the brand's seven-color
discipline. The forbidden-pattern sentinel (Phase 3.3) flags this
immediately. Restyling against the palette resolves the sentinel and
gives the badge its brand voice.

### Implementation

**MODIFY** `src/components/build-log/StatusBadge.tsx`:

```tsx
import type { JobStatus } from '@/content/schemas';

interface StatusBadgeProps {
  status: JobStatus;
  className?: string;
}

const variantClass: Record<JobStatus, string> = {
  planned: 'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle)',
  'in-progress': 'bg-(--color-parchment) text-(--color-ink) border-(--edge-color)',
  complete: 'bg-(--color-marble) text-(--color-verdigris) border-(--color-verdigris)',
  unknown: 'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle) italic',
};

const variantLabel: Record<JobStatus, string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  complete: 'Complete',
  unknown: 'Unknown',
};

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-(--space-1)
        label
        border px-(--space-2) py-px
        ${variantClass[status]}
        ${className}
      `}
      aria-label={`Status: ${variantLabel[status]}`}
    >
      {status === 'complete' && (
        <span aria-hidden="true" className="text-(--color-verdigris)">✓</span>
      )}
      {variantLabel[status]}
    </span>
  );
}
```

### Design Decisions

- **`complete` is Verdigris-on-Marble.** The single reserved Verdigris
  use in the build-log. The ✓ glyph is the brand spec's allowed accent
  for completion (per Phase 2.3 DropAccent allowed set).
- **`planned` and `unknown` look similar by intent.** Both are
  "not in motion." The italic on `unknown` is the differentiator without
  introducing a new color.
- **`in-progress` is Ink-on-Parchment.** Active work reads on the warmer
  surface — Parchment is the "the page is being written on" texture.
  Ink against Parchment is the max-contrast pair for body text and
  reads as "this is happening now."
- **`label` utility from Phase 2.2.** Same voice as nav, same voice as
  series tags — the badge is part of the editorial typographic vocabulary,
  not a UI chrome stamp.
- **`aria-label` includes the full status word.** Screen readers
  announce "Status: Complete" — clearer than just "Complete" floating in
  context.
- **1px border + sharp corners.** Same discipline as Button.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/build-log/StatusBadge.tsx` |

---

## Feature 5.3: EmailCapture reskin

**Complexity: M** — Reskin
`src/components/capture/EmailCapture.tsx` against the brand: Bone surface
with Ink underline (no full input border), Ink primary `<Button>`, success
state Verdigris check + "Welcome to the library."

### Problem

The current EmailCapture (shipped in `website-foundation-4.1`) is the most
prominent CTA on the site. Its visual treatment defines whether the
brand's voice — boutique editorial, considered — comes through. The
current ad-hoc input + button styling is generic. The brand needs an
input that reads as "sign the guest book" rather than "submit form."

### Implementation

**MODIFY** `src/components/capture/EmailCapture.tsx` (the rendered JSX,
preserving the existing `useActionState` / server-action wiring from
`website-foundation-4.1`):

```tsx
'use client';

import { useActionState } from 'react';
import { Bone } from '@/components/brand/Bone';
import { Button } from '@/components/brand/Button';
import { captureEmail, type CaptureState } from './actions';

const initialState: CaptureState = { status: 'idle' };

interface EmailCaptureProps {
  source: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function EmailCapture({
  source,
  placeholder = 'you@somewhere.dev',
  buttonLabel = 'Join the library',
}: EmailCaptureProps) {
  const [state, formAction, pending] = useActionState(captureEmail, initialState);

  if (state.status === 'success') {
    return (
      <Bone edge="subtle" className="p-(--space-5) flex items-center gap-(--space-3)">
        <span aria-hidden="true" className="text-(--color-verdigris) text-2xl">✓</span>
        <div>
          <p className="label">Welcome to the library.</p>
          <p className="body-3 mt-(--space-1)">
            Episode notifications begin with the next release.
          </p>
        </div>
      </Bone>
    );
  }

  return (
    <Bone edge="subtle" className="p-(--space-5)">
      <form action={formAction} className="flex flex-col gap-(--space-3) md:flex-row md:items-end">
        <input type="hidden" name="source" value={source} />
        <label className="flex-1 flex flex-col gap-(--space-1)">
          <span className="label">Email</span>
          <input
            type="email"
            name="email"
            required
            placeholder={placeholder}
            className="
              bg-transparent
              border-0 border-b border-(--color-ink)
              focus:outline-none focus:border-(--color-oxblood)
              py-(--space-2)
              body-1
              placeholder:text-(--color-muted)
            "
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : buttonLabel}
        </Button>
      </form>
      {state.status === 'error' && (
        <p className="body-3 mt-(--space-2) text-(--color-oxblood)" role="alert">
          {state.message}
        </p>
      )}
    </Bone>
  );
}
```

### Design Decisions

- **Bone surface.** Bone is the warm secondary surface — perfect for a
  capture moment that should feel slightly elevated from the rest of the
  marble page but not as formal as a Parchment panel.
- **Underline-only input.** Borderless input with a 1px Ink under-rule
  reads as a signature line on a paper form. The signature metaphor
  matches the "sign the guest book" voice of "Join the library."
- **Focus underline = Oxblood.** The brand's only saturated color
  signaling focus — keeps the input minimal at rest, clear when active.
- **Success state is its own layout.** Not a toast, not an inline message
  — the whole capture surface replaces with the welcome. The Verdigris
  ✓ is the single allowed Verdigris-as-success placement here.
- **Server action + `useActionState` unchanged.** This is purely a
  visual reskin. Behavior, validation, Resend integration all come
  forward from `website-foundation-4.1`.
- **`role="alert"` on errors.** Screen reader announcement.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/capture/EmailCapture.tsx` |

---

## Feature 5.4: Auth + storefront button consistency

**Complexity: S** — Refactor `SignInForm`, `SignOutButton`, and `BuyButton`
to use the `<Button>` primitive from 5.1. No behavior change — only chrome.

### Problem

`src/components/auth/SignInForm.tsx`,
`src/components/account/SignOutButton.tsx`, and
`src/components/products/BuyButton.tsx` each carry their own button styling.
Without consolidation, the brand's CTA voice has three slightly different
flavors. The `<Button>` primitive needs to be the single source.

### Implementation

**MODIFY** `src/components/auth/SignInForm.tsx`:

Replace the existing submit button JSX with:

```tsx
<Button type="submit" disabled={pending} className="w-full">
  {pending ? 'Sending link…' : 'Send sign-in link'}
</Button>
```

Restyle the email input to match `EmailCapture` (underline-only, focus-oxblood).

**MODIFY** `src/components/account/SignOutButton.tsx`:

```tsx
'use client';

import { signOut } from 'next-auth/react';
import { Button } from '@/components/brand/Button';

export function SignOutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()}>
      Sign out
    </Button>
  );
}
```

**MODIFY** `src/components/products/BuyButton.tsx`:

Replace the existing button element with:

```tsx
<Button
  as="button"
  type="button"
  onClick={handleCheckout}
  disabled={loading}
  size="lg"
>
  {loading ? 'Redirecting…' : `Buy — $${formatPrice(price)}`}
</Button>
```

Keep all the existing Stripe checkout logic — this is purely the visual swap.

### Design Decisions

- **`SignOutButton` is `ghost`.** Sign-out is a destructive-ish action
  but not destructive enough for an Oxblood-styled "destructive" variant
  (which doesn't exist in this primitive — by design, the brand has no
  destructive button voice; if a confirmation is needed, it's a modal).
  Ghost variant reads as "secondary action available."
- **`BuyButton` is `lg`.** Storefront CTAs are the highest-stakes
  click on the site; larger size signals weight without needing color
  escalation.
- **`SignInForm` button is full-width.** Auth forms feel more deliberate
  with a button that spans the form's width.
- **Price embedded in button text.** `Buy — $19` reads as one statement.
  Adjacent price + button is a fragmented call.

### Files

| Action | File |
|--------|------|
| MODIFY | `src/components/auth/SignInForm.tsx` |
| MODIFY | `src/components/account/SignOutButton.tsx` |
| MODIFY | `src/components/products/BuyButton.tsx` |

---

## Phase 5 Exit Criteria

- `<Button>` renders three variants × three sizes. Focus-visible ring
  uses Oxblood and is keyboard-reachable.
- `<StatusBadge>` renders the four states with brand-correct color pairs;
  `complete` shows the Verdigris ✓.
- `EmailCapture` shows the Bone-surfaced underline-input form and the
  Verdigris-✓ success state.
- `SignInForm`, `SignOutButton`, `BuyButton` all consume `<Button>`.
- `npm test` — forbidden-pattern sentinel still green; no Tailwind palette
  classes (`bg-red-*`, `text-green-*`, etc.) remain in these components.
- `npm run lint`, `npx tsc --noEmit`, `npm run build` all clean.
- Manual interaction check: focus, hover, disabled, and pending states
  for every primitive on a sandbox route.
