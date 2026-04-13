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

// ── Build-log schemas (build-in-public-docs-1.1) ────────────────────

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const PHASE_SLUG = /^phase-\d+-[a-z0-9]+(-[a-z0-9]+)*$/;
const SECTION_ID = /^[a-z0-9-]+-\d+\.\d+$/;

export const JobFeatureSchema = z.object({
  id: z.string().regex(/^\d+\.\d+$/),
  name: z.string().min(1).max(500),
  phase: z.string().min(1).max(80),
  size: z.string().min(1).max(8),
  status: z.string().min(1).max(40),
});

export const JobPhaseHeaderSchema = z.object({
  phaseNumber: z.number().int().positive().optional(),
  title: z.string().optional(),
  totalSize: z.string().optional(),
  prerequisites: z.string().optional(),
  newTypes: z.string().optional(),
  newFiles: z.string().optional(),
});

export const JobPhaseSchema = z.object({
  slug: z.string().regex(PHASE_SLUG),
  filename: z.string().regex(/^phase-\d+-[a-z0-9-]+\.md$/),
  header: JobPhaseHeaderSchema,
  body: z.string().min(1),
});

export const JobSchema = z.object({
  slug: z.string().regex(SLUG),
  alias: z.string().regex(/^[a-z]{1,8}$/).optional(),
  title: z.string().min(1).max(200),
  context: z.string(),
  features: z.array(JobFeatureSchema),
  phases: z.array(JobPhaseSchema),
  readmeBody: z.string().min(1),
});

const CompletedSectionEntrySchema = z.union([
  z.string().regex(SECTION_ID),
  z
    .object({
      section: z.string().regex(SECTION_ID),
      completedAt: z.string().optional(),
    })
    .passthrough(),
]);

export const SessionStatusSchema = z.object({
  id: z.string().min(1),
  startedAt: z.string().optional(),
  currentPhase: z.string().optional(),
  currentSection: z.string().optional(),
  currentAgent: z.string().optional(),
  currentStage: z.string().optional(),
  contextWindow: z
    .object({
      iteration: z.number().int().nonnegative().optional(),
      totalItems: z.number().int().nonnegative().optional(),
      completedItems: z.number().int().nonnegative().optional(),
    })
    .optional(),
  completedSections: z.array(CompletedSectionEntrySchema),
  notes: z.string().optional(),
});

export const KnowledgeFileSchema = z
  .object({
    version: z.number().int().positive().optional(),
    project: z.string().optional(),
    description: z.string().optional(),
    projectContext: z
      .object({
        purpose: z.string().optional(),
        stack: z.record(z.string(), z.unknown()).optional(),
        contentModel: z.record(z.string(), z.unknown()).optional(),
      })
      .passthrough()
      .optional(),
    conventions: z.record(z.string(), z.unknown()).optional(),
    patterns: z.array(z.unknown()).optional(),
    openQuestions: z.array(z.unknown()).optional(),
  })
  .passthrough();

export type JobInput = z.input<typeof JobSchema>;
export type SessionStatusInput = z.input<typeof SessionStatusSchema>;
export type KnowledgeFileInput = z.input<typeof KnowledgeFileSchema>;
