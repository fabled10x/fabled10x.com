import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { getAllProducts } from '@/lib/content/products';
import { ProductCard } from '@/components/products/ProductCard';

export const metadata: Metadata = {
  title: 'Products',
  description:
    'Workflow templates, discovery toolkits, and the full Fabled10X playbook — the exact assets behind the channel.',
};

export default async function ProductsPage() {
  const products = await getAllProducts();

  return (
    <Container as="section" className="py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          Products
        </h1>
        <p className="mt-4 text-lg text-muted">
          Every asset the Fabled10X channel and case studies are built with —
          bundled, documented, and licensed for solo consultants and agencies.
        </p>
      </header>
      {products.length === 0 ? (
        <p className="mt-12 text-muted">
          No products yet — check back soon.
        </p>
      ) : (
        <ul className="mt-12 grid gap-6 md:grid-cols-2">
          {products.map((entry) => (
            <li key={entry.meta.id}>
              <Link href={`/products/${entry.slug}`} className="block">
                <ProductCard product={entry.meta} />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
