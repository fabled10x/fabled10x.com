import type { CohortStatus } from '@/content/schemas';
import { COHORT_STATUS_LABELS } from '@/content/schemas';

const BASE =
  'inline-flex items-center gap-(--space-1) label border px-(--space-2) py-px';

const variantClass: Record<CohortStatus, string> = {
  announced:
    'bg-(--color-parchment) text-(--color-ink) border-(--edge-color)',
  open:
    'bg-(--color-marble) text-(--color-verdigris) border-(--color-verdigris)',
  closed:
    'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle)',
  enrolled:
    'bg-(--color-parchment) text-(--color-ink) border-(--edge-color)',
  shipped:
    'bg-(--color-bone) text-(--color-muted) border-(--edge-color-subtle) italic',
};

interface CohortStatusBadgeProps {
  status: CohortStatus;
}

export function CohortStatusBadge({ status }: CohortStatusBadgeProps) {
  return (
    <span
      className={`${BASE} ${variantClass[status]}`}
      aria-label={`Cohort status: ${COHORT_STATUS_LABELS[status]}`}
    >
      {COHORT_STATUS_LABELS[status]}
    </span>
  );
}
