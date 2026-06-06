import type { ComponentPropsWithoutRef, ElementType } from 'react';

type SurfaceEdge = 'none' | 'subtle' | 'strong';

type ParchmentProps<E extends ElementType = 'div'> = {
  as?: E;
  edge?: SurfaceEdge;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'className'>;

const edgeClass: Record<SurfaceEdge, string> = {
  none: '',
  subtle: 'border border-(--edge-color-subtle)',
  strong: 'border border-(--edge-color)',
};

export function Parchment<E extends ElementType = 'div'>({
  as,
  edge = 'none',
  className = '',
  ...rest
}: ParchmentProps<E>) {
  const Tag: ElementType = as ?? 'div';
  const merged = [
    'bg-(--color-parchment) text-(--pair-text-on-parchment)',
    edgeClass[edge],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={merged} {...rest} />;
}
