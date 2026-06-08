import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getAllProducts } from '@/lib/content/products';
import { getAllCohorts } from '@/lib/content/cohorts';
import { Bone, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { PurchaseList } from '@/components/account/PurchaseList';
import { CohortList } from '@/components/account/CohortList';
import { SignOutButton } from '@/components/account/SignOutButton';

export const metadata: Metadata = {
  title: 'Your account',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ purchased?: string; canceled?: string }>;
};

export default async function AccountPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    return redirect('/login?callbackUrl=%2Fproducts%2Faccount');
  }

  const { purchased, canceled } = await searchParams;

  const [
    purchases,
    products,
    cohortApplications,
    cohortEnrollments,
    cohorts,
  ] = await Promise.all([
    db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.userId, session.user.id))
      .orderBy(desc(schema.purchases.purchasedAt)),
    getAllProducts(),
    db
      .select()
      .from(schema.cohortApplications)
      .where(eq(schema.cohortApplications.userId, session.user.id)),
    db
      .select()
      .from(schema.cohortEnrollments)
      .where(eq(schema.cohortEnrollments.userId, session.user.id)),
    getAllCohorts(),
  ]);

  const productsBySlug = new Map(products.map((p) => [p.slug, p.meta]));
  const cohortsBySlug = new Map(cohorts.map((c) => [c.meta.slug, c.meta]));
  const hasCohortActivity =
    cohortApplications.length > 0 || cohortEnrollments.length > 0;

  return (
    <Bone as="main">
      <Section rhythm="md">
        <Container>
          <header className="flex items-start justify-between gap-(--space-4)">
            <div>
              <span className="label">Your Account</span>
              <h1 className="display-2 mt-(--space-3)">{session.user.email}</h1>
            </div>
            <SignOutButton />
          </header>

          {purchased ? (
            <Bone
              edge="subtle"
              role="status"
              className="mt-(--space-6) p-(--space-4) body-2"
            >
              Thanks! Your purchase of{' '}
              <strong>{productsBySlug.get(purchased)?.title ?? purchased}</strong>{' '}
              is confirmed. It will appear below in a moment.
            </Bone>
          ) : null}

          {canceled ? (
            <Bone
              edge="subtle"
              role="status"
              className="mt-(--space-6) p-(--space-4) body-2 text-(--color-muted)"
            >
              Checkout canceled. Nothing was charged.
            </Bone>
          ) : null}

          {hasCohortActivity ? (
            <div className="mt-(--space-7)">
              <div className="flex items-center justify-between">
                <h2 className="display-3">My cohorts</h2>
                <Link
                  href="/products/account/cohorts"
                  className="label hover:text-(--color-oxblood) underline underline-offset-2"
                >
                  View all
                </Link>
              </div>
              <div className="mt-(--space-5)">
                <CohortList
                  applications={cohortApplications}
                  enrollments={cohortEnrollments}
                  cohortsBySlug={cohortsBySlug}
                />
              </div>
            </div>
          ) : null}

          <div className="mt-(--space-7)">
            <h2 className="display-3">Purchases</h2>
            <div className="mt-(--space-5)">
              <PurchaseList purchases={purchases} productsBySlug={productsBySlug} />
            </div>
          </div>
        </Container>
      </Section>
    </Bone>
  );
}
