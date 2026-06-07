import type { JobRollupEntry } from '@/content/schemas';

type Status = JobRollupEntry['status'];

const variantClass: Record<Status, string> = {
  planned: 'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle)',
  'in-progress': 'bg-(--color-parchment) text-(--color-ink) border-(--edge-color)',
  complete: 'bg-(--color-marble) text-(--color-verdigris) border-(--color-verdigris)',
  unknown: 'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle) italic',
};

const variantLabel: Record<Status, string> = {
  planned: 'Planned',
  'in-progress': 'In Progress',
  complete: 'Complete',
  unknown: 'Unknown',
};

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center gap-(--space-1) label border px-(--space-2) py-px',
        variantClass[status],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid={`status-badge-${status}`}
      aria-label={`Status: ${variantLabel[status]}`}
    >
      {status === 'complete' && (
        <span aria-hidden="true" className="text-(--color-verdigris)">
          ✓
        </span>
      )}
      {variantLabel[status]}
    </span>
  );
}
