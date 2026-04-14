import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Container as="section" className="py-24">
      <div className="mx-auto max-w-md text-center">
        <p className="text-sm uppercase tracking-wide text-muted">Check your email</p>
        <h1 className="mt-3 font-display text-3xl font-semibold">
          Sign-in link sent.
        </h1>
        <p className="mt-6 text-muted">
          We just sent you a one-time sign-in link. Click it from the same
          browser to continue to your account.
        </p>
        <p className="mt-4 text-sm text-muted">
          The link expires in 24 hours. If you don&rsquo;t see it, check spam.
        </p>
      </div>
    </Container>
  );
}
