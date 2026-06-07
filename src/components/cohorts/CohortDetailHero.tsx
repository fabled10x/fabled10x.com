import type { Cohort } from '@/content/schemas';
import { COHORT_STATUS_DESCRIPTIONS } from '@/content/schemas';
import { Marble, Section, DropAccent } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { CohortStatusBadge } from './CohortStatusBadge';

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`));
}

interface CohortDetailHeroProps {
  cohort: Cohort;
}

export function CohortDetailHero({ cohort }: CohortDetailHeroProps) {
  return (
    <Marble as="header">
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">{cohort.series}</span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="→" size="large">
              {cohort.title}
            </DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            {cohort.tagline}
          </p>
          <p className="body-3 mt-(--space-3) text-(--color-muted)">
            {COHORT_STATUS_DESCRIPTIONS[cohort.status]}
          </p>
          <div className="mt-(--space-6) flex flex-wrap items-center gap-(--space-4) border-t border-(--edge-color) pt-(--space-4)">
            <CohortStatusBadge status={cohort.status} />
            <span className="mono">{formatDate(cohort.startDate)}</span>
            <span className="mono" aria-hidden="true">·</span>
            <span className="mono">
              {cohort.durationWeeks} weeks · {cohort.commitmentHoursPerWeek}h/wk
            </span>
          </div>
        </Container>
      </Section>
    </Marble>
  );
}
