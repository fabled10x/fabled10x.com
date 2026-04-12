import { z } from 'zod';
import { CONTENT_TIERS } from './content-tier';
import { CONTENT_PILLARS } from './content-pillar';
import { SOURCE_MATERIAL_KINDS } from './source-material';
import { CASE_STATUSES } from './case';

export const EpisodeSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  series: z.string().min(1),
  season: z.number().int().positive().optional(),
  act: z.number().int().positive().optional(),
  episodeNumber: z.number().int().nonnegative(),
  tier: z.enum(CONTENT_TIERS),
  pillar: z.enum(CONTENT_PILLARS),
  summary: z.string().min(1),
  sourceMaterialIds: z.array(z.string()),
  lllEntryUrls: z.array(z.url()),
  durationMinutes: z.number().int().positive().optional(),
  publishedAt: z.iso.datetime().optional(),
  youtubeUrl: z.url().optional(),
  thumbnailUrl: z.url().optional(),
  transcriptPath: z.string().optional(),
});

export const SourceMaterialSchema = z.object({
  id: z.string().min(1),
  filename: z.string().min(1),
  kind: z.enum(SOURCE_MATERIAL_KINDS),
  description: z.string().min(1),
  episodeIds: z.array(z.string()),
  path: z.string().optional(),
});

export const CaseSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  client: z.string().min(1),
  status: z.enum(CASE_STATUSES),
  summary: z.string().min(1),
  problem: z.string().min(1),
  marketResearch: z.string(),
  discoveryProcess: z.string(),
  technicalDecisions: z.string(),
  deliverables: z.array(z.string()),
  outcome: z.string(),
  startedAt: z.iso.datetime().optional(),
  shippedAt: z.iso.datetime().optional(),
  contractValue: z.number().nonnegative().optional(),
  relatedEpisodeIds: z.array(z.string()),
  lllEntryUrls: z.array(z.url()),
  heroImageUrl: z.url().optional(),
});

export type EpisodeInput = z.input<typeof EpisodeSchema>;
export type SourceMaterialInput = z.input<typeof SourceMaterialSchema>;
export type CaseInput = z.input<typeof CaseSchema>;
