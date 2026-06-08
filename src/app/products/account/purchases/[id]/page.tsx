import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { auth } from '@/auth';
import { db, schema } from '@/db/client';
import { getProductBySlug } from '@/lib/content/products';
import { Bone, Section } from '@/components/brand';
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
    <Bone as="main">
      <Section rhythm="md">
        <Container as="article" width="prose">
          <span className="label">Receipt</span>
          <h1 className="display-2 mt-(--space-3)">{title}</h1>

          <dl className="mt-(--space-7) grid grid-cols-1 sm:grid-cols-2 gap-(--space-5) border-t border-b border-(--edge-color) py-(--space-5)">
            <div>
              <dt className="label">Order</dt>
              <dd className="mono mt-(--space-1)">{purchase.id}</dd>
            </div>
            <div>
              <dt className="label">Date</dt>
              <dd className="mono mt-(--space-1)">{formatDate(purchase.purchasedAt)}</dd>
            </div>
            <div>
              <dt className="label">Amount</dt>
              <dd className="mono mt-(--space-1)">{formatPrice(purchase.amountCents, purchase.currency)}</dd>
            </div>
            <div>
              <dt className="label">Stripe session</dt>
              <dd className="mono mt-(--space-1)">{purchase.stripeSessionId}</dd>
            </div>
          </dl>

          <div className="mt-(--space-7) flex items-center gap-(--space-4)">
            <a
              href={`/api/products/downloads/${purchase.id}`}
              className="inline-flex items-center gap-(--space-2) bg-(--color-oxblood) text-(--color-bone) px-(--space-4) py-(--space-3) border border-(--color-oxblood) hover:bg-(--color-ink) hover:border-(--color-ink) transition-colors"
            >
              Download
            </a>
            <Link
              href="/products/account"
              className="label hover:text-(--color-oxblood) underline underline-offset-2"
            >
              Back to account
            </Link>
          </div>
        </Container>
      </Section>
    </Bone>
  );
}
