import type { ReactNode } from 'react';

export type BrushstrokeDirection = 'left' | 'right' | 'top' | 'bottom';

interface BrushstrokeSeamProps {
  direction: BrushstrokeDirection;
  feather?: string;
  foreground?: string;
  background?: string;
  backgroundContent?: ReactNode;
  children?: ReactNode;
  className?: string;
}

const turbulenceSeed = 7;

const maskGradientByDirection: Record<BrushstrokeDirection, string> = {
  left: 'to right',
  right: 'to left',
  top: 'to bottom',
  bottom: 'to top',
};

export function BrushstrokeSeam({
  direction,
  feather = '8rem',
  foreground = 'var(--color-marble)',
  background = 'var(--color-shadow)',
  backgroundContent,
  children,
  className = '',
}: BrushstrokeSeamProps) {
  const maskId = `brushstroke-mask-${direction}`;
  const filterId = `brushstroke-feather-${direction}`;
  const maskGradient = maskGradientByDirection[direction];
  const maskImage = `url('#${maskId}'), linear-gradient(${maskGradient}, black ${feather}, transparent)`;

  const rootClassName = ['relative isolate', className].filter(Boolean).join(' ');

  return (
    <div className={rootClassName} style={{ background }}>
      {backgroundContent ? (
        <div className="absolute inset-0 motion-safe:opacity-100 motion-reduce:opacity-80">
          {backgroundContent}
        </div>
      ) : null}

      <div
        className="relative z-10"
        style={{
          background: foreground,
          maskImage,
          WebkitMaskImage: maskImage,
          maskComposite: 'source-over',
        }}
      >
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <filter id={filterId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.015 0.04"
                numOctaves="2"
                seed={turbulenceSeed}
              />
              <feDisplacementMap in="SourceGraphic" scale="20" />
            </filter>
            <mask id={maskId}>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="white"
                style={{ filter: `url(#${filterId})` }}
              />
            </mask>
          </defs>
        </svg>

        <div className="relative">{children}</div>
      </div>
    </div>
  );
}
