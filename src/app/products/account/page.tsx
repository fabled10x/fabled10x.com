import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { desc, eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getAllProducts } from '@/lib/content/products';
import { Container } from '@/components/site/Container';
import { PurchaseList } from '@/components/account/PurchaseList';
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

  const [purchases, products] = await Promise.all([
    db
      .select()
      .from(schema.purchases)
      .where(eq(schema.purchases.userId, session.user.id))
      .orderBy(desc(schema.purchases.purchasedAt)),
    getAllProducts(),
  ]);

  const productsBySlug = new Map(products.map((p) => [p.slug, p.meta]));

  return (
    <Container as="section" className="py-16">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight">
            Your account
          </h1>
          <p className="mt-2 text-sm text-muted">
            Signed in as {session.user.email}
          </p>
        </div>
        <SignOutButton />
      </header>

      {purchased ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-accent/40 bg-accent/5 px-4 py-3 text-sm"
        >
          Thanks! Your purchase of{' '}
          <strong>{productsBySlug.get(purchased)?.title ?? purchased}</strong>{' '}
          is confirmed. It will appear below in a moment.
        </div>
      ) : null}

      {canceled ? (
        <div
          role="status"
          className="mt-8 rounded-md border border-mist bg-mist/30 px-4 py-3 text-sm text-muted"
        >
          Checkout canceled. Nothing was charged.
        </div>
      ) : null}

      <div className="mt-12">
        <h2 className="font-display text-xl font-semibold">Purchases</h2>
        <div className="mt-6">
          <PurchaseList purchases={purchases} productsBySlug={productsBySlug} />
        </div>
      </div>
    </Container>
  );
}
