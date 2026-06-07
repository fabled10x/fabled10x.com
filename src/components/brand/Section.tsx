import type { ComponentPropsWithoutRef, ElementType } from 'react';

type Rhythm = 'sm' | 'md' | 'lg';

type SectionProps<E extends ElementType = 'section'> = {
  as?: E;
  rhythm?: Rhythm;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'className'>;

const rhythmClass: Record<Rhythm, string> = {
  sm: 'py-(--section-y-sm)',
  md: 'py-(--section-y-md)',
  lg: 'py-(--section-y-lg)',
};

export function Section<E extends ElementType = 'section'>({
  as,
  rhythm = 'md',
  className = '',
  ...rest
}: SectionProps<E>) {
  const Tag: ElementType = as ?? 'section';
  const merged = [rhythmClass[rhythm], className].filter(Boolean).join(' ');
  return <Tag className={merged} {...rest} />;
}
