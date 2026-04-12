import Link from 'next/link';
import { Container } from './Container';

export function Footer() {
  return (
    <footer className="mt-24 border-t border-mist py-12">
      <Container className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="font-display text-lg font-semibold">
            fabled<span className="text-accent">10x</span>
          </p>
          <p className="mt-2 max-w-sm text-sm text-muted">
            One person. An agent team. Full SaaS delivery.
          </p>
        </div>
        <div className="max-w-sm text-sm text-muted">
          <p className="font-semibold text-foreground">Sister project</p>
          <p className="mt-1">
            The structured AI knowledge base built and championed by Fabled10X
            lives at{' '}
            <Link
              href="https://largelanguagelibrary.ai"
              className="text-link underline-offset-2 hover:underline"
            >
              largelanguagelibrary.ai
            </Link>
            .
          </p>
        </div>
      </Container>
    </footer>
  );
}
