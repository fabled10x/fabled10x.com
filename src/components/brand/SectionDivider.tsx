import { BrushstrokeSeam } from './BrushstrokeSeam';

interface SectionDividerProps {
  top?: string;
  bottom?: string;
}

export function SectionDivider({
  top = 'var(--color-marble)',
  bottom = 'var(--color-parchment)',
}: SectionDividerProps) {
  return (
    <div className="h-(--space-7)" aria-hidden="true">
      <BrushstrokeSeam
        direction="bottom"
        feather="3rem"
        foreground={top}
        background={bottom}
      />
    </div>
  );
}
