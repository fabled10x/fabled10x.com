import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '../loader';
import type { Case } from '@/content/schemas';

// --- Mock loader ---

vi.mock('../loader', () => ({
  loadContent: vi.fn(),
}));

import { loadContent } from '../loader';
const mockLoadContent = vi.mocked(loadContent);

// --- Fixtures ---

const mockComponent: ComponentType = () => null;

const caseAlpha: LoadedEntry<Case> = {
  meta: {
    id: 'case-001',
    slug: 'alpha-project',
    title: 'Alpha Project',
    client: 'Alpha Corp',
    status: 'active',
    summary: 'First test case study.',
    problem: 'They needed help.',
    marketResearch: 'Market analysis here.',
    discoveryProcess: 'Discovery process here.',
    technicalDecisions: 'Technical decisions here.',
    deliverables: ['MVP', 'Docs'],
    outcome: 'Success.',
    relatedEpisodeIds: [],
    lllEntryUrls: [],
  },
  slug: 'alpha-project',
  Component: mockComponent,
};

const caseZeta: LoadedEntry<Case> = {
  meta: {
    id: 'case-002',
    slug: 'zeta-project',
    title: 'Zeta Project',
    client: 'Zeta Inc',
    status: 'shipped',
    summary: 'Second test case study.',
    problem: 'Different problem.',
    marketResearch: 'Different market.',
    discoveryProcess: 'Different discovery.',
    technicalDecisions: 'Different tech.',
    deliverables: ['App', 'API'],
    outcome: 'Shipped.',
    relatedEpisodeIds: [],
    lllEntryUrls: [],
  },
  slug: 'zeta-project',
  Component: mockComponent,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('cases', () => {
  async function importCases() {
    return import('../cases');
  }

  describe('unit tests', () => {
    it('unit_cases_get_all_sorted — returns cases sorted alphabetically by title', async () => {
      mockLoadContent.mockResolvedValue([caseZeta, caseAlpha]);
      const { getAllCases } = await importCases();

      const result = await getAllCases();

      expect(result).toHaveLength(2);
      expect(result[0].slug).toBe('alpha-project'); // A before Z
      expect(result[1].slug).toBe('zeta-project');
    });

    it('unit_cases_by_slug_found — getCaseBySlug returns matching case', async () => {
      mockLoadContent.mockResolvedValue([caseAlpha, caseZeta]);
      const { getCaseBySlug } = await importCases();

      const result = await getCaseBySlug('zeta-project');

      expect(result).not.toBeNull();
      expect(result!.meta.id).toBe('case-002');
    });

    it('unit_cases_by_slug_not_found — returns null for unknown slug', async () => {
      mockLoadContent.mockResolvedValue([caseAlpha]);
      const { getCaseBySlug } = await importCases();

      const result = await getCaseBySlug('nonexistent');

      expect(result).toBeNull();
    });

    it('unit_cases_get_all_empty — returns empty array when no cases', async () => {
      mockLoadContent.mockResolvedValue([]);
      const { getAllCases } = await importCases();

      const result = await getAllCases();

      expect(result).toEqual([]);
    });
  });

  describe('edge cases', () => {
    it('edge_cases_cache_reuse — second call uses cached result', async () => {
      mockLoadContent.mockResolvedValue([caseAlpha]);
      const { getAllCases } = await importCases();

      await getAllCases();
      await getAllCases();

      expect(mockLoadContent).toHaveBeenCalledTimes(1);
    });
  });

  describe('data integrity', () => {
    it('data_cases_schema_validated — returned meta matches Case shape', async () => {
      mockLoadContent.mockResolvedValue([caseAlpha]);
      const { getAllCases } = await importCases();

      const result = await getAllCases();

      expect(result[0].meta).toHaveProperty('id');
      expect(result[0].meta).toHaveProperty('slug');
      expect(result[0].meta).toHaveProperty('title');
      expect(result[0].meta).toHaveProperty('client');
      expect(result[0].meta).toHaveProperty('status');
      expect(result[0].meta).toHaveProperty('deliverables');
    });
  });
});
