import type { ReactNode } from 'react';

export type AccentGlyph = '?' | '.' | '!' | '→' | '✕' | '✓' | '—';

type AccentSize = 'inline' | 'large' | 'thumbnail';

interface DropAccentProps {
  glyph: AccentGlyph;
  size?: AccentSize;
  children?: ReactNode;
}

const sizeClass: Record<AccentSize, string> = {
  inline: 'text-[1.5em] leading-none',
  large: 'text-[1.8em] leading-none ml-[0.1em]',
  thumbnail: 'text-[2.2em] leading-none ml-[0.05em]',
};

export function DropAccent({ glyph, size = 'large', children }: DropAccentProps) {
  return (
    <>
      {children}
      <span
        aria-hidden="true"
        className={`text-(--color-oxblood) align-baseline font-display ${sizeClass[size]}`}
      >
        {glyph}
      </span>
    </>
  );
}
