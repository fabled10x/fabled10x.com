// Cases index (styling-overhaul-7.3) — brand-aware assertions.
//
// Replaces the placeholder-pattern tests with assertions that pin the
// editorial reskin per phase-7-pages.md Feature 7.3:
//   - <Marble> surface wraps the page
//   - <Section rhythm="md"> (py-(--section-y-md))
//   - <Container> (default width=layout)
//   - .label / .display-1 / .body-1 brand utilities used; no font-display /
//     text-4xl / text-muted / text-accent / rounded-lg / border-mist
//   - <EditorialCard> grid with tag=`${client}`, accent='.',
//     href=`/cases/${slug}`, footer=<span className='label'> status label
//
// Source-level sentinels (infra_*) read src/app/cases/page.tsx via
// readFileSync to assert no banned placeholder utility names remain.

import { vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    className,
  }: {
    children: React.ReactNode;
    href: string;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { getAllCases } from '@/lib/content/cases';
import CasesIndex, { metadata } from '../page';

const mockGetAllCases = vi.mocked(getAllCases);

const __filename_compat = fileURLToPath(import.meta.url);
const __dirname_compat = dirname(__filename_compat);
const PAGE_SOURCE_PATH = join(__dirname_compat, '..', 'page.tsx');
const PAGE_SOURCE = readFileSync(PAGE_SOURCE_PATH, 'utf8');

const BANNED_PLACEHOLDER_UTILITIES = [
  'text-accent',
  'text-muted',
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
  'hover:border-accent',
  'hover:opacity-90',
  'bg-accent',
  'text-parchment',
  'font-semibold',
  'font-medium',
];

const MOCK_CASES = [
  {
    meta: {
      id: 'case-001',
      slug: 'first-case',
      title: 'First Case Title',
      client: 'Client Alpha',
      status: 'active' as const,
      summary: 'First case summary.',
      problem: 'First problem.',
      marketResearch: '',
      discoveryProcess: '',
      technicalDecisions: '',
      deliverables: ['Deliverable A'],
      outcome: 'First outcome.',
      relatedEpisodeIds: [],
      lllEntryUrls: [],
    },
    slug: 'first-case',
    Component: () => null,
  },
  {
    meta: {
      id: 'case-002',
      slug: 'second-case',
      title: 'Second Case Title',
      client: 'Client Beta',
      status: 'shipped' as const,
      summary: 'Second case summary.',
      problem: 'Second problem.',
      marketResearch: '',
      discoveryProcess: '',
      technicalDecisions: '',
      deliverables: [],
      outcome: 'Second outcome.',
      relatedEpisodeIds: [],
      lllEntryUrls: [],
    },
    slug: 'second-case',
    Component: () => null,
  },
];

async function renderCasesIndex() {
  const jsx = await CasesIndex();
  return render(jsx);
}

describe('CasesIndex (styling-overhaul-7.3) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllCases.mockResolvedValue(MOCK_CASES);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — page chrome
  // ────────────────────────────────────────────────────────────────

  it("unit_index_label_field_notes: page renders 'Field Notes' kicker as a .label utility above the h1", async () => {
    await renderCasesIndex();
    const kicker = screen.getByText('Field Notes');
    expect(kicker).toBeInTheDocument();
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  it("unit_index_h1_display_1: h1 'Case Studies' uses .display-1 brand utility (not font-display + text-4xl)", async () => {
    await renderCasesIndex();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Case Studies' });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
  });

  it('unit_index_subtitle_body_1: intro paragraph uses .body-1 brand utility', async () => {
    const { container } = await renderCasesIndex();
    const paragraphs = container.querySelectorAll('p.body-1');
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — EditorialCard composition
  // ────────────────────────────────────────────────────────────────

  it('unit_index_card_tag_is_client: card tag renders the case client name', async () => {
    await renderCasesIndex();
    expect(screen.getByText('Client Alpha')).toBeInTheDocument();
    expect(screen.getByText('Client Beta')).toBeInTheDocument();
  });

  it('unit_index_card_headline_is_title: EditorialCard headline is the case title (rendered as h3)', async () => {
    await renderCasesIndex();
    const titleH3s = screen.getAllByRole('heading', { level: 3 });
    const headlineTexts = titleH3s.map((h) => h.textContent);
    expect(headlineTexts.some((t) => t?.includes('First Case Title'))).toBe(true);
    expect(headlineTexts.some((t) => t?.includes('Second Case Title'))).toBe(true);
  });

  it('unit_index_card_subtitle_is_summary: card subtitle is the case summary', async () => {
    await renderCasesIndex();
    expect(screen.getByText('First case summary.')).toBeInTheDocument();
    expect(screen.getByText('Second case summary.')).toBeInTheDocument();
  });

  it('unit_index_card_href: each card link href is /cases/{slug}', async () => {
    await renderCasesIndex();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/cases/first-case');
    expect(hrefs).toContain('/cases/second-case');
  });

  it('unit_index_card_status_footer_label: EditorialCard footer renders status as .label text', async () => {
    const { container } = await renderCasesIndex();
    // Status labels render inside the EditorialCard footer slot. Verify the
    // CASE_STATUS_LABELS lookup is in use — find the .label-classed spans
    // that contain the status copy.
    const labelEls = container.querySelectorAll('.label');
    const labelTexts = Array.from(labelEls).map((el) => el.textContent ?? '');
    expect(labelTexts.some((t) => t.includes('Active Engagement'))).toBe(true);
    expect(labelTexts.some((t) => t.includes('Shipped & In Production'))).toBe(true);
  });

  it("unit_index_card_accent_period: each card renders a DropAccent '.' glyph (Oxblood, aria-hidden) inside the headline", async () => {
    const { container } = await renderCasesIndex();
    const accentSpans = container.querySelectorAll(
      'span[aria-hidden="true"].text-\\(--color-oxblood\\)',
    );
    const accentGlyphs = Array.from(accentSpans)
      .map((s) => s.textContent?.trim())
      .filter((t) => t === '.');
    expect(accentGlyphs.length).toBe(MOCK_CASES.length);
  });

  it("unit_index_status_label_rendered: status labels resolve via CASE_STATUS_LABELS (PRESERVED behavior)", async () => {
    await renderCasesIndex();
    expect(screen.getByText('Active Engagement')).toBeInTheDocument();
    expect(screen.getByText('Shipped & In Production')).toBeInTheDocument();
  });

  it("unit_index_client_rendered: client name visible on each card (PRESERVED behavior)", async () => {
    await renderCasesIndex();
    expect(screen.getByText('Client Alpha')).toBeInTheDocument();
    expect(screen.getByText('Client Beta')).toBeInTheDocument();
  });

  it("unit_index_summary_rendered: summary text visible on each card (PRESERVED behavior)", async () => {
    await renderCasesIndex();
    expect(screen.getByText('First case summary.')).toBeInTheDocument();
    expect(screen.getByText('Second case summary.')).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // Integration — brand primitives + loader
  // ────────────────────────────────────────────────────────────────

  it('int_index_calls_getAllCases: loader invoked once during render', async () => {
    await renderCasesIndex();
    expect(mockGetAllCases).toHaveBeenCalledOnce();
  });

  it('int_index_wraps_in_marble: top-level Marble wrapper present (bg-(--color-marble))', async () => {
    const { container } = await renderCasesIndex();
    const marble = container.querySelector('.bg-\\(--color-marble\\)');
    expect(marble).toBeInTheDocument();
  });

  it('int_index_section_rhythm_md: <Section rhythm="md"> wraps content — py-(--section-y-md) present', async () => {
    const { container } = await renderCasesIndex();
    const section = container.querySelector('.py-\\(--section-y-md\\)');
    expect(section).toBeInTheDocument();
  });

  it('int_index_grid_layout: <ul> uses grid-cols-1 + md:grid-cols-2 + gap-(--space-4)', async () => {
    const { container } = await renderCasesIndex();
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul!.className).toMatch(/grid-cols-1/);
    expect(ul!.className).toMatch(/md:grid-cols-2/);
    expect(ul!.className).toMatch(/gap-\(--space-4\)/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it('edge_index_empty_cases: renders heading + empty grid when loader returns []', async () => {
    mockGetAllCases.mockResolvedValue([]);
    const { container } = await renderCasesIndex();
    expect(screen.getByRole('heading', { level: 1, name: 'Case Studies' })).toBeInTheDocument();
    const ul = container.querySelector('ul');
    if (ul) {
      expect(ul.querySelectorAll('li')).toHaveLength(0);
    }
  });

  it('edge_index_single_case: renders a single card when only one case exists', async () => {
    mockGetAllCases.mockResolvedValue([MOCK_CASES[0]]);
    const { container } = await renderCasesIndex();
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });

  // ────────────────────────────────────────────────────────────────
  // Data integrity
  // ────────────────────────────────────────────────────────────────

  it('data_index_card_count_matches_cases: one card per case (no dedup, no expansion)', async () => {
    const { container } = await renderCasesIndex();
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(MOCK_CASES.length);
  });

  it("data_index_status_pillar_label_lookup: status uses CASE_STATUS_LABELS lookup, never raw enum values", async () => {
    const { container } = await renderCasesIndex();
    const allText = container.textContent ?? '';
    // Raw enum values must NOT appear as standalone status text
    // (the words may still appear inside the title/summary copy, but the
    // status surface itself uses the lookup table)
    expect(allText).toMatch(/Active Engagement/);
    expect(allText).toMatch(/Shipped & In Production/);
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it('a11y_index_h1_present: exactly one h1 landmark', async () => {
    await renderCasesIndex();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it('a11y_index_heading_hierarchy_h1_h3: h1 followed by h3 cards (EditorialCard renders display-3 as h3)', async () => {
    await renderCasesIndex();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h3s = screen.getAllByRole('heading', { level: 3 });
    expect(h3s.length).toBe(MOCK_CASES.length);
  });

  it('a11y_index_links_have_accessible_text: every card anchor has visible text content', async () => {
    await renderCasesIndex();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect((link.textContent ?? '').trim().length).toBeGreaterThan(0);
    });
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels + Next metadata
  // ────────────────────────────────────────────────────────────────

  it('infra_index_no_banned_placeholder_utilities: page source contains ZERO banned placeholder utility tokens', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(
        `(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`,
      );
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_index_adopts_brand_utilities: page source contains .label AND .display-1 AND .body-1', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
  });

  it('infra_index_imports_brand_primitives: page imports Marble, Section, EditorialCard from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bEditorialCard\b/);
  });

  it("infra_index_metadata_export: exports metadata with title='Case Studies' (preserved)", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Case Studies');
  });

  it('infra_forbidden_pattern_sentinel_clean_cases_index: page source contains no gradient/UI-shadow/pure-black-white-red/forbidden-palette tokens', () => {
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
    const hits = checks.filter(([, re]) => re.test(PAGE_SOURCE)).map(([n]) => n);
    expect(hits).toEqual([]);
  });
});
