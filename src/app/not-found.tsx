import Link from 'next/link';
import { Marble, Section, DropAccent } from '@/components/brand';
import { Container } from '@/components/site/Container';

export default function NotFound() {
  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose" className="text-center">
          <span className="label">404</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="✕">No entry by that name</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            The page you asked for isn&apos;t in the library.
          </p>
          <Link
            href="/"
            className="label text-(--color-oxblood) mt-(--space-6) inline-block border-b border-(--color-oxblood) pb-(--space-1)"
          >
            Return home →
          </Link>
        </Container>
      </Section>
    </Marble>
  );
}
