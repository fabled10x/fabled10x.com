'use client';

import { useState, useTransition } from 'react';
import { createCheckoutSession } from '@/lib/stripe/checkout';
import { Button } from '@/components/brand/Button';

interface BuyButtonProps {
  productSlug: string;
  priceCents: number;
  currency: string;
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export function BuyButton({ productSlug, priceCents, currency }: BuyButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const idleLabel = `Buy — ${formatPrice(priceCents, currency)}`;

  return (
    <div>
      <Button
        type="button"
        size="lg"
        disabled={isPending}
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
        {isPending ? 'Preparing checkout…' : idleLabel}
      </Button>
      {error ? (
        <p className="mt-(--space-2) body-3 text-(--color-oxblood)" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
