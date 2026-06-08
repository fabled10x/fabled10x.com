// PhaseNav tests (styling-overhaul-7.4 hybrid red).
//
// Preserves prop contract (jobSlug, phases, activePhaseSlug?), the
// nav landmark with aria-label='Phases', conditional return-null when
// phases is empty, the 'Phase {N}: {title}' label format with slug
// fallback, and the aria-current='page' active indicator (intent
// preserved; assertion updated below since active styling is no
// longer bg-accent).
//
// Adds brand-aware assertions per phase-7-pages.md Feature 7.4 chip
// rail design — Oxblood underline active indicator, .label outer hint,
// inline-flex gap-(--space-3) layout. Drops bg-accent/text-parchment/
// border-accent/border-mist/rounded placeholder chrome.
//
// Source-level sentinels enforce brand utility adoption.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    'aria-current': ariaCurrent,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    'aria-current'?: 'page' | 'step' | 'location' | 'date' | 'time' | 'true' | 'false' | boolean;
    className?: string;
  }) => (
    <a href={href} aria-current={ariaCurrent} className={className}>
      {children}
    </a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PhaseNav } from '../PhaseNav';
import type { JobPhase } from '@/content/schemas';

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const COMP_SOURCE_PATH = join(__dirname_compat, '..', 'PhaseNav.tsx');
const COMP_SOURCE = readFileSync(COMP_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-accent',
  'text-foreground',
  'text-parchment',
  'font-display',
  'text-4xl',
  'text-3xl',
  'text-2xl',
  'text-xl',
  'text-lg',
  'text-sm',
  'text-xs',
  'uppercase',
  'tracking-wide',
  'tracking-tight',
  'rounded-lg',
  'rounded-md',
  'border-mist',
  'bg-mist',
  'hover:border-accent',
  'hover:opacity-90',
  'bg-accent',
  'border-accent',
  'font-semibold',
  'font-medium',
];

const phases: readonly JobPhase[] = [
  {
    slug: 'phase-1-foundation',
    filename: 'phase-1-foundation.md',
    header: { phaseNumber: 1, title: 'Foundation' },
    body: '# body',
  },
  {
    slug: 'phase-2-pages',
    filename: 'phase-2-pages.md',
    header: { phaseNumber: 2, title: 'Pages' },
    body: '# body',
  },
  {
    slug: 'phase-3-untitled',
    filename: 'phase-3-untitled.md',
    header: {},
    body: '# body',
  },
] as const;

describe('PhaseNav', () => {
  // ─── Preserved behavior pins ───

  it('unit_phase_nav_one_link_per_phase', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const nav = screen.getByRole('navigation');
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(3);
  });

  it('unit_phase_nav_title_format', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    expect(screen.getByText('Phase 1: Foundation')).toBeInTheDocument();
    expect(screen.getByText('Phase 2: Pages')).toBeInTheDocument();
  });

  it('unit_phase_nav_falls_back_to_slug', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    expect(screen.getByText('phase-3-untitled')).toBeInTheDocument();
  });

  it('unit_phase_nav_href_format', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const link = screen.getByText('Phase 1: Foundation').closest('a');
    expect(link).toHaveAttribute('href', '/build-log/jobs/demo/phase-1-foundation');
  });

  it('edge_phase_nav_empty_phases_returns_null', () => {
    const { container } = render(
      <PhaseNav jobSlug="demo" phases={[] as readonly JobPhase[]} />,
    );
    expect(container.querySelector('nav')).toBeNull();
    expect(container.firstChild).toBeNull();
  });

  it('a11y_phase_nav_landmark_aria_label', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const nav = screen.getByRole('navigation');
    expect(nav).toHaveAttribute('aria-label', 'Phases');
  });

  it('a11y_phase_nav_aria_current_on_active', () => {
    render(
      <PhaseNav
        jobSlug="demo"
        phases={phases}
        activePhaseSlug="phase-2-pages"
      />,
    );
    const activeLink = screen.getByText('Phase 2: Pages').closest('a');
    expect(activeLink).toHaveAttribute('aria-current', 'page');
    const inactiveLink = screen.getByText('Phase 1: Foundation').closest('a');
    expect(inactiveLink).not.toHaveAttribute('aria-current');
  });

  it('edge_phase_nav_no_active_phase_no_aria_current', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const links = screen.getAllByRole('link');
    const actives = links.filter((l) => l.getAttribute('aria-current') === 'page');
    expect(actives).toHaveLength(0);
  });

  // ─── Brand-aware reskin assertions ───

  it('data_phase_nav_one_active_when_active_slug_provided', () => {
    // Preserved intent: exactly one active link, visually distinct
    // from inactives. Assertion rewritten from prior bg-accent class
    // pin to the brand-equivalent: oxblood-keyed active indicator.
    render(
      <PhaseNav
        jobSlug="demo"
        phases={phases}
        activePhaseSlug="phase-1-foundation"
      />,
    );
    const links = screen.getAllByRole('link');
    const actives = links.filter((l) => l.getAttribute('aria-current') === 'page');
    expect(actives).toHaveLength(1);
    expect(actives[0]).toHaveTextContent('Phase 1: Foundation');
    // Active link class must reference the brand --color-oxblood token
    expect(actives[0].className).toMatch(/oxblood/);
    // Inactive links must NOT reference --color-oxblood as a background
    // (they may reference it on hover via Tailwind utility strings).
    const inactives = links.filter((l) => l.getAttribute('aria-current') !== 'page');
    for (const link of inactives) {
      expect(link.className).not.toMatch(/^bg-\(--color-oxblood\)/);
    }
  });

  it('a11y_phase_nav_outer_label_present', () => {
    render(<PhaseNav jobSlug="demo" phases={phases} />);
    const nav = screen.getByRole('navigation');
    // The outer 'Phases' hint is rendered as a .label kicker (per
    // phase-7.4 planning doc) — the literal text 'Phases' must remain
    // visible within the nav landmark for orientation.
    expect(nav.textContent).toMatch(/Phases/);
  });

  // ─── Source-grep sentinels ───

  it('infra_phase_nav_no_banned_placeholder_utilities: source contains ZERO banned tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(COMP_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_phase_nav_uses_label_utility: source contains .label utility', () => {
    expect(COMP_SOURCE).toMatch(/\blabel\b/);
  });

  it('infra_phase_nav_uses_oxblood_active_indicator: source references --color-oxblood', () => {
    expect(COMP_SOURCE).toMatch(/--color-oxblood/);
  });

  it('infra_phase_nav_forbidden_pattern_sentinel_clean: source contains no gradient/UI-shadow/pure-color/forbidden-palette tokens', () => {
    const checks: Array<[string, RegExp]> = [
      ['linear-gradient', /\blinear-gradient\s*\(/i],
      ['radial-gradient', /\bradial-gradient\s*\(/i],
      ['bg-gradient util', /\bbg-gradient-(to-[a-z]+|conic|radial)\b/],
      ['Tailwind UI shadow', /\bshadow-(md|lg|xl|2xl|inner)\b/],
      ['pure black hex', /#0{3}(?:0{3})?\b/],
      ['pure white hex', /#f{3}(?:f{3})?\b/i],
      ['pure red hex', /#(?:f00|ff0000)\b/i],
      [
        'forbidden palette utility',
        /\b(?:bg|text|border|ring|from|to|via)-(?:red|orange|yellow|blue|indigo|purple|pink|fuchsia|rose|sky|cyan|teal|green|emerald|lime)-\d{2,3}\b/,
      ],
    ];
    const hits = checks.filter(([, re]) => re.test(COMP_SOURCE)).map(([n]) => n);
    expect(hits).toEqual([]);
  });
});
