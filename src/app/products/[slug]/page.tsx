import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/site/Container';
import { BuyButton } from '@/components/products/BuyButton';
import { getAllProducts, getProductBySlug } from '@/lib/content/products';
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_LICENSE_LABELS,
} from '@/content/schemas';

export const dynamicParams = false;

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  const products = await getAllProducts();
  return products.map((entry) => ({ slug: entry.slug }));
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) return {};
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: 'website',
      images: meta.heroImageUrl ? [meta.heroImageUrl] : undefined,
    },
  };
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const entry = await getProductBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const { meta, Component } = entry;

  return (
    <Container as="article" className="py-16">
      <header className="max-w-2xl">
        <p className="text-sm uppercase tracking-wide text-muted">
          {PRODUCT_CATEGORY_LABELS[meta.category]}
        </p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight">
          {meta.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{meta.tagline}</p>
      </header>

      <div className="mt-12 flex items-center gap-6">
        <p className="font-display text-3xl font-semibold">
          {formatPrice(meta.priceCents, meta.currency)}
        </p>
        <p className="text-sm text-muted">
          {PRODUCT_LICENSE_LABELS[meta.licenseType]}
        </p>
      </div>

      <div className="mt-6">
        <BuyButton productSlug={meta.slug} />
      </div>

      <section className="mt-16 prose-style max-w-2xl">
        <Component />
      </section>
    </Container>
  );
}
