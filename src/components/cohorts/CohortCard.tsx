import type { Cohort } from '@/content/schemas';
import { EditorialCard } from '@/components/brand';
import { CohortStatusBadge } from './CohortStatusBadge';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface CohortCardProps {
  cohort: Cohort;
}

export function CohortCard({ cohort }: CohortCardProps) {
  return (
    <EditorialCard
      tag={cohort.series}
      headline={cohort.title}
      subtitle={cohort.tagline}
      href={`/cohorts/${cohort.slug}`}
      footer={
        <div className="flex flex-wrap items-center gap-(--space-4) w-full">
          <CohortStatusBadge status={cohort.status} />
          <dl className="flex flex-wrap items-center gap-(--space-3) ml-auto">
            <div className="flex items-center gap-(--space-1)">
              <dt className="label">Starts</dt>
              <dd className="mono text-(--color-ink)">{formatDate(cohort.startDate)}</dd>
            </div>
            <div className="flex items-center gap-(--space-1)">
              <dt className="label">Seats</dt>
              <dd className="mono text-(--color-ink)">{cohort.capacity}</dd>
            </div>
            <div className="flex items-center gap-(--space-1)">
              <dt className="label">Price</dt>
              <dd className="mono text-(--color-ink)">{formatPrice(cohort.priceCents, cohort.currency)}</dd>
            </div>
          </dl>
        </div>
      }
    />
  );
}
