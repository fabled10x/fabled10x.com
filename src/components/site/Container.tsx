import type { ComponentPropsWithoutRef, ElementType } from 'react';

type ContainerWidth = 'prose' | 'layout' | 'wide';

type ContainerProps<E extends ElementType = 'div'> = {
  as?: E;
  width?: ContainerWidth;
  className?: string;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'className'>;

const widthClass: Record<ContainerWidth, string> = {
  prose: 'max-w-prose',
  layout: 'max-w-5xl',
  wide: 'max-w-7xl',
};

export function Container<E extends ElementType = 'div'>({
  as,
  width = 'layout',
  className = '',
  ...rest
}: ContainerProps<E>) {
  const Tag: ElementType = as ?? 'div';
  const merged = [
    'mx-auto w-full',
    widthClass[width],
    'px-(--space-5) md:px-(--space-7)',
    className,
  ]
    .filter(Boolean)
    .join(' ');
  return <Tag className={merged} {...rest} />;
}
