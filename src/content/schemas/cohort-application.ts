// Forward-decl for ce-2.1. ce-3.1 will extend this file with
// CohortApplicationInputSchema (Zod) and the CohortApplication interface
// (background, goals, commitment hours, timezone, etc.). Adding or removing
// values from APPLICATION_COMMITMENT_LEVELS later requires a new Drizzle
// migration to update the CHECK constraint on cohort_applications.

export const APPLICATION_COMMITMENT_LEVELS = ['light', 'standard', 'intense'] as const;

export type ApplicationCommitmentLevel = (typeof APPLICATION_COMMITMENT_LEVELS)[number];
