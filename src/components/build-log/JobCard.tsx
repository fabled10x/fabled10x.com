import { EditorialCard } from '@/components/brand';
import { StatusBadge } from './StatusBadge';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import type { JobRollupEntry } from '@/content/schemas';

interface JobCardProps {
  rollup: JobRollupEntry;
  excerpt: string;
  /** Count of currently-live worktrees under this job. > 0 shows the live-dot. */
  liveWorktreeCount?: number;
  /** ISO timestamp of this job's most-recently-completed section. */
  lastActivityIso?: string | null;
  /** "Now" ISO threaded from the page render; required when lastActivityIso is set. */
  nowIso?: string;
}

const IMPLEMENTATION_PLAN_SUFFIX = / — Implementation Plan$/i;

function formatFeatureCount(rollup: JobRollupEntry): string {
  const counts = `${rollup.completedFeatures} / ${rollup.totalFeatures} features`;
  return rollup.percentComplete !== null
    ? `${counts} · ${rollup.percentComplete}%`
    : counts;
}

export function JobCard({
  rollup,
  excerpt,
  liveWorktreeCount = 0,
  lastActivityIso = null,
  nowIso = '',
}: JobCardProps) {
  const headline = rollup.title.replace(IMPLEMENTATION_PLAN_SUFFIX, '');
  const aliasHint = rollup.alias ? `(${rollup.alias})` : null;
  const isLive = liveWorktreeCount > 0;
  const lastActivity = formatRelativeTime(lastActivityIso, nowIso);
  const percent = rollup.percentComplete ?? 0;

  return (
    <EditorialCard
      tag="Build Log"
      headline={headline}
      subtitle={excerpt}
      footer={
        <div className="flex w-full flex-col gap-(--space-2)">
          <div className="flex items-center gap-(--space-3)">
            {isLive && (
              <span
                className="inline-block w-1.5 h-1.5 bg-(--color-oxblood)"
                aria-hidden="true"
                data-testid="live-dot"
              />
            )}
            {isLive && <span className="sr-only">Active</span>}
            <StatusBadge status={rollup.status} />
            <span className="body-3 text-(--color-muted)">{formatFeatureCount(rollup)}</span>
            {aliasHint && (
              <span className="body-3 text-(--color-muted)">{aliasHint}</span>
            )}
          </div>
          {rollup.percentComplete !== null && (
            <div
              className="h-1 w-full bg-(--color-bone) overflow-hidden"
              role="progressbar"
              aria-valuenow={percent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${rollup.completedFeatures} of ${rollup.totalFeatures} features complete`}
            >
              <div className="h-full bg-(--color-ink)" style={{ width: `${percent}%` }} />
            </div>
          )}
          {lastActivity && (
            <p className="body-3 text-(--color-muted)" data-testid="last-activity">
              Last shipped {lastActivity}
            </p>
          )}
        </div>
      }
      href={`/build-log/jobs/${rollup.slug}`}
    />
  );
}
