export const CASE_STATUSES = [
  'active',
  'shipped',
  'paused',
  'archived',
] as const;

export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_STATUS_LABELS: Record<CaseStatus, string> = {
  active: 'Active Engagement',
  shipped: 'Shipped & In Production',
  paused: 'Paused',
  archived: 'Archived',
};

export interface Case {
  id: string;
  slug: string;
  title: string;
  client: string;
  status: CaseStatus;
  summary: string;
  problem: string;
  marketResearch: string;
  discoveryProcess: string;
  technicalDecisions: string;
  deliverables: string[];
  outcome: string;
  startedAt?: string;
  shippedAt?: string;
  contractValue?: number;
  relatedEpisodeIds: string[];
  lllEntryUrls: string[];
  heroImageUrl?: string;
}
