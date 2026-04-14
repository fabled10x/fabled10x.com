import type { Cohort } from '@/content/schemas';
import { COHORT_STATUS_DESCRIPTIONS } from '@/content/schemas';
import { CohortStatusBadge } from './CohortStatusBadge';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(`${iso}T00:00:00Z`));
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

interface CohortDetailHeroProps {
  cohort: Cohort;
}

export function CohortDetailHero({ cohort }: CohortDetailHeroProps) {
  return (
    <header className="border-b border-mist pb-12">
      <div className="flex items-center gap-4">
        <p className="text-sm uppercase tracking-wide text-muted">{cohort.series}</p>
        <CohortStatusBadge status={cohort.status} />
      </div>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight md:text-5xl">
        {cohort.title}
      </h1>
      <p className="mt-5 max-w-3xl text-lg text-muted">{cohort.tagline}</p>
      <p className="mt-4 max-w-3xl text-sm text-muted">
        {COHORT_STATUS_DESCRIPTIONS[cohort.status]}
      </p>
      <dl className="mt-10 grid max-w-3xl grid-cols-2 gap-6 md:grid-cols-4">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Starts</dt>
          <dd className="mt-1 font-semibold">{formatDate(cohort.startDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Ends</dt>
          <dd className="mt-1 font-semibold">{formatDate(cohort.endDate)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Duration</dt>
          <dd className="mt-1 font-semibold">
            {cohort.durationWeeks} weeks · {cohort.commitmentHoursPerWeek}h/wk
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Tuition</dt>
          <dd className="mt-1 font-semibold">
            {formatPrice(cohort.priceCents, cohort.currency)}
          </dd>
        </div>
      </dl>
    </header>
  );
}
