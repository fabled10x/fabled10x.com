export interface JobFeature {
  id: string;
  name: string;
  phase: string;
  size: string;
  status: string;
}

export interface JobPhaseHeader {
  phaseNumber?: number;
  title?: string;
  totalSize?: string;
  prerequisites?: string;
  newTypes?: string;
  newFiles?: string;
}

export interface JobPhase {
  slug: string;
  filename: string;
  header: JobPhaseHeader;
  body: string;
}

export interface Job {
  slug: string;
  alias?: string;
  title: string;
  context: string;
  features: readonly JobFeature[];
  phases: readonly JobPhase[];
  readmeBody: string;
}

/**
 * Detailed entry — the shape `/finish` writes for every completed section.
 * Fields beyond `id` are optional because backfilled / historical entries may
 * omit them; `kind` is set during normalization (src/lib/build-log/normalize.ts, 2.3).
 */
export interface DetailedCompletedSection {
  kind: 'detailed';
  id: string;
  name?: string;
  completedAt?: string;
  commitHash?: string;
  commitMessage?: string;
  tests?: number;
  filesNew?: number;
  filesModified?: number;
  pushed?: boolean;
  notes?: string;
}

/**
 * Minimal entry — what string-only legacy entries normalize to. Carries only
 * the section id; consumers degrade their UI accordingly.
 */
export interface MinimalCompletedSection {
  kind: 'minimal';
  id: string;
}

export type CompletedSectionEntry =
  | DetailedCompletedSection
  | MinimalCompletedSection;

export interface SessionStatus {
  id: string;
  startedAt?: string;
  currentPhase?: string;
  currentSection?: string;
  currentAgent?: string;
  currentStage?: string;
  /** Mirror of session.concurrent_jobs — empty array when no concurrent work. */
  concurrentJobs?: readonly string[];
  contextWindow?: {
    iteration?: number;
    totalItems?: number;
    completedItems?: number;
  };
  /**
   * Raw entries as they appear in the YAML — union of string + legacy-object
   * shapes for backward compatibility. Use `toEntry()` (src/lib/build-log/
   * normalize.ts, 2.3) to get the discriminated `CompletedSectionEntry`.
   */
  completedSections: readonly (
    | string
    | {
        section: string;
        completedAt?: string;
        // string | number: YAML coerces all-digit / float-looking hashes to numbers.
        commit_hash?: string | number;
        commit_message?: string;
        tests?: number;
        files_new?: number;
        files_modified?: number;
        pushed?: boolean;
        notes?: string;
        name?: string;
      }
  )[];
  notes?: string;
}

export interface KnowledgeFile {
  version?: number;
  project?: string;
  description?: string;
  projectContext?: {
    purpose?: string;
    stack?: Record<string, unknown>;
    contentModel?: Record<string, unknown>;
  };
  conventions?: Record<string, unknown>;
  patterns?: readonly unknown[];
  openQuestions?: readonly unknown[];
}

export interface JobRollupEntry {
  slug: string;
  title: string;
  alias?: string;
  totalFeatures: number;
  completedFeatures: number;
  liveFeatures: number;
  percentComplete: number | null;
  status: 'planned' | 'in-progress' | 'complete' | 'unknown';
}
