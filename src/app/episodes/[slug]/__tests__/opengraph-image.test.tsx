import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { isValidElement, type ReactNode } from 'react';

vi.mock('next/og', () => ({
  ImageResponse: vi
    .fn()
    .mockImplementation((element: ReactNode, options: Record<string, unknown>) => ({
      __element: element,
      __options: options,
    })),
}));
vi.mock('@/lib/content/episodes', () => ({
  getEpisodeBySlug: vi.fn(),
}));

import { ImageResponse } from 'next/og';
import { getEpisodeBySlug } from '@/lib/content/episodes';
import Image, { size, contentType } from '../opengraph-image';

const MockImageResponse = vi.mocked(ImageResponse);
const mockGetEpisodeBySlug = vi.mocked(getEpisodeBySlug);

const OXBLOOD = '#6B2020';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROUTE_SRC = readFileSync(join(HERE, '..', 'opengraph-image.tsx'), 'utf8');

const MOCK_EPISODE = {
  meta: {
    id: 'ep-001',
    slug: 'ship-it-alone',
    title: 'Ship It Alone',
    series: 'Zero to 10x',
    episodeNumber: 3,
    act: 2,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'SECRET_SUMMARY_SHOULD_NOT_APPEAR_IN_OG',
    sourceMaterialIds: [],
    lllEntryUrls: [],
    transcriptPath: '/secret/transcript.md',
  },
  slug: 'ship-it-alone',
  Component: () => null,
};

type EpEntry = Awaited<ReturnType<typeof getEpisodeBySlug>>;

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return collectText(props.children);
  }
  return '';
}
interface Span {
  style: Record<string, unknown>;
  text: string;
}
function collectSpans(node: ReactNode, acc: Span[] = []): Span[] {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSpans(n, acc));
    return acc;
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; style?: Record<string, unknown> };
    if (props.style) acc.push({ style: props.style, text: collectText(props.children) });
    collectSpans(props.children, acc);
  }
  return acc;
}
function accentGlyph(element: ReactNode): string | undefined {
  const oxbloodSpans = collectSpans(element).filter(
    (s) => s.style.color === OXBLOOD && typeof s.style.fontSize === 'number',
  );
  if (oxbloodSpans.length === 0) return undefined;
  oxbloodSpans.sort((a, b) => (b.style.fontSize as number) - (a.style.fontSize as number));
  return oxbloodSpans[0].text;
}

interface Captured {
  __element: ReactNode;
  __options: { width?: number; height?: number; fonts?: unknown[] };
}

describe('episode opengraph-image (styling-overhaul-8.2)', () => {
  beforeEach(() => {
    MockImageResponse.mockClear();
    mockGetEpisodeBySlug.mockReset();
  });

  it('unit_episode_config_exports', () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe('image/png');
  });

  it('int_episode_calls_loader_and_constructs', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE as unknown as EpEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'ship-it-alone' }) })) as unknown as Captured;
    expect(mockGetEpisodeBySlug).toHaveBeenCalledWith('ship-it-alone');
    expect(MockImageResponse).toHaveBeenCalledTimes(1);
    expect(res.__options.fonts).toHaveLength(3);
    const text = collectText(res.__element);
    expect(text).toContain('Ship It Alone');
    expect(text).toContain('Zero to 10x');
    expect(text).toContain('Episode 3');
  });

  it('int_episode_awaits_params_promise', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE as unknown as EpEntry);
    // params is a Promise (Next 16 async params); route must await it
    await Image({ params: Promise.resolve({ slug: 'ship-it-alone' }) });
    expect(mockGetEpisodeBySlug).toHaveBeenCalledWith('ship-it-alone');
  });

  it('sec_info_disclosure_episode_only_public_fields', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE as unknown as EpEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'ship-it-alone' }) })) as unknown as Captured;
    const text = collectText(res.__element);
    expect(text).not.toContain('SECRET_SUMMARY_SHOULD_NOT_APPEAR_IN_OG');
    expect(text).not.toContain('/secret/transcript.md');
    expect(text).toContain('Ship It Alone'); // public title present
    expect(text).toContain('Zero to 10x'); // public series present
  });

  it('sec_tampering_unknown_slug_fallback_no_throw', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(null);
    const evil = 'evil-<script>alert(1)</script>';
    const res = (await Image({ params: Promise.resolve({ slug: evil }) })) as unknown as Captured;
    expect(MockImageResponse).toHaveBeenCalledTimes(1);
    const text = collectText(res.__element);
    expect(text).not.toContain(evil); // raw slug never rendered
  });

  it('edge_state_episode_without_act', async () => {
    const noAct = { ...MOCK_EPISODE, meta: { ...MOCK_EPISODE.meta, act: undefined } };
    mockGetEpisodeBySlug.mockResolvedValue(noAct as unknown as EpEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'ship-it-alone' }) })) as unknown as Captured;
    const text = collectText(res.__element);
    expect(text).not.toContain('undefined');
    expect(text).toContain('Episode 3');
  });

  it('err_episode_null_entry_fallback', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(null);
    const res = (await Image({ params: Promise.resolve({ slug: 'missing' }) })) as unknown as Captured;
    expect(res).toBeDefined();
    expect(res.__options.width).toBe(1200);
    expect(res.__options.height).toBe(630);
  });

  it('data_consistency_accent_vocabulary', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE as unknown as EpEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'ship-it-alone' }) })) as unknown as Captured;
    expect(accentGlyph(res.__element)).toBe('?'); // episodes ask
  });

  it('infra_episode_route_dynamic_params_contract', () => {
    expect(ROUTE_SRC).toMatch(/params:\s*Promise<\{\s*slug:\s*string\s*\}>/);
    expect(ROUTE_SRC).toMatch(/await\s+params/);
  });

  it('perm_anonymous_episode_og_allow', async () => {
    mockGetEpisodeBySlug.mockResolvedValue(MOCK_EPISODE as unknown as EpEntry);
    const res = await Image({ params: Promise.resolve({ slug: 'ship-it-alone' }) });
    expect(res).toBeDefined();
  });
});
