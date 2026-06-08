import Link from 'next/link';
import type { JobPhase } from '@/content/schemas';

interface PhaseNavProps {
  jobSlug: string;
  phases: readonly JobPhase[];
  activePhaseSlug?: string;
}

export function PhaseNav({ jobSlug, phases, activePhaseSlug }: PhaseNavProps) {
  if (phases.length === 0) return null;
  return (
    <nav aria-label="Phases" className="mb-(--space-7)">
      <span className="label">Phases</span>
      <ol className="mt-(--space-3) inline-flex flex-wrap gap-(--space-3)">
        {phases.map((phase) => {
          const href = `/build-log/jobs/${jobSlug}/${phase.slug}`;
          const isActive = phase.slug === activePhaseSlug;
          const label =
            phase.header.title && phase.header.phaseNumber !== undefined
              ? `Phase ${phase.header.phaseNumber}: ${phase.header.title}`
              : phase.slug;
          return (
            <li key={phase.slug}>
              <Link
                href={href}
                aria-current={isActive ? 'page' : undefined}
                className={[
                  'inline-block px-(--space-3) py-(--space-1)',
                  isActive
                    ? 'text-(--color-ink) border-b-2 border-(--color-oxblood)'
                    : 'text-(--color-muted) hover:text-(--color-oxblood)',
                ].join(' ')}
              >
                {label}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
