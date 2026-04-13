'use client';

import { useState, useTransition } from 'react';

interface BuyButtonProps {
  productSlug: string;
}

export function BuyButton({ productSlug }: BuyButtonProps) {
  const [, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const isLive = false;

  if (!isLive) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        className="rounded-md border border-mist bg-mist/30 px-6 py-3 text-sm font-semibold text-muted"
      >
        Coming soon
      </button>
    );
  }

  return (
    <div>
      <button
        type="button"
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
        onClick={() => {
          startTransition(async () => {
            setError(null);
            void productSlug;
          });
        }}
      >
        Buy now
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
