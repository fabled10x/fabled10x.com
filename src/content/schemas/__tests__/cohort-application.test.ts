import { describe, expect, it } from 'vitest';
import {
  APPLICATION_COMMITMENT_LEVELS,
  APPLICATION_COMMITMENT_LEVEL_LABELS,
  type ApplicationCommitmentLevel,
  type CohortApplicationInput,
} from '@/content/schemas/cohort-application';
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

// ── ce-3.1: labels map + CohortApplicationInput interface ───────────

describe('cohort-application labels map (ce-3.1)', () => {
  it('unit_cohort_application_labels_map_shape: APPLICATION_COMMITMENT_LEVEL_LABELS has exactly the three keys with non-empty string values', () => {
    expect(typeof APPLICATION_COMMITMENT_LEVEL_LABELS).toBe('object');
    expect(APPLICATION_COMMITMENT_LEVEL_LABELS).not.toBeNull();

    const keys = Object.keys(APPLICATION_COMMITMENT_LEVEL_LABELS).sort();
    expect(keys).toEqual(['intense', 'light', 'standard']);

    for (const level of APPLICATION_COMMITMENT_LEVELS) {
      const label = APPLICATION_COMMITMENT_LEVEL_LABELS[level];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('unit_cohort_application_labels_barrel_export: APPLICATION_COMMITMENT_LEVEL_LABELS re-exported from src/content/schemas barrel', () => {
    expect(barrel).toHaveProperty('APPLICATION_COMMITMENT_LEVEL_LABELS');
    const barrelLabels = (
      barrel as Record<string, unknown>
    ).APPLICATION_COMMITMENT_LEVEL_LABELS as Record<string, string>;
    expect(barrelLabels).toEqual(APPLICATION_COMMITMENT_LEVEL_LABELS);
  });

  it('unit_cohort_application_input_type_export: CohortApplicationInput interface usable for typed object construction', () => {
    // Compile-time check: this object literal must be assignable to CohortApplicationInput.
    // If the interface is missing a field, has a wrong type, or doesn't exist, this fails to compile.
    const input: CohortApplicationInput = {
      cohortSlug: 'workflow-mastery-2026-q4',
      background:
        "I'm a senior engineer at a fintech startup with five years of full-stack experience. " +
        'I have shipped multiple production systems including an internal CRM and a data ' +
        'pipeline that processes a million records a day. I want to learn how AI agent teams ' +
        'change the shape of that work.',
      goals:
        'Ship one production-grade feature using an AI agent team during the cohort, and ' +
        'measure delivery throughput against my baseline.',
      commitmentLevel: 'standard',
      commitmentHours: 8,
      timezone: 'America/New_York',
      pillarInterest: 'workflow',
    };
    expect(input.cohortSlug).toBe('workflow-mastery-2026-q4');
    expect(input.commitmentLevel).toBe('standard');
    expect(input.referralSource).toBeUndefined();

    // Compile-time check that the union narrows correctly
    const level: ApplicationCommitmentLevel = 'intense';
    expect(APPLICATION_COMMITMENT_LEVELS).toContain(level);
  });

  it('infra_cohort_application_module_barrel_wired: ApplicationCommitmentLevel union type is consumable from barrel (compile-time)', () => {
    // Runtime equivalent: every barrel-exposed APPLICATION_COMMITMENT_LEVELS value
    // is a valid ApplicationCommitmentLevel. The type-narrowing happens at compile time.
    const barrelLevels = (
      barrel as Record<string, unknown>
    ).APPLICATION_COMMITMENT_LEVELS as readonly string[];
    for (const v of barrelLevels) {
      const narrowed = v as ApplicationCommitmentLevel;
      expect(APPLICATION_COMMITMENT_LEVELS).toContain(narrowed);
    }
  });
});
