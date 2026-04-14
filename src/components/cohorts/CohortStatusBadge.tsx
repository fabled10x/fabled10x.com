import type { CohortStatus } from '@/content/schemas';
import { COHORT_STATUS_LABELS } from '@/content/schemas';

const STATUS_STYLES: Record<CohortStatus, string> = {
  announced: 'bg-signal/10 text-signal ring-signal/20',
  open: 'bg-accent/10 text-accent ring-accent/30',
  closed: 'bg-muted/10 text-muted ring-muted/30',
  enrolled: 'bg-steel/10 text-steel ring-steel/30',
  shipped: 'bg-ink/5 text-ink ring-ink/20',
};

interface CohortStatusBadgeProps {
  status: CohortStatus;
}

export function CohortStatusBadge({ status }: CohortStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[status]}`}
    >
      {COHORT_STATUS_LABELS[status]}
    </span>
  );
}
