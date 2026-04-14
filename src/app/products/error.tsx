'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function ProductsError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[products error]', error);
  }, [error]);

  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">
        We couldn&rsquo;t load the storefront.
      </h1>
      <p className="mt-4 text-muted">
        Try again in a moment, or head{' '}
        <Link href="/" className="text-link underline-offset-2 hover:underline">
          home
        </Link>
        .
      </p>
      <button
        type="button"
        onClick={unstable_retry}
        className="mt-8 rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Try again
      </button>
    </Container>
  );
}
