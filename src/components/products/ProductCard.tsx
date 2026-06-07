import { EditorialCard } from '@/components/brand/EditorialCard';
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
    <EditorialCard
      tag={PRODUCT_CATEGORY_LABELS[product.category]}
      headline={product.title}
      subtitle={product.tagline}
      href={`/products/${product.slug}`}
      footer={
        <span className="mono text-(--color-ink) text-base">
          {formatPrice(product.priceCents, product.currency)}
        </span>
      }
    />
  );
}
