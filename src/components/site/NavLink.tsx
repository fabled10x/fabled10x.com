'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export interface NavLinkProps {
  href: string;
  label: string;
  activePrefix?: string;
}

export function NavLink({ href, label, activePrefix }: NavLinkProps) {
  const pathname = usePathname();
  const prefix = activePrefix ?? href;
  const isActive = pathname?.startsWith(prefix) ?? false;
  const base = 'text-sm text-muted hover:text-foreground';
  const active = 'text-accent';
  return (
    <Link
      href={href}
      className={isActive ? `${base} ${active}` : base}
      aria-current={isActive ? 'page' : undefined}
    >
      {label}
    </Link>
  );
}
