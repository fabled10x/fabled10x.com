import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { SignInForm } from '@/components/auth/SignInForm';

export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

type PageProps = {
  searchParams: Promise<{ callbackUrl?: string }>;
};

export default async function LoginPage({ searchParams }: PageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <Container as="section" className="py-24">
      <div className="mx-auto max-w-md">
        <header>
          <p className="text-sm uppercase tracking-wide text-muted">Storefront</p>
          <h1 className="mt-3 font-display text-3xl font-semibold">Sign in</h1>
          <p className="mt-4 text-muted">
            Enter your email and we&rsquo;ll send you a one-time sign-in link.
            No password, no account setup.
          </p>
        </header>
        <div className="mt-10">
          <SignInForm callbackUrl={callbackUrl ?? '/products/account'} />
        </div>
      </div>
    </Container>
  );
}
