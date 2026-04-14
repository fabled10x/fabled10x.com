'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/lib/stripe/checkout';

interface BuyButtonProps {
  productSlug: string;
}

export function BuyButton({ productSlug }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={isPending}
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
        onClick={() => {
          setError(null);
          startTransition(async () => {
            try {
              await createCheckoutSession(productSlug);
            } catch {
              setError(
                'Could not start checkout. Try again in a moment.',
              );
            }
          });
        }}
      >
        {isPending ? 'Preparing checkout\u2026' : 'Buy now'}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
