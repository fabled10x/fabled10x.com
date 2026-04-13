import type { Product } from '@/content/schemas';
import { PRODUCT_CATEGORY_LABELS } from '@/content/schemas';

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group h-full rounded-lg border border-mist p-6 transition hover:border-accent">
      <p className="text-xs uppercase tracking-wide text-muted">
        {PRODUCT_CATEGORY_LABELS[product.category]}
      </p>
      <h2 className="mt-2 font-display text-xl font-semibold group-hover:text-accent">
        {product.title}
      </h2>
      <p className="mt-3 text-sm text-muted">{product.tagline}</p>
      <p className="mt-6 font-display text-2xl font-semibold">
        {formatPrice(product.priceCents, product.currency)}
      </p>
    </article>
  );
}
