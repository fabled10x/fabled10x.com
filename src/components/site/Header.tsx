import Link from 'next/link';
import { Container } from './Container';

const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/about', label: 'About' },
] as const;

export function Header() {
  return (
    <header className="border-b border-mist">
      <Container className="flex h-16 items-center justify-between">
        <Link
          href="/"
          className="font-display text-xl font-semibold tracking-tight"
        >
          fabled<span className="text-accent">10x</span>
        </Link>
        <nav aria-label="Primary">
          <ul className="flex gap-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
