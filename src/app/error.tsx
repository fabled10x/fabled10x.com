'use client';

import { useEffect } from 'react';
import { Container } from '@/components/site/Container';

export default function RootError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error('[root error boundary]', error);
  }, [error]);

  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">
        Something broke
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        We hit an unexpected error.
      </h1>
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
