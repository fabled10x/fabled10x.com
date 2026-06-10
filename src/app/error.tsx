'use client';

import { useEffect } from 'react';
import { Marble, Section, DropAccent, Button } from '@/components/brand';
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
    <Marble>
      <Section rhythm="lg">
        <Container width="prose" className="text-center">
          <span className="label">Something broke</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="✕">We hit an unexpected error</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            Something on our side failed. Try again, or head back to the
            homepage.
          </p>
          <Button
            type="button"
            variant="ghost"
            onClick={unstable_retry}
            className="mt-(--space-6)"
          >
            Try again
          </Button>
        </Container>
      </Section>
    </Marble>
  );
}
