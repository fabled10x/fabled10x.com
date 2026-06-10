import Image from 'next/image';
import Link from 'next/link';
import { Logo } from '@/components/brand/Logo';

export function HeaderLogo() {
  return (
    <Link
      href="/"
      aria-label="Fabled 10X"
      className="
        inline-flex items-center gap-(--space-2)
        min-h-(--tap-min)
      "
    >
      <Image
        src="/media/pfp-circle-white.jpg"
        alt=""
        width={40}
        height={40}
        priority
        className="rounded-full"
      />
      <Logo size="sm" />
    </Link>
  );
}
