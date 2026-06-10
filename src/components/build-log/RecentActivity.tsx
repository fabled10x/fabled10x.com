import { toEntry } from '@/lib/build-log/normalize';
import { formatRelativeTime } from '@/lib/build-log/relative-time';
import { MarkdownDocument } from './MarkdownDocument';
import type {
  SessionStatus,
  JobRollupEntry,
  CompletedSectionEntry,
} from '@/content/schemas';

const TOP_N_EXPANDED = 5;
const COMPACT_TAIL_CAP = 25;
const NOTES_PREVIEW_CHARS = 1000;

export interface RecentActivityProps {
  entries: SessionStatus['completedSections'];
  rollup: readonly JobRollupEntry[];
  nowIso: string;
  /** GitHub org/repo for commit links. Optional — falls back to plain text. */
  githubRepoUrl?: string;
}

export function RecentActivity({
  entries,
  rollup,
  nowIso,
  githubRepoUrl,
}: RecentActivityProps) {
  if (!entries.length) {
    return (
      <section className="mb-10" aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-2xl font-display mb-4">
          Recent activity
        </h2>
        <p className="text-(--color-muted) italic">
          No sections shipped yet — pipeline is still warming up.
        </p>
      </section>
    );
  }

  const normalized = entries.map(toEntry).reverse();
  const top = normalized.slice(0, TOP_N_EXPANDED);
  const middle = normalized.slice(TOP_N_EXPANDED, COMPACT_TAIL_CAP);
  const older = normalized.slice(COMPACT_TAIL_CAP);

  return (
    <section className="mb-10" aria-labelledby="recent-heading">
      <h2 id="recent-heading" className="text-2xl font-display mb-4">
        Recent activity
      </h2>

      <ul className="space-y-4 mb-6">
        {top.map((entry, i) => (
          <li key={`top-${i}`}>
            <ActivityCard
              entry={entry}
              rollup={rollup}
              nowIso={nowIso}
              githubRepoUrl={githubRepoUrl}
            />
          </li>
        ))}
      </ul>

      {middle.length > 0 && (
        <ul className="space-y-1 text-sm font-mono mb-4 text-(--color-muted)">
          {middle.map((entry, i) => (
            <li key={`mid-${i}`}>
              <CompactRow entry={entry} nowIso={nowIso} />
            </li>
          ))}
        </ul>
      )}

      {older.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-link hover:text-(--color-oxblood)">
            Show {older.length} older
          </summary>
          <ul className="mt-2 space-y-1 font-mono text-(--color-muted)">
            {older.map((entry, i) => (
              <li key={`old-${i}`}>
                <CompactRow entry={entry} nowIso={nowIso} />
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}

interface ActivityCardProps {
  entry: CompletedSectionEntry;
  rollup: readonly JobRollupEntry[];
  nowIso: string;
  githubRepoUrl?: string;
}

function ActivityCard({ entry, rollup, nowIso, githubRepoUrl }: ActivityCardProps) {
  if (entry.kind === 'minimal') {
    return (
      <article className="border border-bone p-4">
        <p className="font-mono text-sm">{entry.id}</p>
        <p className="text-xs text-(--color-muted) mt-1">
          Shipped earlier (no detail recorded).
        </p>
      </article>
    );
  }

  const jobName = resolveJobName(entry.id, rollup);
  const relative = entry.completedAt
    ? formatRelativeTime(entry.completedAt, nowIso)
    : '';
  const commitLink =
    entry.commitHash && githubRepoUrl
      ? `${githubRepoUrl}/commit/${entry.commitHash}`
      : null;

  return (
    <article className="border border-bone p-4">
      <header className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="font-mono text-sm text-(--color-oxblood)">
          {entry.id}
          {jobName && (
            <span className="ml-2 text-(--color-muted) font-sans">
              from {jobName}
            </span>
          )}
        </h3>
        <span className="text-xs text-(--color-muted) tabular-nums">
          {relative}
          {entry.completedAt && relative && (
            <span className="ml-2 font-mono">{entry.completedAt.slice(0, 10)}</span>
          )}
        </span>
      </header>

      <dl className="grid grid-cols-3 gap-2 mt-3 text-xs">
        <Stat label="Tests" value={entry.tests} />
        <Stat label="New files" value={entry.filesNew} />
        <Stat label="Files changed" value={entry.filesModified} />
      </dl>

      {entry.commitHash && (
        <p className="mt-2 text-xs font-mono">
          Commit:{' '}
          {commitLink ? (
            <a href={commitLink} className="text-link hover:text-(--color-oxblood)">
              {entry.commitHash.slice(0, 7)}
            </a>
          ) : (
            <span>{entry.commitHash.slice(0, 7)}</span>
          )}
        </p>
      )}

      {entry.notes && (
        <details className="mt-3 text-sm">
          <summary className="cursor-pointer text-link hover:text-(--color-oxblood)">
            Notes ({Math.round(entry.notes.length / 1000)}KB) —{' '}
            <span className="text-(--color-muted) font-normal">
              {entry.notes.slice(0, NOTES_PREVIEW_CHARS).replace(/\s+/g, ' ')}
              {entry.notes.length > NOTES_PREVIEW_CHARS && '…'}
            </span>
          </summary>
          <div className="mt-2 build-log-prose">
            <MarkdownDocument body={entry.notes} />
          </div>
        </details>
      )}
    </article>
  );
}

function CompactRow({
  entry,
  nowIso,
}: {
  entry: CompletedSectionEntry;
  nowIso: string;
}) {
  if (entry.kind === 'minimal') {
    return <span>{entry.id}</span>;
  }
  const relative = entry.completedAt
    ? formatRelativeTime(entry.completedAt, nowIso)
    : '';
  return (
    <span>
      {entry.id}
      {relative && <span className="ml-2">· {relative}</span>}
      {entry.commitHash && (
        <span className="ml-2">· {entry.commitHash.slice(0, 7)}</span>
      )}
    </span>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div>
      <dt className="text-(--color-muted) uppercase tracking-wide">{label}</dt>
      <dd className="font-mono tabular-nums mt-0.5">
        {typeof value === 'number' ? value : '—'}
      </dd>
    </div>
  );
}

function resolveJobName(
  sectionId: string,
  rollup: readonly JobRollupEntry[],
): string | null {
  const match = rollup.find((r) => sectionId.startsWith(`${r.slug}-`));
  return match ? match.title : null;
}
