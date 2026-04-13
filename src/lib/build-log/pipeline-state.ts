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

const PIPELINE_DIR = path.join(process.cwd(), 'pipeline', 'active');
const SESSION_PATH = path.join(PIPELINE_DIR, 'session.yaml');
const KNOWLEDGE_PATH = path.join(PIPELINE_DIR, 'knowledge.yaml');

let sessionCache: SessionStatus | null = null;
let knowledgeCache: KnowledgeFile | null = null;

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
  if (sessionCache) return sessionCache;
  const text = await fs.readFile(SESSION_PATH, 'utf8');
  const parsed = parseYaml(text) as Record<string, unknown>;
  sessionCache = SessionStatusSchema.parse(mapSession(parsed));
  return sessionCache;
}

export async function getKnowledgeFile(): Promise<KnowledgeFile> {
  if (knowledgeCache) return knowledgeCache;
  const text = await fs.readFile(KNOWLEDGE_PATH, 'utf8');
  const parsed = parseYaml(text) as Record<string, unknown>;
  knowledgeCache = KnowledgeFileSchema.parse(mapKnowledge(parsed));
  return knowledgeCache;
}

function extractSectionId(
  entry: SessionStatus['completedSections'][number],
): string {
  return typeof entry === 'string' ? entry : entry.section;
}

function computeStatus(
  total: number,
  completed: number,
): Pick<JobRollupEntry, 'percentComplete' | 'status'> {
  if (total === 0) return { percentComplete: null, status: 'unknown' };
  if (completed === 0) return { percentComplete: 0, status: 'planned' };
  if (completed === total) return { percentComplete: 100, status: 'complete' };
  return {
    percentComplete: Math.round((completed / total) * 100),
    status: 'in-progress',
  };
}

function rollupForJob(
  job: Job,
  completedSectionIds: ReadonlySet<string>,
): JobRollupEntry {
  const total = job.features.length;
  const completed = job.features.filter((f) =>
    completedSectionIds.has(`${job.slug}-${f.id}`),
  ).length;
  return {
    slug: job.slug,
    title: job.title,
    alias: job.alias,
    totalFeatures: total,
    completedFeatures: completed,
    ...computeStatus(total, completed),
  };
}

export async function getJobsRollup(): Promise<readonly JobRollupEntry[]> {
  const [jobs, session] = await Promise.all([
    getAllJobs(),
    getSessionStatus(),
  ]);
  const completedSet = new Set(session.completedSections.map(extractSectionId));
  return Object.freeze(jobs.map((j) => rollupForJob(j, completedSet)));
}
