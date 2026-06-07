import Link from 'next/link';
import type { ReactNode } from 'react';
import { DropAccent, type AccentGlyph } from './DropAccent';

interface EditorialCardProps {
  tag?: string;
  headline: string;
  accent?: AccentGlyph;
  subtitle?: string;
  footer?: ReactNode;
  href?: string;
  className?: string;
}

const BASE_ARTICLE =
  'bg-(--color-marble) text-(--pair-text-on-marble) ' +
  'border border-(--color-ink) ' +
  'p-(--space-5) ' +
  'flex flex-col gap-(--space-3) ' +
  'transition-colors duration-150';

const HOVER_LINK = 'hover:bg-(--color-bone) cursor-pointer';

const LINK_BASE =
  'block ' +
  'focus-visible:outline focus-visible:outline-2 ' +
  'focus-visible:outline-(--color-oxblood) focus-visible:outline-offset-2';

export function EditorialCard({
  tag,
  headline,
  accent,
  subtitle,
  footer,
  href,
  className = '',
}: EditorialCardProps) {
  const articleClass = [BASE_ARTICLE, href ? HOVER_LINK : '', className]
    .filter(Boolean)
    .join(' ');

  const inner = (
    <article className={articleClass}>
      {tag && <span className="label">{tag}</span>}
      <h3 className="display-3">
        {accent ? (
          <DropAccent glyph={accent} size="inline">
            {headline}
          </DropAccent>
        ) : (
          headline
        )}
      </h3>
      {subtitle && <p className="body-2 text-(--color-muted)">{subtitle}</p>}
      {footer && (
        <div className="mt-(--space-2) flex items-center gap-(--space-3)">{footer}</div>
      )}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className={LINK_BASE}>
        {inner}
      </Link>
    );
  }
  return inner;
}
