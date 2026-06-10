import type { Metadata } from 'next';
import { Marble, Section } from '@/components/brand';
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
    <Marble>
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">Account</span>
          <h1 className="display-2 mt-(--space-3)">Sign in to the library</h1>
          <p className="body-1 mt-(--space-4) text-(--color-muted)">
            We send a one-time link to your email — no password needed.
          </p>
          <div className="mt-(--space-7)">
            <SignInForm callbackUrl={callbackUrl ?? '/products/account'} />
          </div>
        </Container>
      </Section>
    </Marble>
  );
}
