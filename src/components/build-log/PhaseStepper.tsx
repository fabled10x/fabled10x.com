import { PHASE_ORDER, PHASE_LABELS, isPhaseName } from '@/lib/build-log/phase-labels';
import type { PhaseName } from '@/lib/build-log/phase-labels';

export interface PhaseStepperProps {
  /** Phase to highlight as currently-active. null/undefined → no current dot. */
  currentPhase?: PhaseName | string | null;
  /** Layout density. 'md' shows labels under each dot; 'sm' is dots-only. */
  size?: 'sm' | 'md';
  /** Optional aria-label override. Defaults to "Build phase: {label}". */
  ariaLabel?: string;
  className?: string;
}

export function PhaseStepper({
  currentPhase,
  size = 'md',
  ariaLabel,
  className = '',
}: PhaseStepperProps) {
  const current = isPhaseName(currentPhase) ? currentPhase : null;
  const currentIndex = current ? PHASE_ORDER.indexOf(current) : -1;
  const label =
    ariaLabel ??
    (current ? `Build phase: ${PHASE_LABELS[current]}` : 'Build phase legend');

  return (
    <ol
      role="group"
      aria-label={label}
      className={`flex items-center gap-2 ${className}`}
      data-size={size}
    >
      {PHASE_ORDER.map((name, i) => {
        const isCurrent = i === currentIndex;
        const isCompleted = currentIndex >= 0 && i < currentIndex;
        return (
          <li
            key={name}
            data-phase={name}
            data-current={isCurrent || undefined}
            data-completed={isCompleted || undefined}
            className="flex flex-col items-center gap-1 text-xs"
          >
            <span
              aria-hidden="true"
              className={[
                'block w-2.5 h-2.5 rounded-full border',
                isCurrent && 'bg-(--color-oxblood) border-(--color-oxblood)',
                isCompleted && 'bg-(--color-bone) border-(--color-ink)',
                !isCurrent && !isCompleted && 'bg-transparent border-(--color-bone)',
              ]
                .filter(Boolean)
                .join(' ')}
            />
            {size === 'md' && (
              <span className="font-mono text-(--color-muted) capitalize text-[10px]">
                {PHASE_LABELS[name]}
              </span>
            )}
          </li>
        );
      })}
    </ol>
  );
}
