import Link from 'next/link';
import { Container } from '@/components/site/Container';

export default function NotFound() {
  return (
    <Container as="section" className="py-24 text-center">
      <p className="text-sm uppercase tracking-wide text-muted">404</p>
      <h1 className="mt-4 font-display text-3xl font-semibold">
        This page is not part of the story.
      </h1>
      <p className="mt-4 text-muted">
        The page you were looking for doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-md border border-mist px-4 py-2 text-sm hover:border-accent hover:text-accent"
      >
        Back to the homepage
      </Link>
    </Container>
  );
}
