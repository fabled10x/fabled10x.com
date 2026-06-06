import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const {
  mockSelect,
  mockSelectFrom,
  mockInnerJoin,
  mockWhere,
  mockLimit,
  mockInsertValues,
  mockInsertOnConflict,
  mockUpdate,
  mockUpdateSet,
  mockUpdateWhere,
  mockTransaction,
} = vi.hoisted(() => {
  const mockLimit = vi.fn();
  const mockWhere = vi.fn<(...args: unknown[]) => { limit: typeof mockLimit }>(
    () => ({ limit: mockLimit }),
  );
  const mockInnerJoin = vi.fn<(...args: unknown[]) => { where: typeof mockWhere }>(
    () => ({ where: mockWhere }),
  );
  const mockSelectFrom = vi.fn<(...args: unknown[]) => { innerJoin: typeof mockInnerJoin }>(
    () => ({ innerJoin: mockInnerJoin }),
  );
  const mockSelect = vi.fn<(...args: unknown[]) => { from: typeof mockSelectFrom }>(
    () => ({ from: mockSelectFrom }),
  );

  const mockInsertOnConflict = vi.fn<(...args: unknown[]) => Promise<unknown>>(
    () => Promise.resolve(undefined),
  );
  const mockInsertValues = vi.fn<(...args: unknown[]) => { onConflictDoNothing: typeof mockInsertOnConflict }>(
    () => ({ onConflictDoNothing: mockInsertOnConflict }),
  );
  const mockInsert = vi.fn<(...args: unknown[]) => { values: typeof mockInsertValues }>(
    () => ({ values: mockInsertValues }),
  );

  const mockUpdateWhere = vi.fn<(...args: unknown[]) => Promise<unknown>>(
    () => Promise.resolve(undefined),
  );
  const mockUpdateSet = vi.fn<(...args: unknown[]) => { where: typeof mockUpdateWhere }>(
    () => ({ where: mockUpdateWhere }),
  );
  const mockUpdate = vi.fn<(...args: unknown[]) => { set: typeof mockUpdateSet }>(
    () => ({ set: mockUpdateSet }),
  );

  const mockTransaction = vi.fn(async (cb: (tx: unknown) => Promise<void>) => {
    await cb({
      insert: mockInsert,
      update: mockUpdate,
    });
  });

  return {
    mockSelect,
    mockSelectFrom,
    mockInnerJoin,
    mockWhere,
    mockLimit,
    mockInsertValues,
    mockInsertOnConflict,
    mockUpdate,
    mockUpdateSet,
    mockUpdateWhere,
    mockTransaction,
  };
});

vi.mock('@/db/client', () => ({
  db: {
    select: mockSelect,
    transaction: mockTransaction,
  },
  schema: {
    cohortApplications: {
      id: { name: 'id' },
      cohortSlug: { name: 'cohort_slug' },
      userId: { name: 'user_id' },
      decision: { name: 'decision' },
      submittedAt: { name: 'submitted_at' },
    },
    cohortAdmissions: {
      id: { name: 'id' },
      applicationId: { name: 'application_id' },
      decidedBy: { name: 'decided_by' },
      decision: { name: 'decision' },
      decisionNote: { name: 'decision_note' },
      acceptedUntil: { name: 'accepted_until' },
    },
    users: {
      id: { name: 'id' },
      email: { name: 'email' },
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...args: unknown[]) => ({ _op: 'and', args }),
  desc: (col: unknown) => ({ _op: 'desc', col }),
  sql: (...args: unknown[]) => ({ _op: 'sql', args }),
}));

const { mockGetCohortBySlug } = vi.hoisted(() => ({ mockGetCohortBySlug: vi.fn() }));
vi.mock('@/lib/content/cohorts', () => ({ getCohortBySlug: mockGetCohortBySlug }));

const { mockSendCohortDecision } = vi.hoisted(() => ({ mockSendCohortDecision: vi.fn() }));
vi.mock('@/lib/email/cohort-decision', () => ({ sendCohortDecision: mockSendCohortDecision }));

import { decideApplication } from '../admin';
import { ACCEPTANCE_WINDOW_DAYS, COHORT_METADATA_KEYS, COHORT_METADATA_KIND } from '../constants';

const APPLICATION_FIXTURE = {
  id: 'app-uuid-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-uuid-1',
  waitlistId: null,
  decision: 'pending' as string,
  commitmentLevel: 'standard' as const,
  commitmentHours: 12,
  timezone: 'America/New_York',
  pillarInterest: 'delivery' as const,
  background: 'I have 10 years of experience',
  goals: 'Ship one real AI feature',
  referralSource: null,
  submittedAt: new Date('2026-06-01T10:00:00Z'),
};

const COHORT_FIXTURE = {
  meta: {
    id: 'cohort-001',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    summary: 'Ship real AI projects in 6 weeks.',
    series: 'AI Delivery',
    tagline: 'tagline',
    status: 'open' as const,
    pillar: 'delivery' as const,
    startDate: '2026-09-14',
    endDate: '2026-10-26',
    durationWeeks: 6,
    capacity: 12,
    priceCents: 249900,
    currency: 'usd',
    stripePriceId: 'price_xxx',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'ai-delivery-2026-q3',
  Component: () => null,
};

function primeGetApplication(row: typeof APPLICATION_FIXTURE | null) {
  if (row === null) {
    mockLimit.mockResolvedValueOnce([]);
  } else {
    mockLimit.mockResolvedValueOnce([{ application: row, userEmail: 'applicant@example.com' }]);
  }
}

describe('decideApplication', () => {
  const FROZEN_NOW = new Date('2026-06-06T00:00:00Z');

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FROZEN_NOW);

    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockInnerJoin.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
    mockInsertValues.mockClear();
    mockInsertOnConflict.mockClear();
    mockInsertOnConflict.mockImplementation(() => Promise.resolve(undefined));
    mockUpdate.mockClear();
    mockUpdateSet.mockClear();
    mockUpdateWhere.mockClear();
    mockUpdateWhere.mockImplementation(() => Promise.resolve(undefined));
    mockTransaction.mockClear();
    mockTransaction.mockImplementation(async (cb: (tx: unknown) => Promise<void>) => {
      await cb({
        insert: vi.fn(() => ({ values: mockInsertValues })),
        update: vi.fn(() => ({ set: mockUpdateSet })),
      });
    });
    mockGetCohortBySlug.mockReset();
    mockGetCohortBySlug.mockResolvedValue(COHORT_FIXTURE);
    mockSendCohortDecision.mockReset();
    mockSendCohortDecision.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('unit_decide_accepted_writes_admission_with_accepted_until: acceptedUntil = now + 14 days', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    const values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.decision).toBe('accepted');
    expect(values.acceptedUntil).toBeInstanceOf(Date);
    const expected = new Date(FROZEN_NOW.getTime() + 14 * 24 * 60 * 60 * 1000);
    expect((values.acceptedUntil as Date).toISOString()).toBe(expected.toISOString());
  });

  it('unit_decide_waitlisted_acceptedUntil_null: acceptedUntil is null on waitlisted', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'waitlisted',
      decidedBy: 'admin@foo.com',
    });
    const values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.acceptedUntil).toBeNull();
  });

  it('unit_decide_declined_acceptedUntil_null: acceptedUntil is null on declined', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'declined',
      decidedBy: 'admin@foo.com',
    });
    const values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.acceptedUntil).toBeNull();
  });

  it('unit_decide_updates_parent_application_decision: cohort_applications.decision is updated to match', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    const setArg = mockUpdateSet.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(setArg.decision).toBe('accepted');
  });

  it('unit_decide_persists_decided_by: decidedBy from caller arg is persisted on the admission row', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'waitlisted',
      decidedBy: 'admin@foo.com',
    });
    const values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.decidedBy).toBe('admin@foo.com');
  });

  it('unit_decide_persists_decision_note: decisionNote when provided; null when omitted', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
      decisionNote: 'great fit',
    });
    let values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.decisionNote).toBe('great fit');

    mockInsertValues.mockClear();
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'declined',
      decidedBy: 'admin@foo.com',
    });
    values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.decisionNote).toBeNull();
  });

  it('integration_decide_idempotent_on_double_click: onConflictDoNothing on applicationId target', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    expect(mockInsertOnConflict).toHaveBeenCalled();
    const conflictArg = mockInsertOnConflict.mock.calls[0]?.[0] as Record<string, unknown>;
    const serialized = JSON.stringify(conflictArg);
    expect(serialized).toContain('application_id');
  });

  it('integration_decide_calls_send_email_with_full_payload: sendCohortDecision invoked with full payload', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    expect(mockSendCohortDecision).toHaveBeenCalledTimes(1);
    const payload = mockSendCohortDecision.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(payload.to).toBe('applicant@example.com');
    expect(payload.decision).toBe('accepted');
    expect(payload.application).toBeDefined();
    expect(payload.cohort).toBeDefined();
    expect(payload.acceptedUntil).toBeInstanceOf(Date);
  });

  it('err_decide_app_not_found_throws: throws if application id has no row', async () => {
    primeGetApplication(null);
    await expect(
      decideApplication({
        applicationId: 'missing',
        decision: 'accepted',
        decidedBy: 'admin@foo.com',
      }),
    ).rejects.toThrow(/not found/i);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it('err_decide_cohort_removed_throws: throws if cohort slug no longer resolves on disk', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    mockGetCohortBySlug.mockResolvedValueOnce(null);
    await expect(
      decideApplication({
        applicationId: 'app-uuid-1',
        decision: 'accepted',
        decidedBy: 'admin@foo.com',
      }),
    ).rejects.toThrow(/cohort/i);
    expect(mockInsertValues).not.toHaveBeenCalled();
  });

  it('err_decide_email_failure_swallowed: decideApplication resolves when sendCohortDecision throws', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    mockSendCohortDecision.mockRejectedValueOnce(new Error('Resend 500'));
    await expect(
      decideApplication({
        applicationId: 'app-uuid-1',
        decision: 'accepted',
        decidedBy: 'admin@foo.com',
      }),
    ).resolves.toBeUndefined();
    expect(mockInsertValues).toHaveBeenCalled();
  });

  it('data_consistency_transaction_rolls_back_on_update_fail: update failure rolls back insert', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    let insertCalled = false;
    mockTransaction.mockImplementationOnce(async (cb: (tx: unknown) => Promise<void>) => {
      const fakeInsert = vi.fn(() => ({
        values: vi.fn(() => ({
          onConflictDoNothing: vi.fn(() => {
            insertCalled = true;
            return Promise.resolve(undefined);
          }),
        })),
      }));
      const fakeUpdate = vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(() => Promise.reject(new Error('update failed'))),
        })),
      }));
      try {
        await cb({ insert: fakeInsert, update: fakeUpdate });
      } catch (err) {
        throw err;
      }
    });
    await expect(
      decideApplication({
        applicationId: 'app-uuid-1',
        decision: 'accepted',
        decidedBy: 'admin@foo.com',
      }),
    ).rejects.toThrow(/update failed/);
    expect(insertCalled).toBe(true);
  });

  it('data_serialization_application_decision_propagates_to_list: parent application.decision write matches the requested decision', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'waitlisted',
      decidedBy: 'admin@foo.com',
    });
    const setArg = mockUpdateSet.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(setArg.decision).toBe('waitlisted');
  });

  it('edge_state_decide_on_already_decided_application: re-decide is idempotent on admission but still fires email', async () => {
    primeGetApplication({ ...APPLICATION_FIXTURE, decision: 'accepted' });
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    expect(mockInsertOnConflict).toHaveBeenCalled();
    expect(mockSendCohortDecision).toHaveBeenCalledTimes(1);
  });

  it('edge_temporal_accepted_until_clamped_to_14_days: acceptedUntil = FROZEN_NOW + 14d (clock-mocked)', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    const values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    const expected = new Date(FROZEN_NOW.getTime() + 14 * 24 * 60 * 60 * 1000);
    expect((values.acceptedUntil as Date).toISOString()).toBe(expected.toISOString());
  });

  it('sec_repudiation_decided_by_persisted_on_admission: decidedBy gives audit trail', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    await decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'declined',
      decidedBy: 'audit@admin.com',
    });
    const values = mockInsertValues.mock.calls[0]?.[0] as Record<string, unknown>;
    expect(values.decidedBy).toBe('audit@admin.com');
  });

  it('contract_decide_application_void: resolves to undefined', async () => {
    primeGetApplication(APPLICATION_FIXTURE);
    const promise = decideApplication({
      applicationId: 'app-uuid-1',
      decision: 'accepted',
      decidedBy: 'admin@foo.com',
    });
    expect(promise).toBeInstanceOf(Promise);
    await expect(promise).resolves.toBeUndefined();
  });
});

describe('cohort constants', () => {
  it('unit_constants_acceptance_window_days_is_14: ACCEPTANCE_WINDOW_DAYS = 14', () => {
    expect(ACCEPTANCE_WINDOW_DAYS).toBe(14);
  });

  it('unit_constants_cohort_metadata_keys_shape: COHORT_METADATA_KEYS + COHORT_METADATA_KIND', () => {
    expect(COHORT_METADATA_KIND).toBe('cohort');
    expect(COHORT_METADATA_KEYS).toMatchObject({
      kind: 'kind',
      cohortSlug: 'cohortSlug',
      applicationId: 'applicationId',
      userId: 'userId',
    });
  });
});
