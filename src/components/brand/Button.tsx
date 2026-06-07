import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type Variant = 'primary' | 'ghost' | 'quiet';
type Size = 'sm' | 'md' | 'lg';

type ButtonProps<E extends ElementType = 'button'> = {
  as?: E;
  variant?: Variant;
  size?: Size;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<E>, 'as' | 'className' | 'children'>;

const variantClass: Record<Variant, string> = {
  primary:
    'bg-(--color-ink) text-(--color-marble) border border-(--color-ink) hover:bg-(--color-oxblood) hover:border-(--color-oxblood)',
  ghost:
    'bg-transparent text-(--color-ink) border border-(--color-ink) hover:bg-(--color-ink) hover:text-(--color-marble)',
  quiet:
    'bg-transparent text-(--color-ink) border border-(--edge-color-subtle) hover:border-(--color-ink)',
};

const sizeClass: Record<Size, string> = {
  sm: 'label py-(--space-1) px-(--space-3)',
  md: 'label py-(--space-2) px-(--space-4)',
  lg: 'label py-(--space-3) px-(--space-5) text-sm',
};

const BASE =
  'inline-flex items-center justify-center gap-(--space-2) ' +
  'transition-colors duration-150 cursor-pointer ' +
  'disabled:opacity-50 disabled:cursor-not-allowed ' +
  'focus-visible:outline focus-visible:outline-2 focus-visible:outline-(--color-oxblood) focus-visible:outline-offset-2';

export function Button<E extends ElementType = 'button'>({
  as,
  variant = 'primary',
  size = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps<E>) {
  const Tag: ElementType = as ?? 'button';
  const merged = [BASE, variantClass[variant], sizeClass[size], className]
    .filter(Boolean)
    .join(' ');
  return (
    <Tag className={merged} {...rest}>
      {children}
    </Tag>
  );
}
