import { EditorialCard } from '@/components/brand';
import { StatusBadge } from './StatusBadge';
import type { JobRollupEntry } from '@/content/schemas';

interface JobCardProps {
  rollup: JobRollupEntry;
  excerpt: string;
}

const IMPLEMENTATION_PLAN_SUFFIX = / — Implementation Plan$/i;

function formatFeatureCount(rollup: JobRollupEntry): string {
  const counts = `${rollup.completedFeatures} / ${rollup.totalFeatures} features`;
  return rollup.percentComplete !== null
    ? `${counts} · ${rollup.percentComplete}%`
    : counts;
}

export function JobCard({ rollup, excerpt }: JobCardProps) {
  const headline = rollup.title.replace(IMPLEMENTATION_PLAN_SUFFIX, '');
  const aliasHint = rollup.alias ? `(${rollup.alias})` : null;
  return (
    <EditorialCard
      tag="Build Log"
      headline={headline}
      subtitle={excerpt}
      footer={
        <>
          <StatusBadge status={rollup.status} />
          <span className="body-3 text-(--color-muted)">{formatFeatureCount(rollup)}</span>
          {aliasHint && (
            <span className="body-3 text-(--color-muted)">{aliasHint}</span>
          )}
        </>
      }
      href={`/build-log/jobs/${rollup.slug}`}
    />
  );
}
