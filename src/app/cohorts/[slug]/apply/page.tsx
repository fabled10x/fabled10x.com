import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq, and } from 'drizzle-orm';
import { Container } from '@/components/site/Container';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getAllCohorts, getCohortBySlug } from '@/lib/content/cohorts';
import { CohortDetailHero } from '@/components/cohorts/CohortDetailHero';
import { ApplicationForm } from '@/components/cohorts/ApplicationForm';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export const metadata: Metadata = {
  title: 'Apply',
  robots: { index: false, follow: false },
};

export async function generateStaticParams() {
  const all = await getAllCohorts();
  return all.map((entry) => ({ slug: entry.meta.slug }));
}

export default async function ApplyPage({ params }: RouteParams) {
  const { slug } = await params;
  const entry = await getCohortBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    redirect(
      `/login?callbackUrl=${encodeURIComponent(`/cohorts/${slug}/apply`)}`,
    );
    return;
  }

  if (entry.meta.status !== 'open') {
    return (
      <Container as="main" className="py-16">
        <CohortDetailHero cohort={entry.meta} />
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold">
            Your application
          </h2>
          <div className="mt-6 rounded-md border border-mist p-6 text-sm text-muted">
            <p>
              Applications for this cohort are not currently open.{' '}
              <Link
                href={`/cohorts/${slug}`}
                className="text-link underline-offset-2 hover:underline"
              >
                Back to cohort page
              </Link>
            </p>
          </div>
        </section>
      </Container>
    );
  }

  const [existing] = await db
    .select({ id: schema.cohortApplications.id })
    .from(schema.cohortApplications)
    .where(
      and(
        eq(schema.cohortApplications.cohortSlug, slug),
        eq(schema.cohortApplications.userId, session.user.id),
      ),
    )
    .limit(1);

  if (existing) {
    return (
      <Container as="main" className="py-16">
        <CohortDetailHero cohort={entry.meta} />
        <section className="mt-12 max-w-2xl">
          <h2 className="font-display text-2xl font-semibold">
            Your application
          </h2>
          <div className="mt-6 rounded-md border border-accent/40 bg-accent/5 p-6 text-sm">
            <p>
              You&apos;ve already applied to this cohort. You&apos;ll get a decision
              email once the review window closes.
            </p>
            <p className="mt-4">
              <Link
                href="/products/account/cohorts"
                className="text-link underline-offset-2 hover:underline"
              >
                Check your application status
              </Link>
            </p>
          </div>
        </section>
      </Container>
    );
  }

  return (
    <Container as="main" className="py-16">
      <CohortDetailHero cohort={entry.meta} />
      <section className="mt-16 max-w-2xl">
        <h2 className="font-display text-2xl font-semibold">
          Your application
        </h2>
        <p className="mt-3 text-sm text-muted">
          Signed in as{' '}
          <strong className="text-foreground">{session.user.email}</strong>.
          Applications are reviewed editorially, and everyone hears back within
          two weeks of the cohort&apos;s application close date.
        </p>
        <div className="mt-8">
          <ApplicationForm cohortSlug={slug} />
        </div>
      </section>
    </Container>
  );
}
