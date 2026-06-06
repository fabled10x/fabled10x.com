import type { ComponentPropsWithoutRef, ElementType } from 'react';

type SurfaceEdge = 'none' | 'subtle' | 'strong';

type BoneProps<E extends ElementType = 'div'> = {
  as?: E;
  edge?: SurfaceEdge;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'className'>;

const edgeClass: Record<SurfaceEdge, string> = {
  none: '',
  subtle: 'border border-(--edge-color-subtle)',
  strong: 'border border-(--edge-color)',
};

export function Bone<E extends ElementType = 'div'>({
  as,
  edge = 'none',
  className = '',
  ...rest
}: BoneProps<E>) {
  const Tag: ElementType = as ?? 'div';
  const merged = [
    'bg-(--color-bone) text-(--pair-text-on-bone)',
    edgeClass[edge],
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={merged} {...rest} />;
}
