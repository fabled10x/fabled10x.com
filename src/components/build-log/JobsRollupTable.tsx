import Link from 'next/link';
import type { JobRollupEntry } from '@/content/schemas';
import { Marble } from '@/components/brand';
import { StatusBadge } from './StatusBadge';

interface JobsRollupTableProps {
  rows: readonly JobRollupEntry[];
}

export function JobsRollupTable({ rows }: JobsRollupTableProps) {
  return (
    <Marble edge="strong" className="overflow-hidden">
      <table className="w-full text-(--color-ink)">
        <thead className="bg-(--color-bone)">
          <tr>
            <th className="label text-left px-(--space-4) py-(--space-3)">Job</th>
            <th className="label text-left px-(--space-4) py-(--space-3)">Status</th>
            <th className="label text-left px-(--space-4) py-(--space-3)">Progress</th>
            <th className="label text-right px-(--space-4) py-(--space-3)">Features</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.slug}
              className="border-t border-(--edge-color-subtle) hover:bg-(--color-parchment)"
            >
              <td className="px-(--space-4) py-(--space-3)">
                <Link
                  href={`/build-log/jobs/${row.slug}`}
                  className="text-(--color-ink) hover:text-(--color-oxblood)"
                >
                  {row.title}
                </Link>
                {row.alias && (
                  <span className="ml-(--space-2) font-mono text-(--color-muted)">
                    ({row.alias})
                  </span>
                )}
              </td>
              <td className="px-(--space-4) py-(--space-3)">
                <StatusBadge status={row.status} />
              </td>
              <td className="px-(--space-4) py-(--space-3)">
                {row.percentComplete === null ? (
                  <span className="text-(--color-muted)">—</span>
                ) : (
                  <div className="flex items-center gap-(--space-2)">
                    <div
                      className="h-2 bg-(--color-bone) overflow-hidden border border-(--edge-color-subtle)"
                      style={{ width: '120px' }}
                      role="progressbar"
                      aria-valuenow={row.percentComplete}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${row.title} ${row.percentComplete}% complete`}
                    >
                      <div
                        className="h-full bg-(--color-oxblood)"
                        style={{ width: `${row.percentComplete}%` }}
                      />
                    </div>
                    <span className="font-mono tabular-nums">
                      {row.percentComplete}%
                    </span>
                  </div>
                )}
              </td>
              <td className="px-(--space-4) py-(--space-3) text-right font-mono tabular-nums">
                {row.completedFeatures} / {row.totalFeatures}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Marble>
  );
}
