// Episodes index (styling-overhaul-7.2) — brand-aware assertions.
//
// Replaces the placeholder-pattern tests with assertions that pin the
// editorial reskin per phase-7-pages.md Feature 7.2:
//   - <Marble> surface wraps the page
//   - <Section rhythm="md"> (py-(--section-y-md))
//   - <Container> (default width=layout)
//   - .label / .display-1 / .body-1 brand utilities used; no font-display /
//     text-4xl / text-muted / text-accent / rounded-lg / border-mist
//   - <EditorialCard> grid with tag=`${series} · ${toRoman(act)}.${toRoman(episodeNumber)}`,
//     accent='?', href=`/episodes/${slug}`
//
// Source-level sentinels (infra_*) read src/app/episodes/page.tsx via
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

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { getAllEpisodes } from '@/lib/content/episodes';
import EpisodesIndex, { metadata } from '../page';

const mockGetAllEpisodes = vi.mocked(getAllEpisodes);

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

const MOCK_EPISODES = [
  {
    meta: {
      id: 'ep-001',
      slug: 'first-episode',
      title: 'First Episode Title',
      series: 'Test Series',
      season: 1,
      act: 1,
      episodeNumber: 1,
      tier: 'flagship' as const,
      pillar: 'delivery' as const,
      summary: 'First episode summary.',
      sourceMaterialIds: [],
      lllEntryUrls: [],
    },
    slug: 'first-episode',
    Component: () => null,
  },
  {
    meta: {
      id: 'ep-002',
      slug: 'second-episode',
      title: 'Second Episode Title',
      series: 'Test Series',
      season: 1,
      act: 2,
      episodeNumber: 4,
      tier: 'playbook' as const,
      pillar: 'workflow' as const,
      summary: 'Second episode summary.',
      sourceMaterialIds: [],
      lllEntryUrls: [],
    },
    slug: 'second-episode',
    Component: () => null,
  },
];

async function renderEpisodesIndex() {
  const jsx = await EpisodesIndex();
  return render(jsx);
}

describe('EpisodesIndex (styling-overhaul-7.2) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllEpisodes.mockResolvedValue(MOCK_EPISODES);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — page chrome
  // ────────────────────────────────────────────────────────────────

  it("unit_index_label_kicker: page renders 'Catalog' kicker as a .label utility above the h1", async () => {
    await renderEpisodesIndex();
    const kicker = screen.getByText('Catalog');
    expect(kicker).toBeInTheDocument();
    expect(kicker.className).toMatch(/\blabel\b/);
  });

  it("unit_index_h1_display_1: h1 'Episodes' uses .display-1 brand utility (not font-display + text-4xl)", async () => {
    await renderEpisodesIndex();
    const h1 = screen.getByRole('heading', { level: 1, name: 'Episodes' });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
  });

  it('unit_index_subtitle_body_1: intro paragraph uses .body-1 brand utility', async () => {
    const { container } = await renderEpisodesIndex();
    const paragraphs = container.querySelectorAll('p.body-1');
    expect(paragraphs.length).toBeGreaterThanOrEqual(1);
    const intro = Array.from(paragraphs).find((p) =>
      /every episode|episode archive|catalog/i.test(p.textContent ?? ''),
    );
    expect(intro).toBeDefined();
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — EditorialCard composition
  // ────────────────────────────────────────────────────────────────

  it("unit_index_card_tag_roman_format: card tag renders '{series} · {RomanAct}.{RomanEpisode}'", async () => {
    await renderEpisodesIndex();
    // First episode: act=1, episodeNumber=1 → 'Test Series · I.I'
    expect(screen.getByText('Test Series · I.I')).toBeInTheDocument();
    // Second episode: act=2, episodeNumber=4 → 'Test Series · II.IV'
    expect(screen.getByText('Test Series · II.IV')).toBeInTheDocument();
  });

  it('unit_index_card_headline_is_title: EditorialCard headline is the episode title (rendered as h3)', async () => {
    await renderEpisodesIndex();
    const titleH3s = screen.getAllByRole('heading', { level: 3 });
    const headlineTexts = titleH3s.map((h) => h.textContent);
    expect(headlineTexts.some((t) => t?.includes('First Episode Title'))).toBe(true);
    expect(headlineTexts.some((t) => t?.includes('Second Episode Title'))).toBe(true);
  });

  it('unit_index_card_subtitle_is_summary: card subtitle is the episode summary', async () => {
    await renderEpisodesIndex();
    expect(screen.getByText('First episode summary.')).toBeInTheDocument();
    expect(screen.getByText('Second episode summary.')).toBeInTheDocument();
  });

  it('unit_index_card_href: each card link href is /episodes/{slug}', async () => {
    await renderEpisodesIndex();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/episodes/first-episode');
    expect(hrefs).toContain('/episodes/second-episode');
  });

  it("unit_index_card_accent_question: each card renders a DropAccent '?' glyph (Oxblood, aria-hidden) inside the headline", async () => {
    const { container } = await renderEpisodesIndex();
    // Each EditorialCard with accent='?' produces an aria-hidden span with the ? glyph
    const accentSpans = container.querySelectorAll(
      'span[aria-hidden="true"].text-\\(--color-oxblood\\)',
    );
    const accentGlyphs = Array.from(accentSpans)
      .map((s) => s.textContent?.trim())
      .filter((t) => t === '?');
    expect(accentGlyphs.length).toBe(MOCK_EPISODES.length);
  });

  // ────────────────────────────────────────────────────────────────
  // Integration — brand primitives + loader
  // ────────────────────────────────────────────────────────────────

  it('int_index_calls_getAllEpisodes: loader invoked once during render', async () => {
    await renderEpisodesIndex();
    expect(mockGetAllEpisodes).toHaveBeenCalledOnce();
  });

  it('int_index_wraps_in_marble_surface: top-level Marble wrapper present (bg-(--color-marble))', async () => {
    const { container } = await renderEpisodesIndex();
    const marble = container.querySelector('.bg-\\(--color-marble\\)');
    expect(marble).toBeInTheDocument();
  });

  it('int_index_uses_section_rhythm_md: <Section rhythm="md"> wraps content — py-(--section-y-md) present', async () => {
    const { container } = await renderEpisodesIndex();
    const section = container.querySelector('.py-\\(--section-y-md\\)');
    expect(section).toBeInTheDocument();
  });

  it('int_index_grid_layout: <ul> uses grid-cols-1 + md:grid-cols-2 + gap-(--space-4)', async () => {
    const { container } = await renderEpisodesIndex();
    const ul = container.querySelector('ul');
    expect(ul).toBeInTheDocument();
    expect(ul!.className).toMatch(/grid-cols-1/);
    expect(ul!.className).toMatch(/md:grid-cols-2/);
    expect(ul!.className).toMatch(/gap-\(--space-4\)/);
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it('edge_index_empty_episodes: renders heading + empty grid when loader returns []', async () => {
    mockGetAllEpisodes.mockResolvedValue([]);
    const { container } = await renderEpisodesIndex();
    expect(screen.getByRole('heading', { level: 1, name: 'Episodes' })).toBeInTheDocument();
    const ul = container.querySelector('ul');
    if (ul) {
      expect(ul.querySelectorAll('li')).toHaveLength(0);
    }
  });

  it('edge_index_single_episode: renders a single card when only one episode exists', async () => {
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODES[0]]);
    const { container } = await renderEpisodesIndex();
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });

  it("edge_index_episode_missing_act: episode with act=undefined renders tag without NaN/undefined leak", async () => {
    const noAct = {
      ...MOCK_EPISODES[0],
      meta: { ...MOCK_EPISODES[0].meta, act: undefined },
    };
    mockGetAllEpisodes.mockResolvedValue([noAct]);
    const { container } = await renderEpisodesIndex();
    const tags = container.querySelectorAll('.label');
    const tagTexts = Array.from(tags)
      .map((t) => t.textContent ?? '')
      .join(' | ');
    expect(tagTexts).not.toMatch(/undefined/);
    expect(tagTexts).not.toMatch(/NaN/);
    // Tag still contains series + Roman episode 'I' (episodeNumber=1)
    expect(tagTexts).toMatch(/Test Series/);
  });

  // ────────────────────────────────────────────────────────────────
  // Data integrity
  // ────────────────────────────────────────────────────────────────

  it('data_index_card_count_matches_episodes: one card per episode (no dedup, no expansion)', async () => {
    const { container } = await renderEpisodesIndex();
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(MOCK_EPISODES.length);
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it('a11y_index_h1_present: exactly one h1 landmark', async () => {
    await renderEpisodesIndex();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it('a11y_index_heading_hierarchy_h1_h3: h1 followed by h3 cards (no intervening h2)', async () => {
    await renderEpisodesIndex();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h3s = screen.getAllByRole('heading', { level: 3 });
    expect(h3s.length).toBe(MOCK_EPISODES.length);
  });

  it('a11y_index_links_have_accessible_text: every card anchor has visible text content', async () => {
    await renderEpisodesIndex();
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
      // Match as a class-name token: not part of a longer identifier
      const re = new RegExp(`(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`);
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

  it('infra_index_imports_toRoman: page imports toRoman from @/lib/format/roman', () => {
    expect(PAGE_SOURCE).toMatch(/import[^;]*\btoRoman\b[^;]*from\s+['"]@\/lib\/format\/roman['"]/);
  });

  it("infra_index_metadata_export: exports metadata with title='Episodes' (preserved)", () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Episodes');
  });

  it('infra_forbidden_pattern_sentinel_clean_episodes_index: page source contains no gradient/UI-shadow/pure-black-white-red/forbidden-palette tokens', () => {
    // Targeted re-check against the same patterns the brand-wide sentinel enforces,
    // scoped to this single file for fast section-level visibility.
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
