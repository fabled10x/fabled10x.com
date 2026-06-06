import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { Container } from '@/components/site/Container';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getAllCohorts } from '@/lib/content/cohorts';
import { CohortList } from '@/components/account/CohortList';

export const metadata: Metadata = {
  title: 'Your cohorts',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ enrolled?: string }>;
};

export default async function AccountCohortsPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=%2Fproducts%2Faccount%2Fcohorts');
    return;
  }

  const { enrolled } = await searchParams;

  const [applications, enrollments, cohorts] = await Promise.all([
    db
      .select()
      .from(schema.cohortApplications)
      .where(eq(schema.cohortApplications.userId, session.user.id))
      .orderBy(desc(schema.cohortApplications.submittedAt)),
    db
      .select()
      .from(schema.cohortEnrollments)
      .where(eq(schema.cohortEnrollments.userId, session.user.id))
      .orderBy(desc(schema.cohortEnrollments.paidAt)),
    getAllCohorts(),
  ]);

  const cohortsBySlug = new Map(cohorts.map((c) => [c.meta.slug, c.meta]));

  return (
    <Container as="section" className="py-16">
      <header>
        <p className="text-sm uppercase tracking-wide text-muted">Account</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
          Your cohorts
        </h1>
        <p className="mt-2 text-sm text-muted">
          <Link
            href="/products/account"
            className="text-link underline-offset-2 hover:underline"
          >
            ← Back to account overview
          </Link>
        </p>
      </header>

      {enrolled ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm"
        >
          Payment received. Welcome to{' '}
          <strong>{cohortsBySlug.get(enrolled)?.title ?? enrolled}</strong>.
          Logistics details will land in your inbox shortly.
        </div>
      ) : null}

      <div className="mt-12">
        <CohortList
          applications={applications}
          enrollments={enrollments}
          cohortsBySlug={cohortsBySlug}
        />
      </div>
    </Container>
  );
}
