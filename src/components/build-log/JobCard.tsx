import Link from 'next/link';
import type { JobRollupEntry } from '@/content/schemas';
import { StatusBadge } from './StatusBadge';

interface JobCardProps {
  rollup: JobRollupEntry;
  excerpt: string;
}

export function JobCard({ rollup, excerpt }: JobCardProps) {
  const href = `/build-log/jobs/${rollup.slug}`;
  return (
    <article className="border border-mist rounded-lg p-6 hover:border-accent transition-colors">
      <header className="flex items-start justify-between gap-4 mb-3">
        <div>
          <h3 className="text-xl font-display">
            <Link href={href} className="text-foreground hover:text-accent">
              {rollup.title}
            </Link>
          </h3>
          {rollup.alias && (
            <p className="text-sm text-muted mt-1">
              Alias: <code className="text-accent">{rollup.alias}</code>
            </p>
          )}
        </div>
        <StatusBadge status={rollup.status} />
      </header>
      <p className="text-sm text-muted line-clamp-3">{excerpt}</p>
      <footer className="mt-4 flex items-center justify-between text-xs text-muted">
        <span>
          {rollup.completedFeatures} / {rollup.totalFeatures} features
          {rollup.percentComplete !== null && ` · ${rollup.percentComplete}%`}
        </span>
        <Link href={href} className="text-link hover:text-accent">
          View →
        </Link>
      </footer>
    </article>
  );
}
