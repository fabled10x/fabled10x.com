import { describe, it, expect } from 'vitest';

import * as mod from '../cohort-decision';

describe('cohort-decision email module (ce-4.1 stub)', () => {
  it('integration_email_stub_module_exports_send_function: sendCohortDecision is exported as a function', () => {
    expect(typeof mod.sendCohortDecision).toBe('function');
  });

  it('infra_cohort_decision_stub_file_exists: sendCohortDecision returns a Promise that resolves (no-op stub)', async () => {
    const result = mod.sendCohortDecision({
      to: 'applicant@example.com',
      decision: 'accepted',
      application: {} as unknown as Record<string, unknown>,
      cohort: {} as unknown as Record<string, unknown>,
      acceptedUntil: null,
    });
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeUndefined();
  });
});
