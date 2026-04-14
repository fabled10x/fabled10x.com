import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function AccountNotFound() {
  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">Account</p>
      <h1 className="mt-3 font-display text-3xl font-semibold">
        That purchase isn&rsquo;t in your account.
      </h1>
      <p className="mt-4 text-muted">
        It may belong to a different email address.
      </p>
      <Link
        href="/products/account"
        className="mt-8 inline-block rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Back to purchases
      </Link>
    </Container>
  );
}
