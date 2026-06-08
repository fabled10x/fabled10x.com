import Link from 'next/link';
import { Bone } from '@/components/brand';
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
      <Bone edge="subtle" className="p-(--space-5)">
        <p className="body-2 text-(--color-muted)">
          You don&rsquo;t have any purchases yet.
        </p>
        <p className="body-2 text-(--color-muted) mt-(--space-2)">
          Browse the{' '}
          <Link
            href="/products"
            className="underline underline-offset-2 hover:text-(--color-oxblood)"
          >
            storefront
          </Link>{' '}
          to find workflow templates, toolkits, and more.
        </p>
      </Bone>
    );
  }

  return (
    <ul>
      {purchases.map((purchase) => {
        const product = productsBySlug.get(purchase.productSlug);
        return (
          <li
            key={purchase.id}
            className="border-t border-(--edge-color) py-(--space-4) flex items-center justify-between gap-(--space-4)"
          >
            <div>
              <span className="body-2 text-(--color-ink)">
                {product?.title ?? purchase.productSlug}
              </span>
              <p className="body-3 text-(--color-muted) mt-(--space-1)">
                Purchased {formatDate(purchase.purchasedAt)} ·{' '}
                <span className="mono">
                  {formatPrice(purchase.amountCents, purchase.currency)}
                </span>
              </p>
            </div>
            <div className="flex items-center gap-(--space-3)">
              <Link
                href={`/products/account/purchases/${purchase.id}`}
                className="label hover:text-(--color-oxblood) underline-offset-2"
              >
                Details
              </Link>
              <a
                href={`/api/products/downloads/${purchase.id}`}
                className="inline-flex items-center gap-(--space-2) bg-(--color-oxblood) text-(--color-bone) px-(--space-3) py-(--space-2) border border-(--color-oxblood) hover:bg-(--color-ink) hover:border-(--color-ink) transition-colors"
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
