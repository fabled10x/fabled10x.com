import type { ContentPillar } from './content-pillar';

export const COHORT_STATUSES = [
  'announced',
  'open',
  'closed',
  'enrolled',
  'shipped',
] as const;

export type CohortStatus = (typeof COHORT_STATUSES)[number];

export const COHORT_STATUS_LABELS: Record<CohortStatus, string> = {
  announced: 'Announced',
  open: 'Applications open',
  closed: 'Applications closed',
  enrolled: 'Cohort full',
  shipped: 'Shipped',
};

export const COHORT_STATUS_DESCRIPTIONS: Record<CohortStatus, string> = {
  announced:
    'Applications open soon. Join the waitlist to be notified when they do.',
  open: 'Applications open now. Review the syllabus and apply below.',
  closed:
    'Applications are closed. Decisions go out within two weeks of the deadline.',
  enrolled:
    'This cohort is full. Future cohorts will open for applications later — join the waitlist to be notified.',
  shipped:
    'This cohort has shipped. Read the outcomes below and watch for future cohorts.',
};

export interface Cohort {
  id: string;
  slug: string;
  title: string;
  series: string;
  tagline: string;
  summary: string;
  status: CohortStatus;
  pillar: ContentPillar;
  startDate: string;
  endDate: string;
  durationWeeks: number;
  capacity: number;
  priceCents: number;
  currency: string;
  stripePriceId: string;
  commitmentHoursPerWeek: number;
  lllEntryUrls: string[];
  relatedEpisodeIds: string[];
  relatedCaseIds: string[];
  publishedAt: string;
}
