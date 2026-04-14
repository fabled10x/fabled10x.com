import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { getCohortBuckets } from '@/lib/content/cohorts';
import { CohortCard } from '@/components/cohorts/CohortCard';

export const metadata: Metadata = {
  title: 'Cohorts',
  description:
    'Join a Fabled10X cohort — intensive programs for solo consultants and small agencies running AI-driven delivery workflows.',
  openGraph: {
    title: 'Fabled10X Cohorts',
    description:
      'Intensive programs for solo consultants and small agencies running AI-driven delivery workflows.',
  },
};

export default async function CohortsIndexPage() {
  const { upcoming, archived } = await getCohortBuckets();

  return (
    <Container as="main" className="py-16">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted">Cohorts</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Learn in a cohort
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          Intensive, application-required programs that pair you with a peer
          cohort and an agent-led delivery workflow. Cohorts run quarterly on
          a rolling basis.
        </p>
      </header>

      <section className="mt-12" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="font-display text-2xl font-semibold">
          Upcoming
        </h2>
        {upcoming.length === 0 ? (
          <p className="mt-6 rounded-md border border-mist p-6 text-sm text-muted">
            No upcoming cohorts right now.{' '}
            <Link href="/#email-capture" className="text-link underline-offset-2 hover:underline">
              Join the newsletter
            </Link>{' '}
            to be notified when the next one opens.
          </p>
        ) : (
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {upcoming.map((entry) => (
              <li key={entry.meta.id}>
                <CohortCard cohort={entry.meta} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {archived.length > 0 ? (
        <section className="mt-20" aria-labelledby="archived-heading">
          <h2 id="archived-heading" className="font-display text-2xl font-semibold">
            Past cohorts
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2">
            {archived.map((entry) => (
              <li key={entry.meta.id}>
                <CohortCard cohort={entry.meta} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
