import Link from 'next/link';
import type { Cohort } from '@/content/schemas';
import { CohortStatusBadge } from './CohortStatusBadge';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
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

interface CohortCardProps {
  cohort: Cohort;
}

export function CohortCard({ cohort }: CohortCardProps) {
  return (
    <article className="flex h-full flex-col rounded-lg border border-mist bg-parchment/40 p-6 transition hover:border-accent/60">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs uppercase tracking-wide text-muted">{cohort.series}</p>
        <CohortStatusBadge status={cohort.status} />
      </div>
      <h3 className="mt-3 font-display text-xl font-semibold tracking-tight">
        <Link href={`/cohorts/${cohort.slug}`} className="hover:text-accent">
          {cohort.title}
        </Link>
      </h3>
      <p className="mt-3 text-sm text-muted">{cohort.tagline}</p>
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-muted">
        <div>
          <dt className="uppercase tracking-wide">Starts</dt>
          <dd className="mt-1 font-medium text-foreground">{formatDate(cohort.startDate)}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Duration</dt>
          <dd className="mt-1 font-medium text-foreground">{cohort.durationWeeks} weeks</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Seats</dt>
          <dd className="mt-1 font-medium text-foreground">{cohort.capacity}</dd>
        </div>
        <div>
          <dt className="uppercase tracking-wide">Price</dt>
          <dd className="mt-1 font-medium text-foreground">{formatPrice(cohort.priceCents, cohort.currency)}</dd>
        </div>
      </dl>
    </article>
  );
}
