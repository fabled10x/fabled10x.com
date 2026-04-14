import Link from 'next/link';
import { Container } from './Container';
import { NavLink } from './NavLink';

const NAV_ITEMS = [
  { href: '/episodes', label: 'Episodes' },
  { href: '/cases', label: 'Cases' },
  { href: '/build-log', label: 'Build log' },
  { href: '/products', label: 'Products' },
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
                <NavLink href={item.href} label={item.label} />
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
