import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentType } from 'react';
import { loadContent } from '../loader';
import { EpisodeSchema } from '@/content/schemas';

// --- Fixtures ---

const mockComponent: ComponentType = () => null;

const validEpisodeMeta = {
  id: 'ep-001',
  slug: 'test-episode',
  title: 'Test Episode',
  series: 'Test Series',
  episodeNumber: 1,
  tier: 'flagship' as const,
  pillar: 'delivery' as const,
  summary: 'A test episode for unit testing the content loader.',
  sourceMaterialIds: [],
  lllEntryUrls: [],
};

function createMockImport(meta: unknown, component: ComponentType = mockComponent) {
  return vi.fn().mockResolvedValue({ default: component, meta });
}

function createMockReaddir(files: string[]) {
  return vi.fn().mockResolvedValue(files);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- Unit Tests ---

describe('loadContent', () => {
  describe('unit tests', () => {
    it('unit_loader_discovers_mdx_files — only processes .mdx files', async () => {
      const readdirFn = createMockReaddir(['episode-one.mdx', 'readme.txt', 'notes.md', 'episode-two.mdx']);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toHaveLength(2);
      expect(importFn).toHaveBeenCalledTimes(2);
    });

    it('unit_loader_imports_and_validates — safeParse succeeds with valid meta', async () => {
      const readdirFn = createMockReaddir(['test.mdx']);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toHaveLength(1);
      expect(result[0].meta).toMatchObject({ id: 'ep-001', slug: 'test-episode' });
    });

    it('unit_loader_extracts_slug — slug from filename without .mdx', async () => {
      const readdirFn = createMockReaddir(['my-great-episode.mdx']);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result[0].slug).toBe('my-great-episode');
    });

    it('unit_loader_returns_component — Component is default export', async () => {
      const readdirFn = createMockReaddir(['ep.mdx']);
      const customComponent: ComponentType = () => null;
      const importFn = createMockImport(validEpisodeMeta, customComponent);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result[0].Component).toBe(customComponent);
    });

    it('unit_loader_parallel_import — multiple files imported via Promise.all', async () => {
      const readdirFn = createMockReaddir(['a.mdx', 'b.mdx', 'c.mdx']);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toHaveLength(3);
      expect(importFn).toHaveBeenCalledTimes(3);
    });
  });

  // --- Edge Case Tests ---

  describe('edge cases', () => {
    it('edge_loader_empty_directory — returns empty array', async () => {
      const readdirFn = createMockReaddir([]);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toEqual([]);
      expect(importFn).not.toHaveBeenCalled();
    });

    it('edge_loader_no_mdx_files — non-MDX files ignored, returns empty', async () => {
      const readdirFn = createMockReaddir(['readme.md', 'notes.txt', 'image.png']);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toEqual([]);
    });

    it('edge_loader_single_file — returns single-element array', async () => {
      const readdirFn = createMockReaddir(['only-one.mdx']);
      const importFn = createMockImport(validEpisodeMeta);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe('only-one');
    });

    it('edge_loader_extra_meta_fields — extra fields handled by Zod parse', async () => {
      const readdirFn = createMockReaddir(['ep.mdx']);
      const metaWithExtra = { ...validEpisodeMeta, extraField: 'should be ignored' };
      const importFn = createMockImport(metaWithExtra);

      const result = await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      expect(result).toHaveLength(1);
      expect(result[0].meta).not.toHaveProperty('extraField');
    });
  });

  // --- Error Recovery Tests ---

  describe('error recovery', () => {
    it('err_loader_invalid_meta — throws with filename and error details', async () => {
      const readdirFn = createMockReaddir(['bad-meta.mdx']);
      const invalidMeta = { id: 'ep-001' }; // missing required fields
      const importFn = createMockImport(invalidMeta);

      await expect(
        loadContent({
          directory: 'src/content/episodes',
          schema: EpisodeSchema,
          importFn,
          readdirFn,
        })
      ).rejects.toThrow('bad-meta.mdx');
    });

    it('err_loader_missing_meta — throws when no meta export', async () => {
      const readdirFn = createMockReaddir(['no-meta.mdx']);
      const importFn = vi.fn().mockResolvedValue({ default: mockComponent });

      await expect(
        loadContent({
          directory: 'src/content/episodes',
          schema: EpisodeSchema,
          importFn,
          readdirFn,
        })
      ).rejects.toThrow('no-meta.mdx');
    });

    it('err_loader_missing_default — throws when no default export', async () => {
      const readdirFn = createMockReaddir(['no-default.mdx']);
      const importFn = vi.fn().mockResolvedValue({ meta: validEpisodeMeta });

      await expect(
        loadContent({
          directory: 'src/content/episodes',
          schema: EpisodeSchema,
          importFn,
          readdirFn,
        })
      ).rejects.toThrow('no-default.mdx');
    });

    it('err_loader_error_includes_filename — error message contains file name', async () => {
      const readdirFn = createMockReaddir(['problematic-file.mdx']);
      const importFn = createMockImport({ broken: true });

      await expect(
        loadContent({
          directory: 'src/content/episodes',
          schema: EpisodeSchema,
          importFn,
          readdirFn,
        })
      ).rejects.toThrow('problematic-file.mdx');
    });
  });

  // --- Infrastructure Tests ---

  describe('infrastructure', () => {
    it('infra_loader_path_resolution — resolves directory relative to cwd', async () => {
      const readdirFn = createMockReaddir([]);
      const importFn = createMockImport(validEpisodeMeta);

      await loadContent({
        directory: 'src/content/episodes',
        schema: EpisodeSchema,
        importFn,
        readdirFn,
      });

      const calledPath = readdirFn.mock.calls[0][0] as string;
      expect(calledPath).toContain('src/content/episodes');
      expect(calledPath).toMatch(/^\//); // absolute path
    });
  });
});
