import Link from 'next/link';
import type { Product } from '@/content/schemas';
import type { Purchase } from '@/db/schema';

interface PurchaseListProps {
  purchases: Purchase[];
  productsBySlug: Map<string, Product>;
}

function formatDate(iso: Date | string): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(cents / 100);
}

export function PurchaseList({
  purchases,
  productsBySlug,
}: PurchaseListProps) {
  if (purchases.length === 0) {
    return (
      <div className="rounded-md border border-mist p-6 text-sm text-muted">
        <p>You don&rsquo;t have any purchases yet.</p>
        <p className="mt-2">
          Browse the{' '}
          <Link href="/products" className="text-link underline-offset-2 hover:underline">
            storefront
          </Link>{' '}
          to find workflow templates, toolkits, and more.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-mist">
      {purchases.map((purchase) => {
        const product = productsBySlug.get(purchase.productSlug);
        return (
          <li key={purchase.id} className="flex items-center justify-between gap-4 py-4">
            <div>
              <p className="font-semibold">
                {product?.title ?? purchase.productSlug}
              </p>
              <p className="mt-1 text-sm text-muted">
                Purchased {formatDate(purchase.purchasedAt)} ·{' '}
                {formatPrice(purchase.amountCents, purchase.currency)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href={`/products/account/purchases/${purchase.id}`}
                className="text-sm text-link underline-offset-2 hover:underline"
              >
                Details
              </Link>
              <a
                href={`/api/products/downloads/${purchase.id}`}
                className="rounded-md bg-accent px-4 py-2 text-sm font-semibold text-parchment hover:bg-accent/90"
              >
                Download
              </a>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
