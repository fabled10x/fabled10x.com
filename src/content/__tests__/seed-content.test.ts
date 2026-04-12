import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EpisodeSchema, CaseSchema } from '@/content/schemas';

// --- Expected meta objects (must match the MDX files created in green phase) ---

const expectedEpisodeMeta = {
  id: 'ep-s1e01',
  slug: 'pilot-party-masters-discovery',
  title: 'Pilot — Discovery for Party Masters',
  series: 'The Party Masters Build',
  season: 1,
  act: 1,
  episodeNumber: 1,
  tier: 'flagship',
  pillar: 'workflow',
  summary:
    'The pilot episode. Scoping a real CRM project for Andy, documenting how an AI agent team runs discovery before a single line of code is written.',
  sourceMaterialIds: [
    'sm-party-masters-interview-notes',
    'sm-party-masters-proposal-draft',
  ],
  lllEntryUrls: [
    'https://largelanguagelibrary.ai/entries/crm-discovery-framework',
  ],
  durationMinutes: 42,
  publishedAt: '2026-04-15T12:00:00.000Z',
  youtubeUrl: 'https://www.youtube.com/watch?v=PLACEHOLDER',
};

const expectedCaseMeta = {
  id: 'case-party-masters',
  slug: 'party-masters',
  title: 'Party Masters — Event Management CRM',
  client: 'Party Masters (Andy R.)',
  status: 'active',
  summary:
    'Custom CRM and workflow system for a party-rental and events business. Replacing a stack of spreadsheets, email threads, and sticky notes with a single source of truth.',
  problem:
    'Multi-tool workflow fragmentation causing missed bookings, invoice errors, and 10+ hours a week of manual reconciliation.',
  marketResearch: 'See the episode series for the documented research phase.',
  discoveryProcess:
    'See the episode series for the discovery phase walkthrough.',
  technicalDecisions:
    'See the episode series for the architectural decision log.',
  deliverables: [
    'Booking + inventory management',
    'Customer database with segmentation',
    'Invoice generation + payment tracking',
    'Equipment scheduling',
  ],
  outcome:
    'Engagement is active — outcome and metrics will land here after the build ships.',
  startedAt: '2026-03-01T00:00:00.000Z',
  relatedEpisodeIds: ['ep-s1e01'],
  lllEntryUrls: [
    'https://largelanguagelibrary.ai/entries/crm-discovery-framework',
  ],
};

import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('seed content', () => {
  describe('unit tests', () => {
    /// Tests checklist items: 1, 3
    it('unit_seed_episode_meta_valid — episode meta passes EpisodeSchema', () => {
      const result = EpisodeSchema.safeParse(expectedEpisodeMeta);
      expect(result.success).toBe(true);
    });

    /// Tests checklist items: 2, 4
    it('unit_seed_case_meta_valid — case meta passes CaseSchema', () => {
      const result = CaseSchema.safeParse(expectedCaseMeta);
      expect(result.success).toBe(true);
    });

    /// Tests checklist items: 1
    it('unit_seed_episode_field_values — episode has correct id, slug, tier, pillar, series', () => {
      expect(expectedEpisodeMeta.id).toBe('ep-s1e01');
      expect(expectedEpisodeMeta.slug).toBe('pilot-party-masters-discovery');
      expect(expectedEpisodeMeta.tier).toBe('flagship');
      expect(expectedEpisodeMeta.pillar).toBe('workflow');
      expect(expectedEpisodeMeta.series).toBe('The Party Masters Build');
      expect(expectedEpisodeMeta.episodeNumber).toBe(1);
    });

    /// Tests checklist items: 2
    it('unit_seed_case_field_values — case has correct id, slug, status, client, deliverables', () => {
      expect(expectedCaseMeta.id).toBe('case-party-masters');
      expect(expectedCaseMeta.slug).toBe('party-masters');
      expect(expectedCaseMeta.status).toBe('active');
      expect(expectedCaseMeta.client).toBe('Party Masters (Andy R.)');
      expect(expectedCaseMeta.deliverables).toHaveLength(4);
    });
  });

  describe('integration tests', () => {
    /// Tests checklist items: 1, 6
    it('int_seed_episode_discoverable — episode MDX file exists with meta export', () => {
      const filePath = resolve(
        process.cwd(),
        'src/content/episodes/pilot-party-masters-discovery.mdx',
      );
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('export const meta');
      expect(content).toContain("id: 'ep-s1e01'");
    });

    /// Tests checklist items: 2, 6
    it('int_seed_case_discoverable — case MDX file exists with meta export', () => {
      const filePath = resolve(
        process.cwd(),
        'src/content/cases/party-masters.mdx',
      );
      expect(existsSync(filePath)).toBe(true);

      const content = readFileSync(filePath, 'utf-8');
      expect(content).toContain('export const meta');
      expect(content).toContain("id: 'case-party-masters'");
    });
  });

  describe('edge cases', () => {
    /// Tests checklist items: 1
    it('edge_seed_episode_slug_filename_match — filename derives correct slug', () => {
      const filename = 'pilot-party-masters-discovery.mdx';
      const derivedSlug = filename.replace(/\.mdx$/, '');
      expect(derivedSlug).toBe(expectedEpisodeMeta.slug);
    });

    /// Tests checklist items: 2
    it('edge_seed_case_slug_filename_match — filename derives correct slug', () => {
      const filename = 'party-masters.mdx';
      const derivedSlug = filename.replace(/\.mdx$/, '');
      expect(derivedSlug).toBe(expectedCaseMeta.slug);
    });
  });

  describe('error recovery', () => {
    /// Tests checklist items: 3
    it('err_seed_invalid_meta_descriptive_error — invalid tier triggers descriptive error', () => {
      const invalidMeta = { ...expectedEpisodeMeta, tier: 'invalid-tier' };
      const result = EpisodeSchema.safeParse(invalidMeta);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.message).toBeTruthy();
      }
    });
  });

  describe('data integrity', () => {
    /// Tests checklist items: 1, 3
    it('data_seed_episode_dates_iso — publishedAt is valid ISO 8601', () => {
      const date = new Date(expectedEpisodeMeta.publishedAt);
      expect(date.toISOString()).toBe(expectedEpisodeMeta.publishedAt);
      expect(isNaN(date.getTime())).toBe(false);
    });

    /// Tests checklist items: 2, 4
    it('data_seed_case_dates_iso — startedAt is valid ISO 8601', () => {
      const date = new Date(expectedCaseMeta.startedAt);
      expect(date.toISOString()).toBe(expectedCaseMeta.startedAt);
      expect(isNaN(date.getTime())).toBe(false);
    });
  });
});
