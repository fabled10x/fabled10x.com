import { PhaseStepper } from './PhaseStepper';
import { phaseLabel, isPhaseName } from '@/lib/build-log/phase-labels';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import type { SessionStatus } from '@/content/schemas';
import type { LiveWorktree } from '@/lib/build-log/worktree-state';

export interface LiveWorktreesPanelProps {
  worktrees: readonly LiveWorktree[];
  session: SessionStatus | null;
  nowIso: string;
}

export function LiveWorktreesPanel({
  worktrees,
  session,
  nowIso,
}: LiveWorktreesPanelProps) {
  if (worktrees.length === 0 && !session?.currentSection) {
    return null;
  }

  return (
    <section className="mb-10" aria-labelledby="live-worktrees-heading">
      <h2 id="live-worktrees-heading" className="text-2xl font-display mb-1">
        Live work
      </h2>
      <p className="text-sm text-(--color-muted) mb-4">
        {worktrees.length === 0
          ? 'A section is checked out but no worktree is currently active.'
          : worktrees.length === 1
            ? 'One section is in active development right now.'
            : `${worktrees.length} sections are in active development right now.`}
      </p>

      {worktrees.length === 0 ? (
        <p className="text-(--color-muted) italic">
          Current section:{' '}
          <span className="font-mono">{session?.currentSection}</span>
        </p>
      ) : (
        <ul className="space-y-4">
          {worktrees.map((w) => (
            <li key={w.sectionId}>
              <WorktreeCard worktree={w} nowIso={nowIso} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function WorktreeCard({
  worktree,
  nowIso,
}: {
  worktree: LiveWorktree;
  nowIso: string;
}) {
  const phase = isPhaseName(worktree.currentPhase) ? worktree.currentPhase : null;
  const startedRelative = worktree.startedAt
    ? formatRelativeTime(worktree.startedAt, nowIso)
    : '';
  const isOrphan = worktree.pid === null || worktree.pid === undefined;

  return (
    <article className="border border-bone p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-mono text-sm text-(--color-oxblood)">
          {worktree.sectionId}
        </h3>
        {isOrphan ? (
          <span className="text-xs px-2 py-0.5 border border-bone bg-bone text-(--color-muted) font-mono">
            orphan slot
          </span>
        ) : (
          <span className="text-xs text-(--color-muted) font-mono">
            pid {worktree.pid}
          </span>
        )}
      </header>

      {phase && (
        <p className="mt-2 text-sm">
          <span className="text-(--color-muted)">Phase:</span>{' '}
          <span className="text-(--color-ink)">{phaseLabel(phase)}</span>
        </p>
      )}

      {worktree.agentName && (
        <p className="mt-1 text-sm text-(--color-muted)">
          Agent: <span className="font-mono">{worktree.agentName}</span>
        </p>
      )}

      {startedRelative && (
        <p className="mt-1 text-xs text-(--color-muted)">
          Started {startedRelative}
        </p>
      )}

      {worktree.slotPath && (
        <p className="mt-1 text-xs text-(--color-muted) truncate font-mono">
          {worktree.slotPath}
        </p>
      )}

      <div className="mt-3">
        <PhaseStepper currentPhase={phase} size="sm" />
      </div>
    </article>
  );
}
