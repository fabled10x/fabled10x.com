import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import type {
  SessionStatus,
  KnowledgeFile,
  JobRollupEntry,
  Job,
} from '@/content/schemas';
import {
  SessionStatusSchema,
  KnowledgeFileSchema,
} from '@/content/schemas/validators';
import { getAllJobs } from './jobs';
import { getRepoRoot } from './repo-root';
import { getLiveSectionIds } from './worktree-state';

async function pipelinePaths(): Promise<{
  session: string;
  knowledge: string;
}> {
  const root = await getRepoRoot();
  const dir = path.join(root, 'pipeline', 'active');
  return {
    session: path.join(dir, 'session.yaml'),
    knowledge: path.join(dir, 'knowledge.yaml'),
  };
}

function mapCompletedEntry(entry: unknown): unknown {
  if (typeof entry === 'string') return entry;
  if (entry && typeof entry === 'object') {
    const e = entry as Record<string, unknown>;
    if ('section' in e) return e;
    if ('id' in e) {
      const { id, completed_at, completedAt, ...rest } = e;
      return {
        section: id,
        completedAt: completedAt ?? completed_at,
        ...rest,
      };
    }
  }
  return entry;
}

function mapSession(raw: Record<string, unknown>): unknown {
  const session = (raw.session ?? {}) as Record<string, unknown>;
  const ctx = (raw.context_window ?? {}) as Record<string, unknown> | undefined;
  const completed = Array.isArray(raw.completed_sections)
    ? (raw.completed_sections as unknown[]).map(mapCompletedEntry)
    : [];
  return {
    id: session.id,
    startedAt: session.started_at,
    currentPhase: session.current_phase,
    currentSection: session.current_section,
    currentAgent: session.current_agent,
    currentStage: session.current_stage,
    contextWindow: ctx
      ? {
          iteration: ctx.iteration,
          totalItems: ctx.total_items,
          completedItems: ctx.completed_items,
        }
      : undefined,
    completedSections: completed,
    notes: raw.notes,
  };
}

function mapKnowledge(raw: Record<string, unknown>): unknown {
  const {
    knowledge,
    project_context,
    open_questions,
    ...rest
  } = raw as Record<string, unknown>;
  const k = (knowledge ?? {}) as Record<string, unknown>;
  return {
    version: k.version,
    project: k.project,
    description: k.description,
    projectContext: project_context,
    openQuestions: open_questions,
    ...rest,
  };
}

export async function getSessionStatus(): Promise<SessionStatus> {
  const { session } = await pipelinePaths();
  const text = await fs.readFile(session, 'utf8');
  const parsed = parseYaml(text) as Record<string, unknown>;
  return SessionStatusSchema.parse(mapSession(parsed));
}

export async function getKnowledgeFile(): Promise<KnowledgeFile> {
  const { knowledge } = await pipelinePaths();
  const text = await fs.readFile(knowledge, 'utf8');
  const parsed = parseYaml(text) as Record<string, unknown>;
  return KnowledgeFileSchema.parse(mapKnowledge(parsed));
}

function extractSectionId(
  entry: SessionStatus['completedSections'][number],
): string {
  return typeof entry === 'string' ? entry : entry.section;
}

function computeStatus(
  total: number,
  completed: number,
  live: number,
): Pick<JobRollupEntry, 'percentComplete' | 'status'> {
  if (total === 0) {
    if (live > 0) return { percentComplete: null, status: 'in-progress' };
    return { percentComplete: null, status: 'unknown' };
  }
  if (completed === total) return { percentComplete: 100, status: 'complete' };
  const pct = Math.round((completed / total) * 100);
  if (live > 0) return { percentComplete: pct, status: 'in-progress' };
  if (completed === 0) return { percentComplete: 0, status: 'planned' };
  return { percentComplete: pct, status: 'in-progress' };
}

function rollupForJob(
  job: Job,
  completedSectionIds: ReadonlySet<string>,
  liveSectionIds: ReadonlySet<string>,
  ownedLiveCount: number,
): JobRollupEntry {
  const total = job.features.length;
  let completed = 0;
  let liveMatched = 0;
  for (const f of job.features) {
    const key = `${job.slug}-${f.id}`;
    if (completedSectionIds.has(key)) completed++;
    if (liveSectionIds.has(key)) liveMatched++;
  }
  const live = Math.max(liveMatched, ownedLiveCount);
  return {
    slug: job.slug,
    title: job.title,
    alias: job.alias,
    totalFeatures: total,
    completedFeatures: completed,
    liveFeatures: liveMatched,
    ...computeStatus(total, completed, live),
  };
}

function ownerSlugFor(
  sectionId: string,
  slugsByLengthDesc: readonly string[],
): string | null {
  for (const slug of slugsByLengthDesc) {
    if (sectionId.startsWith(`${slug}-`)) return slug;
  }
  return null;
}

export async function getJobsRollup(): Promise<readonly JobRollupEntry[]> {
  const [jobs, session, liveSet] = await Promise.all([
    getAllJobs(),
    getSessionStatus(),
    getLiveSectionIds(),
  ]);
  const completedSet = new Set(session.completedSections.map(extractSectionId));
  const slugsByLengthDesc = jobs
    .map((j) => j.slug)
    .slice()
    .sort((a, b) => b.length - a.length);
  const ownedCounts = new Map<string, number>();
  for (const sectionId of liveSet) {
    const owner = ownerSlugFor(sectionId, slugsByLengthDesc);
    if (owner) ownedCounts.set(owner, (ownedCounts.get(owner) ?? 0) + 1);
  }
  return Object.freeze(
    jobs.map((j) =>
      rollupForJob(j, completedSet, liveSet, ownedCounts.get(j.slug) ?? 0),
    ),
  );
}
