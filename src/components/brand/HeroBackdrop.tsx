// Mask gradient — exempt from the brand's no-visual-gradient rule
// (defines a shape, not a color blend). Same exemption as BrushstrokeSeam.
// See src/__tests__/brand/forbidden-patterns.test.ts SKIP_PATHS.
const MASK = 'linear-gradient(to right, rgb(0 0 0) 0%, rgb(0 0 0 / 0.45) 50%, rgb(0 0 0 / 0.10) 100%)';

export function HeroBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 -z-10 pointer-events-none"
      style={{
        background: 'var(--color-marble)',
        maskImage: MASK,
        WebkitMaskImage: MASK,
      }}
    />
  );
}
