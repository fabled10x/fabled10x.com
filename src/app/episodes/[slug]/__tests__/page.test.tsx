// Episode detail (styling-overhaul-7.2) — brand-aware assertions.
//
// Replaces the placeholder-pattern tests with assertions that pin the
// editorial reskin per phase-7-pages.md Feature 7.2:
//   - <Marble> surface wraps the page
//   - <Section rhythm="lg"> (py-(--section-y-lg))
//   - <Container width="prose"> (max-w-prose)
//   - .label / .display-1 / .body-1 brand utilities
//   - Roman numerals in label line: '{series} · Act {Roman} · Episode {Roman}'
//   - <DropAccent glyph="?" size="large"> wrapping h1 title (Oxblood ? after title)
//   - MDX body wrapped in .build-log-prose with border-t separator
//   - Preserved: YouTube link, source materials, EmailCapture, LllCrosslinks,
//     JSON-LD VideoObject, generateStaticParams, generateMetadata, notFound
//
// Source-level sentinels (infra_*) read src/app/episodes/[slug]/page.tsx via
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

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
  getEpisodeBySlug: vi.fn(),
}));

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

vi.mock('@/components/crosslinks/LllCrosslinks', () => ({
  LllCrosslinks: ({ urls, className }: { urls: string[]; className?: string }) => (
    <div data-testid="lll-crosslinks" data-urls={JSON.stringify(urls)} className={className} />
  ),
}));

import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { notFound } from 'next/navigation';
import { getAllEpisodes, getEpisodeBySlug } from '@/lib/content/episodes';
import EpisodeDetail, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetEpisodeBySlug = vi.mocked(getEpisodeBySlug);
const mockGetAllEpisodes = vi.mocked(getAllEpisodes);
const mockNotFound = vi.mocked(notFound);

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
  'prose-style',
];

const MOCK_COMPONENT = () => <div data-testid="mdx-body">Episode MDX content</div>;

const MOCK_EPISODE_FULL = {
  meta: {
    id: 'ep-001',
    slug: 'test-episode',
    title: 'Test Episode Title',
    series: 'Discovery Series',
    season: 1,
    act: 3,
    episodeNumber: 4,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'A test episode summary for testing.',
    sourceMaterialIds: ['sm-001', 'sm-002'],
    lllEntryUrls: [
      'https://largelanguagelibrary.ai/entries/discovery-process',
      'https://largelanguagelibrary.ai/entries/agent-workflow',
    ],
    youtubeUrl: 'https://youtube.com/watch?v=test123',
    durationMinutes: 45,
    publishedAt: '2026-04-15T12:00:00Z',
  },
  slug: 'test-episode',
  Component: MOCK_COMPONENT,
};

const MOCK_EPISODE_MINIMAL = {
  meta: {
    id: 'ep-002',
    slug: 'minimal-episode',
    title: 'Minimal Episode',
    series: 'Short Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'shorts' as const,
    pillar: 'workflow' as const,
    summary: 'Minimal episode summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'minimal-episode',
  Component: () => <div data-testid="mdx-body">Minimal content</div>,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'test-episode') {
  const jsx = await EpisodeDetail(makeParams(slug));
  return render(jsx);
}

describe('EpisodeDetail (styling-overhaul-7.2) — brand reskin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_FULL);
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODE_FULL, MOCK_EPISODE_MINIMAL]);
  });

  // ────────────────────────────────────────────────────────────────
  // Unit — page chrome
  // ────────────────────────────────────────────────────────────────

  it("unit_detail_label_roman_format: label line renders '{series} · Act {RomanAct} · Episode {RomanEpisode}' with .label utility", async () => {
    const { container } = await renderDetail();
    // For act=3, episodeNumber=4 → 'Discovery Series · Act III · Episode IV'
    const labels = container.querySelectorAll('.label');
    const labelText = Array.from(labels)
      .map((el) => el.textContent ?? '')
      .join(' | ');
    expect(labelText).toMatch(/Discovery Series/);
    expect(labelText).toMatch(/Act\s+III/);
    expect(labelText).toMatch(/Episode\s+IV/);
  });

  it("unit_detail_h1_display_1_with_dropaccent: h1 uses .display-1 and renders a DropAccent '?' glyph after title", async () => {
    await renderDetail();
    const h1 = screen.getByRole('heading', { level: 1, name: /Test Episode Title/ });
    expect(h1.className).toMatch(/\bdisplay-1\b/);
    // DropAccent renders an aria-hidden Oxblood span with the glyph after the title text
    const accent = h1.querySelector('span[aria-hidden="true"].text-\\(--color-oxblood\\)');
    expect(accent).not.toBeNull();
    expect(accent?.textContent?.trim()).toBe('?');
  });

  it('unit_detail_summary_body_1: summary paragraph uses .body-1 brand utility', async () => {
    const { container } = await renderDetail();
    const bodyParas = container.querySelectorAll('p.body-1');
    const summaryPara = Array.from(bodyParas).find((p) =>
      (p.textContent ?? '').includes('A test episode summary for testing.'),
    );
    expect(summaryPara).toBeDefined();
  });

  it('unit_detail_mdx_component_rendered: MDX <Component /> body renders (data-testid=mdx-body from mock)', async () => {
    await renderDetail();
    expect(screen.getByTestId('mdx-body')).toBeInTheDocument();
    expect(screen.getByText('Episode MDX content')).toBeInTheDocument();
  });

  it('unit_detail_prose_class_on_body: MDX wrapper carries .build-log-prose class for editorial retrofit', async () => {
    const { container } = await renderDetail();
    const proseWrapper = container.querySelector('.build-log-prose');
    expect(proseWrapper).toBeInTheDocument();
    // The MDX body must be a descendant of the prose wrapper
    expect(proseWrapper!.querySelector('[data-testid="mdx-body"]')).not.toBeNull();
  });

  it('unit_detail_border_t_separator: a border-t border-(--edge-color) rule sits above the MDX prose body (manuscript section break)', async () => {
    const { container } = await renderDetail();
    const candidates = container.querySelectorAll('[class*="border-t"][class*="--edge-color"]');
    // At least one ancestor of the prose wrapper carries the border-t + edge token combo
    const proseWrapper = container.querySelector('.build-log-prose');
    expect(proseWrapper).not.toBeNull();
    const hasSeparator = Array.from(candidates).some(
      (el) => el === proseWrapper || el.contains(proseWrapper!) || proseWrapper!.contains(el),
    );
    expect(hasSeparator).toBe(true);
  });

  it('unit_detail_youtube_link_preserved: Watch on YouTube link still renders when meta.youtubeUrl is set', async () => {
    await renderDetail();
    const link = screen.getByRole('link', { name: /Watch on YouTube/i });
    expect(link).toHaveAttribute('href', 'https://youtube.com/watch?v=test123');
  });

  it('unit_detail_source_materials_preserved: Source materials section still renders with meta.sourceMaterialIds', async () => {
    await renderDetail();
    expect(screen.getByText('Source materials')).toBeInTheDocument();
    expect(screen.getByText('sm-001')).toBeInTheDocument();
    expect(screen.getByText('sm-002')).toBeInTheDocument();
  });

  it('unit_detail_email_capture_preserved: EmailCapture mounted with source=episode-{slug}', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    expect(capture).toHaveAttribute('data-source', 'episode-test-episode');
  });

  it('unit_detail_lll_crosslinks_preserved: LllCrosslinks rendered with meta.lllEntryUrls when non-empty', async () => {
    await renderDetail();
    const crosslinks = screen.getByTestId('lll-crosslinks');
    expect(crosslinks).toBeInTheDocument();
    const urls = JSON.parse(crosslinks.getAttribute('data-urls')!);
    expect(urls).toHaveLength(2);
  });

  // ────────────────────────────────────────────────────────────────
  // Integration — brand primitives + loader
  // ────────────────────────────────────────────────────────────────

  it('int_detail_calls_getEpisodeBySlug: loader invoked with params.slug', async () => {
    await renderDetail();
    expect(mockGetEpisodeBySlug).toHaveBeenCalledWith('test-episode');
  });

  it('int_detail_wraps_in_marble_surface: top-level Marble wrapper present (bg-(--color-marble))', async () => {
    const { container } = await renderDetail();
    const marble = container.querySelector('.bg-\\(--color-marble\\)');
    expect(marble).toBeInTheDocument();
  });

  it('int_detail_uses_section_rhythm_lg: <Section rhythm="lg"> wraps reading-heavy content — py-(--section-y-lg)', async () => {
    const { container } = await renderDetail();
    const section = container.querySelector('.py-\\(--section-y-lg\\)');
    expect(section).toBeInTheDocument();
  });

  it('int_detail_uses_container_prose_width: <Container width="prose"> — max-w-prose class present (long-form reading)', async () => {
    const { container } = await renderDetail();
    const prose = container.querySelector('.max-w-prose');
    expect(prose).toBeInTheDocument();
  });

  // ────────────────────────────────────────────────────────────────
  // Edge cases
  // ────────────────────────────────────────────────────────────────

  it('edge_detail_no_youtube_url: omits Watch on YouTube when meta.youtubeUrl is undefined', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_MINIMAL);
    await renderDetail('minimal-episode');
    expect(screen.queryByText(/Watch on YouTube/i)).not.toBeInTheDocument();
  });

  it('edge_detail_empty_source_materials: omits Source materials when sourceMaterialIds is []', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_MINIMAL);
    await renderDetail('minimal-episode');
    expect(screen.queryByText('Source materials')).not.toBeInTheDocument();
  });

  it('edge_detail_empty_lll_urls: omits LllCrosslinks when lllEntryUrls is []', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE_MINIMAL);
    await renderDetail('minimal-episode');
    expect(screen.queryByTestId('lll-crosslinks')).not.toBeInTheDocument();
  });

  it('edge_detail_missing_act_label: act=undefined renders label without NaN/undefined leak', async () => {
    const noAct = {
      ...MOCK_EPISODE_FULL,
      meta: { ...MOCK_EPISODE_FULL.meta, act: undefined },
    };
    mockGetEpisodeBySlug.mockResolvedValue(noAct);
    const { container } = await renderDetail();
    const labels = container.querySelectorAll('.label');
    const labelText = Array.from(labels)
      .map((el) => el.textContent ?? '')
      .join(' | ');
    expect(labelText).not.toMatch(/undefined/);
    expect(labelText).not.toMatch(/NaN/);
    expect(labelText).toMatch(/Discovery Series/);
    // Roman episode IV still present (episodeNumber=4)
    expect(labelText).toMatch(/IV/);
  });

  // ────────────────────────────────────────────────────────────────
  // Error recovery
  // ────────────────────────────────────────────────────────────────

  it('err_detail_not_found_when_slug_missing: calls notFound() and returns undefined when loader returns null', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(null);
    const jsx = await EpisodeDetail(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  it('err_detail_metadata_missing_slug_returns_empty_object: generateMetadata returns {} (no throw) for unknown slug', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    expect(meta).toEqual({});
  });

  // ────────────────────────────────────────────────────────────────
  // Data integrity (preserved JSON-LD + email source contract)
  // ────────────────────────────────────────────────────────────────

  it('data_detail_jsonld_valid_json_preserved: JSON-LD script body parses as valid JSON', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
    expect(() => JSON.parse(script!.innerHTML)).not.toThrow();
  });

  it('data_detail_jsonld_videoobject_fields_preserved: JSON-LD VideoObject fields match meta values', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]');
    const parsed = JSON.parse(script!.innerHTML);
    expect(parsed['@context']).toBe('https://schema.org');
    expect(parsed['@type']).toBe('VideoObject');
    expect(parsed.name).toBe('Test Episode Title');
    expect(parsed.description).toBe('A test episode summary for testing.');
    expect(parsed.datePublished).toBe('2026-04-15T12:00:00Z');
    expect(parsed.contentUrl).toBe('https://youtube.com/watch?v=test123');
  });

  it('data_detail_email_source_format_preserved: EmailCapture source attribute equals episode-{slug}', async () => {
    await renderDetail();
    const capture = screen.getByTestId('email-capture');
    expect(capture.getAttribute('data-source')).toBe('episode-test-episode');
  });

  // ────────────────────────────────────────────────────────────────
  // Accessibility
  // ────────────────────────────────────────────────────────────────

  it('a11y_detail_h1_present: exactly one h1 with the episode title', async () => {
    await renderDetail();
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0].textContent).toMatch(/Test Episode Title/);
  });

  it('a11y_detail_article_landmark: article landmark wraps the manuscript content', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  it("a11y_detail_dropaccent_aria_hidden: DropAccent '?' carries aria-hidden='true' (decorative)", async () => {
    const { container } = await renderDetail();
    const oxbloodSpans = container.querySelectorAll('span.text-\\(--color-oxblood\\)');
    const hiddenGlyphs = Array.from(oxbloodSpans).filter(
      (s) => s.getAttribute('aria-hidden') === 'true' && s.textContent?.trim() === '?',
    );
    expect(hiddenGlyphs.length).toBeGreaterThanOrEqual(1);
  });

  // ────────────────────────────────────────────────────────────────
  // Infrastructure — source-level sentinels + Next routing/metadata
  // ────────────────────────────────────────────────────────────────

  it('infra_detail_no_banned_placeholder_utilities: page source contains ZERO banned placeholder utility tokens (incl. legacy prose-style)', () => {
    const hits: string[] = [];
    for (const token of BANNED_PLACEHOLDER_UTILITIES) {
      const re = new RegExp(`(?:^|[\\s"'\`])${token.replace(/[-./\\^$*+?.()|[\]{}]/g, '\\$&')}(?:[\\s"'\`]|$)`);
      if (re.test(PAGE_SOURCE)) hits.push(token);
    }
    expect(hits).toEqual([]);
  });

  it('infra_detail_adopts_brand_utilities: page source contains .label AND .display-1 AND .body-1 AND .build-log-prose', () => {
    expect(PAGE_SOURCE).toMatch(/\blabel\b/);
    expect(PAGE_SOURCE).toMatch(/\bdisplay-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bbody-1\b/);
    expect(PAGE_SOURCE).toMatch(/\bbuild-log-prose\b/);
  });

  it('infra_detail_imports_brand_primitives: page imports Marble, Section, DropAccent from @/components/brand', () => {
    expect(PAGE_SOURCE).toMatch(/from\s+['"]@\/components\/brand['"]/);
    expect(PAGE_SOURCE).toMatch(/\bMarble\b/);
    expect(PAGE_SOURCE).toMatch(/\bSection\b/);
    expect(PAGE_SOURCE).toMatch(/\bDropAccent\b/);
  });

  it('infra_detail_imports_toRoman: page imports toRoman from @/lib/format/roman', () => {
    expect(PAGE_SOURCE).toMatch(/import[^;]*\btoRoman\b[^;]*from\s+['"]@\/lib\/format\/roman['"]/);
  });

  it('infra_detail_dynamic_params_false_preserved: exports dynamicParams = false', () => {
    expect(dynamicParams).toBe(false);
  });

  it('infra_detail_generate_static_params_preserved: returns one entry per episode slug', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual([{ slug: 'test-episode' }, { slug: 'minimal-episode' }]);
  });

  it('infra_detail_generate_metadata_preserved: returns title/description/openGraph/twitter from episode meta', async () => {
    const meta = await generateMetadata(makeParams('test-episode'));
    expect(meta.title).toBe('Test Episode Title');
    expect(meta.description).toBe('A test episode summary for testing.');
    const og = meta.openGraph as { type?: string; title?: string; description?: string; publishedTime?: string } | undefined;
    expect(og?.type).toBe('article');
    expect(og?.title).toBe('Test Episode Title');
    expect(og?.publishedTime).toBe('2026-04-15T12:00:00Z');
    const twitter = meta.twitter as { card?: string; title?: string } | undefined;
    expect(twitter?.card).toBe('summary_large_image');
    expect(twitter?.title).toBe('Test Episode Title');
  });

  it('infra_forbidden_pattern_sentinel_clean_episodes_detail: page source contains no gradient/UI-shadow/pure-black-white-red/forbidden-palette tokens', () => {
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
