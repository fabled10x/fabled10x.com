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
    <nav aria-label="Phases" className="border border-mist rounded-lg p-4 mb-8">
      <h2 className="text-sm font-medium text-muted uppercase tracking-wide mb-3">
        Phases
      </h2>
      <ol className="flex flex-wrap gap-2">
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
                  'inline-block px-3 py-1.5 rounded text-sm border',
                  isActive
                    ? 'bg-accent text-parchment border-accent'
                    : 'border-mist text-foreground hover:border-accent',
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
