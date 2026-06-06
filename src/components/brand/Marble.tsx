import type { ComponentPropsWithoutRef, ElementType } from 'react';

type SurfaceEdge = 'none' | 'subtle' | 'strong';

type MarbleProps<E extends ElementType = 'div'> = {
  as?: E;
  edge?: SurfaceEdge;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'className'>;

const edgeClass: Record<SurfaceEdge, string> = {
  none: '',
  subtle: 'border border-(--edge-color-subtle)',
  strong: 'border border-(--edge-color)',
};

export function Marble<E extends ElementType = 'div'>({
  as,
  edge = 'none',
  className = '',
  ...rest
}: MarbleProps<E>) {
  const Tag: ElementType = as ?? 'div';
  const merged = [
    'bg-(--color-marble) text-(--pair-text-on-marble)',
    edgeClass[edge],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={merged} {...rest} />;
}
