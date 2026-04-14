'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function AccountError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[account error]', error);
  }, [error]);

  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Account</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">
        We couldn&rsquo;t load your account.
      </h1>
      <p className="mt-4 text-muted">
        This is on us. Try again, or head back to the{' '}
        <Link href="/products" className="text-link underline-offset-2 hover:underline">
          storefront
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
