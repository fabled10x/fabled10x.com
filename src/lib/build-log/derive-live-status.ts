import type { SessionStatus } from '@/content/schemas';
import type { LiveWorktree } from './worktree-state';

export type LiveStatus = 'active' | 'idle' | 'paused' | 'stale' | 'unknown';

const IDLE_WINDOW_HOURS = 24;
const STALE_WINDOW_HOURS = 72;

interface DeriveInput {
  session: SessionStatus | null;
  worktrees: readonly LiveWorktree[];
  completedSections: SessionStatus['completedSections'];
  nowIso: string;
}

export function deriveLiveStatus({
  session,
  worktrees,
  completedSections,
  nowIso,
}: DeriveInput): LiveStatus {
  if (!session) return 'unknown';

  const stageRaw = session.currentStage ?? '';
  if (session.currentAgent === 'pending' || stageRaw.endsWith('-failed')) {
    return 'paused';
  }

  if (worktrees.length > 0 && !!session.currentSection) {
    const hasMatch = worktrees.some(
      (w) => w.sectionId === session.currentSection,
    );
    if (hasMatch) return 'active';
  }

  if (!session.currentSection && worktrees.length === 0) {
    const mostRecentMs = mostRecentCompletedAt(completedSections);
    if (mostRecentMs === null) return 'stale';

    const now = Date.parse(nowIso);
    if (Number.isNaN(now)) return 'stale';

    const ageHours = (now - mostRecentMs) / (1000 * 60 * 60);
    if (ageHours <= STALE_WINDOW_HOURS) return 'idle';
    return 'stale';
  }

  return 'idle';
}

function mostRecentCompletedAt(
  entries: SessionStatus['completedSections'],
): number | null {
  let max: number | null = null;
  for (const entry of entries) {
    if (typeof entry === 'string') continue;
    if (!entry.completedAt) continue;
    const ms = Date.parse(entry.completedAt);
    if (Number.isNaN(ms)) continue;
    if (max === null || ms > max) max = ms;
  }
  return max;
}

export const _thresholds = { IDLE_WINDOW_HOURS, STALE_WINDOW_HOURS };
