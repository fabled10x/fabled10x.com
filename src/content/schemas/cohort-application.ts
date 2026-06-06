import type { ContentPillar } from './content-pillar';

// APPLICATION_COMMITMENT_LEVELS is the single source of truth: Drizzle
// schema.ts reuses this tuple to build the cohort_applications.commitment_level
// CHECK constraint via sql.raw. Adding or removing values requires a new
// migration to update the constraint.
export const APPLICATION_COMMITMENT_LEVELS = ['light', 'standard', 'intense'] as const;

export type ApplicationCommitmentLevel = (typeof APPLICATION_COMMITMENT_LEVELS)[number];

export const APPLICATION_COMMITMENT_LEVEL_LABELS: Record<ApplicationCommitmentLevel, string> = {
  light: 'Light — exploring whether this is the right fit',
  standard: 'Standard — if accepted, I plan to attend every week',
  intense: 'Intense — this is my top priority for the duration',
};

// Raw shape submitted from <ApplicationForm> in ce-3.2. Not a content record —
// never lands on disk as MDX. Lives alongside content schemas for colocation
// with CohortSchema and because validators.ts imports from here.
export interface CohortApplicationInput {
  cohortSlug: string;
  background: string;
  goals: string;
  commitmentLevel: ApplicationCommitmentLevel;
  commitmentHours: number;
  timezone: string;
  pillarInterest: ContentPillar;
  referralSource?: string;
}
