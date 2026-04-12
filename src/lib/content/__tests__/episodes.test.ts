import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '../loader';
import type { Episode } from '@/content/schemas';

// --- Mock loader ---

vi.mock('../loader', () => ({
  loadContent: vi.fn(),
}));

import { loadContent } from '../loader';
const mockLoadContent = vi.mocked(loadContent);

// --- Fixtures ---

const mockComponent: ComponentType = () => null;

const episodeA: LoadedEntry<Episode> = {
  meta: {
    id: 'ep-001',
    slug: 'first-episode',
    title: 'First Episode',
    series: 'Test Series',
    episodeNumber: 1,
    tier: 'flagship',
    pillar: 'delivery',
    summary: 'The first test episode.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
    publishedAt: '2026-01-15T00:00:00Z',
  },
  slug: 'first-episode',
  Component: mockComponent,
};

const episodeB: LoadedEntry<Episode> = {
  meta: {
    id: 'ep-002',
    slug: 'second-episode',
    title: 'Second Episode',
    series: 'Test Series',
    episodeNumber: 2,
    tier: 'playbook',
    pillar: 'workflow',
    summary: 'The second test episode.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
    publishedAt: '2026-03-20T00:00:00Z',
  },
  slug: 'second-episode',
  Component: mockComponent,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('episodes', () => {
  async function importEpisodes() {
    return import('../episodes');
  }

  describe('unit tests', () => {
    it('unit_episodes_get_all_sorted — returns episodes sorted by publishedAt descending', async () => {
      mockLoadContent.mockResolvedValue([episodeA, episodeB]);
      const { getAllEpisodes } = await importEpisodes();

      const result = await getAllEpisodes();

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('second-episode'); // 2026-03-20 > 2026-01-15
      expect(result[1].slug).toBe('first-episode');
    });

    it('unit_episodes_by_slug_found — getEpisodeBySlug returns matching episode', async () => {
      mockLoadContent.mockResolvedValue([episodeA, episodeB]);
      const { getEpisodeBySlug } = await importEpisodes();

      const result = await getEpisodeBySlug('first-episode');

      expect(result).not.toBeNull();
      expect(result!.meta.id).toBe('ep-001');
    });

    it('unit_episodes_by_slug_not_found — returns null for unknown slug', async () => {
      mockLoadContent.mockResolvedValue([episodeA, episodeB]);
      const { getEpisodeBySlug } = await importEpisodes();

      const result = await getEpisodeBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('unit_episodes_latest — getLatestEpisode returns most recent', async () => {
      mockLoadContent.mockResolvedValue([episodeA, episodeB]);
      const { getLatestEpisode } = await importEpisodes();

      const result = await getLatestEpisode();

      expect(result).not.toBeNull();
      expect(result!.meta.id).toBe('ep-002'); // most recent publishedAt
    });

    it('unit_episodes_latest_empty — returns null when no episodes', async () => {
      mockLoadContent.mockResolvedValue([]);
      const { getLatestEpisode } = await importEpisodes();

      const result = await getLatestEpisode();

      expect(result).toBeNull();
    });
  });

  describe('edge cases', () => {
    it('edge_episodes_cache_reuse — second call uses cached result', async () => {
      mockLoadContent.mockResolvedValue([episodeA]);
      const { getAllEpisodes } = await importEpisodes();

      await getAllEpisodes();
      await getAllEpisodes();

      expect(mockLoadContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('data integrity', () => {
    it('data_episodes_schema_validated — returned meta matches Episode shape', async () => {
      mockLoadContent.mockResolvedValue([episodeA]);
      const { getAllEpisodes } = await importEpisodes();

      const result = await getAllEpisodes();

      expect(result[0].meta).toHaveProperty('id');
      expect(result[0].meta).toHaveProperty('slug');
      expect(result[0].meta).toHaveProperty('title');
      expect(result[0].meta).toHaveProperty('series');
      expect(result[0].meta).toHaveProperty('tier');
      expect(result[0].meta).toHaveProperty('pillar');
    });
  });
});
