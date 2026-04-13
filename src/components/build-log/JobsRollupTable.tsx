import Link from 'next/link';
import type { JobRollupEntry } from '@/content/schemas';
import { StatusBadge } from './StatusBadge';

interface JobsRollupTableProps {
  rows: readonly JobRollupEntry[];
}

export function JobsRollupTable({ rows }: JobsRollupTableProps) {
  return (
    <table className="w-full text-sm border border-mist rounded-lg overflow-hidden">
      <thead>
        <tr className="bg-mist">
          <th className="text-left px-4 py-2 font-medium">Job</th>
          <th className="text-left px-4 py-2 font-medium">Status</th>
          <th className="text-left px-4 py-2 font-medium">Progress</th>
          <th className="text-right px-4 py-2 font-medium">Features</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.slug} className="border-t border-mist">
            <td className="px-4 py-3">
              <Link
                href={`/build-log/jobs/${row.slug}`}
                className="text-link hover:text-accent"
              >
                {row.title}
              </Link>
              {row.alias && (
                <span className="ml-2 text-xs text-muted">({row.alias})</span>
              )}
            </td>
            <td className="px-4 py-3">
              <StatusBadge status={row.status} />
            </td>
            <td className="px-4 py-3">
              {row.percentComplete === null ? (
                <span className="text-muted">—</span>
              ) : (
                <div className="flex items-center gap-2">
                  <div
                    className="h-2 bg-mist rounded overflow-hidden"
                    style={{ width: '120px' }}
                    role="progressbar"
                    aria-valuenow={row.percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${row.title} ${row.percentComplete}% complete`}
                  >
                    <div
                      className="h-full bg-accent"
                      style={{ width: `${row.percentComplete}%` }}
                    />
                  </div>
                  <span className="text-xs tabular-nums">
                    {row.percentComplete}%
                  </span>
                </div>
              )}
            </td>
            <td className="px-4 py-3 text-right tabular-nums">
              {row.completedFeatures} / {row.totalFeatures}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
