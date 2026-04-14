import { getProductBySlug } from '@/lib/content/products';

export async function resolveStripePriceId(
  productSlug: string,
): Promise<{ priceId: string; amountCents: number; currency: string }> {
  const entry = await getProductBySlug(productSlug);
  if (!entry) {
    throw new Error(`No product found for slug: ${productSlug}`);
  }
  const { stripePriceId, priceCents, currency } = entry.meta;
  if (stripePriceId.includes('REPLACEME')) {
    throw new Error(
      `Product "${productSlug}" has a placeholder Stripe price ID. ` +
        `Set a real price_xxx in src/content/products/${productSlug}.mdx before shipping.`,
    );
  }
  return { priceId: stripePriceId, amountCents: priceCents, currency };
}
