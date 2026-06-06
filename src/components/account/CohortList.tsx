import Link from 'next/link';
import type { Cohort } from '@/content/schemas';
import type {
  CohortApplicationRow,
  CohortEnrollmentRow,
} from '@/db/schema';

interface CohortListProps {
  applications: CohortApplicationRow[];
  enrollments: CohortEnrollmentRow[];
  cohortsBySlug: Map<string, Cohort>;
}

function formatDate(iso: Date | string): string {
  const date =
    typeof iso === 'string' ? new Date(`${iso}T00:00:00Z`) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function CohortList({
  applications,
  enrollments,
  cohortsBySlug,
}: CohortListProps) {
  const enrolledApplicationIds = new Set(
    enrollments.map((e) => e.applicationId),
  );

  const openApplications = applications.filter(
    (app) => !enrolledApplicationIds.has(app.id),
  );

  if (openApplications.length === 0 && enrollments.length === 0) {
    return (
      <div className="rounded-md border border-mist p-6 text-sm text-muted">
        <p>You haven&apos;t applied to a cohort yet.</p>
        <p className="mt-2">
          Browse{' '}
          <Link
            href="/cohorts"
            className="text-link underline-offset-2 hover:underline"
          >
            open cohorts
          </Link>{' '}
          to see which ones are accepting applications.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {enrollments.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Enrolled</h2>
          <ul className="mt-6 divide-y divide-mist">
            {enrollments.map((e) => {
              const cohort = cohortsBySlug.get(e.cohortSlug);
              return (
                <li key={e.id} className="py-4">
                  <p className="font-semibold">
                    {cohort?.title ?? e.cohortSlug}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Paid {formatDate(e.paidAt)} ·{' '}
                    {Math.round(e.amountCents / 100)}{' '}
                    {e.currency.toUpperCase()}
                  </p>
                  {cohort ? (
                    <p className="mt-1 text-xs text-muted">
                      Starts {formatDate(cohort.startDate)} ·{' '}
                      {cohort.durationWeeks} weeks
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {openApplications.length > 0 ? (
        <section>
          <h2 className="font-display text-xl font-semibold">Applications</h2>
          <ul className="mt-6 divide-y divide-mist">
            {openApplications.map((app) => {
              const cohort = cohortsBySlug.get(app.cohortSlug);
              return (
                <li key={app.id} className="py-4">
                  <p className="font-semibold">
                    {cohort?.title ?? app.cohortSlug}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Submitted {formatDate(app.submittedAt)} · Decision:{' '}
                    <strong>{app.decision}</strong>
                  </p>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
