import type { JobRollupEntry } from '@/content/schemas';

const LABELS: Record<JobRollupEntry['status'], string> = {
  planned: 'Planned',
  'in-progress': 'In progress',
  complete: 'Complete',
  unknown: 'No data',
};

const CLASSES: Record<JobRollupEntry['status'], string> = {
  planned: 'bg-mist text-foreground',
  'in-progress': 'bg-accent text-parchment',
  complete: 'bg-signal text-ink',
  unknown: 'bg-mist text-muted',
};

interface StatusBadgeProps {
  status: JobRollupEntry['status'];
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${CLASSES[status]}`}
      data-testid={`status-badge-${status}`}
    >
      {LABELS[status]}
    </span>
  );
}
