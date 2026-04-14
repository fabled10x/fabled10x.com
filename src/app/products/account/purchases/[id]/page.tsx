import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getProductBySlug } from '@/lib/content/products';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'Purchase details',
  robots: { index: false, follow: false },
};

type PageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(iso: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(iso);
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export default async function PurchaseDetailPage({ params }: PageProps) {
  const { id } = await params;

  const session = await auth();
  if (!session?.user?.id) {
    return redirect(
      `/login?callbackUrl=${encodeURIComponent(`/products/account/purchases/${id}`)}`,
    );
  }

  const [purchase] = await db
    .select()
    .from(schema.purchases)
    .where(eq(schema.purchases.id, id))
    .limit(1);

  if (!purchase || purchase.userId !== session.user.id) {
    return notFound();
  }

  const entry = await getProductBySlug(purchase.productSlug);
  const title = entry?.meta.title ?? purchase.productSlug;

  return (
    <Container as="article" className="py-16">
      <p className="text-sm uppercase tracking-wide text-muted">Receipt</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">{title}</h1>

      <dl className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Amount</dt>
          <dd className="mt-1 font-display text-xl">
            {formatPrice(purchase.amountCents, purchase.currency)}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Purchased</dt>
          <dd className="mt-1">{formatDate(purchase.purchasedAt)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Order ID</dt>
          <dd className="mt-1 font-mono text-xs">{purchase.id}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Stripe session</dt>
          <dd className="mt-1 font-mono text-xs">{purchase.stripeSessionId}</dd>
        </div>
      </dl>

      <div className="mt-12 flex items-center gap-4">
        <a
          href={`/api/products/downloads/${purchase.id}`}
          className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
        >
          Download
        </a>
        <Link
          href="/products/account"
          className="text-sm text-link underline-offset-2 hover:underline"
        >
          Back to account
        </Link>
      </div>
    </Container>
  );
}
