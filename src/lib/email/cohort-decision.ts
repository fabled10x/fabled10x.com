export interface SendCohortDecisionOptions {
  to: string;
  decision: 'accepted' | 'waitlisted' | 'declined';
  application: unknown;
  cohort: unknown;
  acceptedUntil: Date | null;
}

export async function sendCohortDecision(options: SendCohortDecisionOptions): Promise<void> {
  void options;
  return;
}
