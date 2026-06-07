'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

interface NavLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export function NavLink({ href, className = '', children }: NavLinkProps) {
  const pathname = usePathname();
  const active =
    pathname === href || pathname?.startsWith(`${href}/`) === true;
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`${className} transition-colors duration-150 ${
        active
          ? 'text-(--color-oxblood)'
          : 'text-(--pair-text-on-marble) hover:text-(--color-oxblood)'
      }`}
    >
      {children}
    </Link>
  );
}
