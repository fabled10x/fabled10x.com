import { describe, expect, it } from 'vitest';
import { APPLICATION_COMMITMENT_LEVELS } from '@/content/schemas/cohort-application';
import * as barrel from '@/content/schemas';

describe('cohort-application schema (forward-decl for ce-2.1)', () => {
  it('unit_cohort_application_tuple_shape: APPLICATION_COMMITMENT_LEVELS is a const tuple of ["light","standard","intense"]', () => {
    expect(Array.isArray(APPLICATION_COMMITMENT_LEVELS)).toBe(true);
    expect(APPLICATION_COMMITMENT_LEVELS).toEqual(['light', 'standard', 'intense']);
    // The tuple should be readonly (TS `as const`) — runtime check: every value is a string
    for (const v of APPLICATION_COMMITMENT_LEVELS) {
      expect(typeof v).toBe('string');
    }
  });

  it('unit_cohort_application_barrel_export: APPLICATION_COMMITMENT_LEVELS re-exported from src/content/schemas/index.ts', () => {
    expect(barrel).toHaveProperty('APPLICATION_COMMITMENT_LEVELS');
    expect((barrel as Record<string, unknown>).APPLICATION_COMMITMENT_LEVELS).toEqual([
      'light',
      'standard',
      'intense',
    ]);
  });
});
