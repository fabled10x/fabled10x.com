import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { listApplications } from '@/lib/cohorts/admin';
import { getAllCohorts } from '@/lib/content/cohorts';

export const metadata: Metadata = {
  title: 'Cohort applications',
  robots: { index: false, follow: false },
};

type RouteParams = {
  searchParams: Promise<{ cohort?: string; decision?: string }>;
};

const DECISION_FILTERS = ['pending', 'accepted', 'waitlisted', 'declined'] as const;
type DecisionFilter = (typeof DECISION_FILTERS)[number];

function isDecisionFilter(value: string | undefined): value is DecisionFilter {
  return (
    value !== undefined &&
    (DECISION_FILTERS as readonly string[]).includes(value)
  );
}

export default async function AdminApplicationsPage({ searchParams }: RouteParams) {
  const { cohort, decision } = await searchParams;
  const cohorts = await getAllCohorts();
  const decisionFilter: DecisionFilter = isDecisionFilter(decision) ? decision : 'pending';

  const applications = await listApplications({
    cohortSlug: cohort,
    decision: decisionFilter,
  });

  return (
    <Container as="main" className="py-10">
      <h1 className="font-display text-3xl font-semibold">Applications</h1>
      <p className="mt-2 text-sm text-muted">
        Review and decide on cohort applications.
      </p>

      <form className="mt-8 flex flex-wrap gap-3 text-sm" method="get">
        <label className="flex items-center gap-2">
          Cohort
          <select
            name="cohort"
            defaultValue={cohort ?? ''}
            className="rounded-md border border-mist bg-parchment px-3 py-2"
          >
            <option value="">All</option>
            {cohorts.map((entry) => (
              <option key={entry.meta.slug} value={entry.meta.slug}>
                {entry.meta.title}
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2">
          Decision
          <select
            name="decision"
            defaultValue={decisionFilter}
            className="rounded-md border border-mist bg-parchment px-3 py-2"
          >
            {DECISION_FILTERS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </label>
        <button
          type="submit"
          className="rounded-md border border-mist bg-parchment px-4 py-2 text-sm font-semibold hover:border-accent"
        >
          Filter
        </button>
      </form>

      <section className="mt-10">
        {applications.length === 0 ? (
          <p className="rounded-md border border-mist p-6 text-sm text-muted">
            No applications match the current filter.
          </p>
        ) : (
          <ul className="divide-y divide-mist">
            {applications.map((app) => (
              <li key={app.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-semibold">{app.userEmail}</p>
                    <p className="mt-1 text-xs text-muted">
                      {app.cohortSlug} · {app.commitmentLevel} · {app.commitmentHours}h/wk · {app.timezone} · {app.pillarInterest}
                    </p>
                    <p className="mt-2 line-clamp-2 text-sm text-muted">
                      {app.goals}
                    </p>
                  </div>
                  <Link
                    href={`/admin/cohorts/applications/${app.id}`}
                    className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-semibold text-parchment hover:bg-accent/90"
                  >
                    Review
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
