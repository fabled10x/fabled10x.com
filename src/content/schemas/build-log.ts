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

export interface SessionStatus {
  id: string;
  startedAt?: string;
  currentPhase?: string;
  currentSection?: string;
  currentAgent?: string;
  currentStage?: string;
  contextWindow?: {
    iteration?: number;
    totalItems?: number;
    completedItems?: number;
  };
  completedSections: readonly (
    | string
    | { section: string; completedAt?: string }
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
  percentComplete: number | null;
  status: 'planned' | 'in-progress' | 'complete' | 'unknown';
}
