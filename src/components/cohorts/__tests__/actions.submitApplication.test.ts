import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockInsert,
  mockInsertValues,
  mockInsertReturning,
  mockSelect,
  mockSelectFrom,
  mockSelectWhere,
  mockSelectLimit,
} = vi.hoisted(() => {
  const mockInsertReturning = vi.fn();
  const mockInsertValues = vi.fn<(...args: unknown[]) => { returning: typeof mockInsertReturning }>(
    () => ({ returning: mockInsertReturning }),
  );
  const mockInsert = vi.fn<(...args: unknown[]) => { values: typeof mockInsertValues }>(
    () => ({ values: mockInsertValues }),
  );

  const mockSelectLimit = vi.fn();
  const mockSelectWhere = vi.fn<(...args: unknown[]) => { limit: typeof mockSelectLimit }>(
    () => ({ limit: mockSelectLimit }),
  );
  const mockSelectFrom = vi.fn<(...args: unknown[]) => { where: typeof mockSelectWhere }>(
    () => ({ where: mockSelectWhere }),
  );
  const mockSelect = vi.fn(() => ({ from: mockSelectFrom }));

  return {
    mockInsert,
    mockInsertValues,
    mockInsertReturning,
    mockSelect,
    mockSelectFrom,
    mockSelectWhere,
    mockSelectLimit,
  };
});

vi.mock('@/db/client', () => ({
  db: { insert: mockInsert, select: mockSelect },
  schema: {
    cohortApplications: {
      id: { name: 'id' },
      cohortSlug: { name: 'cohort_slug' },
      userId: { name: 'user_id' },
    },
    cohortWaitlist: {
      id: { name: 'id' },
      email: { name: 'email' },
      cohortSlug: { name: 'cohort_slug' },
    },
  },
}));

vi.mock('drizzle-orm', () => ({
  eq: (col: unknown, val: unknown) => ({ _op: 'eq', col, val }),
  and: (...args: unknown[]) => ({ _op: 'and', args }),
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));

const { mockGetCohortBySlug } = vi.hoisted(() => ({
  mockGetCohortBySlug: vi.fn(),
}));
vi.mock('@/lib/content/cohorts', () => ({
  getCohortBySlug: mockGetCohortBySlug,
}));

const { mockSendApplicationEmail } = vi.hoisted(() => ({
  mockSendApplicationEmail: vi.fn(),
}));
vi.mock('@/lib/email/cohort-application-received', () => ({
  sendCohortApplicationReceived: mockSendApplicationEmail,
}));

import {
  submitApplication,
  type ApplicationState,
} from '../actions';

const idle: ApplicationState = { status: 'idle' };

function fd(entries: Array<[string, string]>): FormData {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

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
    stripePriceId: 'price_REPLACE_ME_ai_delivery',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'ai-delivery-2026-q3',
  Component: () => null,
};

const VALID_FORM_ENTRIES: Array<[string, string]> = [
  ['cohortSlug', 'ai-delivery-2026-q3'],
  [
    'background',
    'I am a senior consultant with 8 years experience shipping AI-driven internal tooling for mid-market SaaS teams. I have worked with multiple model providers and want sharper delivery rhythms.',
  ],
  [
    'goals',
    'Ship a measurable production AI feature per week and graduate with a portfolio I can show prospective clients.',
  ],
  ['commitmentLevel', 'standard'],
  ['commitmentHours', '12'],
  ['timezone', 'America/New_York'],
  ['pillarInterest', 'delivery'],
  ['referralSource', 'Friend recommendation'],
];

const VALID_SESSION = {
  user: { id: 'user-1', email: 'applicant@example.com' },
};

describe('submitApplication server action', () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockInsertValues.mockClear();
    mockInsertReturning.mockReset();
    mockInsertReturning.mockResolvedValue([{ id: 'app-1' }]);
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockSelectWhere.mockClear();
    mockSelectLimit.mockReset();
    mockSelectLimit.mockResolvedValue([]); // no waitlist match by default
    mockAuth.mockReset();
    mockAuth.mockResolvedValue(VALID_SESSION);
    mockGetCohortBySlug.mockReset();
    mockGetCohortBySlug.mockResolvedValue(COHORT_FIXTURE);
    mockSendApplicationEmail.mockReset();
    mockSendApplicationEmail.mockResolvedValue(undefined);
  });

  // --- Unit / Permission: auth gate ---

  it('unit_submit_application_returns_form_error_when_no_session', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors._form).toMatch(/sign(ed)? in/i);
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('perm_anonymous_submit_application_returns_form_error', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
  });

  it('perm_authenticated_submit_application_succeeds', async () => {
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('success');
  });

  // --- Unit: validation errors ---

  it('unit_submit_application_returns_field_errors_on_zod_fail', async () => {
    const result = await submitApplication(
      idle,
      fd([
        ['cohortSlug', 'ai-delivery-2026-q3'],
        ['background', 'too short'],
        ['goals', 'too short'],
        ['commitmentLevel', 'standard'],
        ['commitmentHours', '10'],
        ['timezone', 'UTC'],
        ['pillarInterest', 'delivery'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors.background).toBeTruthy();
      expect(result.fieldErrors.goals).toBeTruthy();
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('unit_submit_application_returns_form_error_when_cohort_not_found', async () => {
    mockGetCohortBySlug.mockResolvedValueOnce(null);
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors._form).toMatch(/cohort|not found/i);
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('unit_submit_application_returns_form_error_when_cohort_not_open', async () => {
    mockGetCohortBySlug.mockResolvedValueOnce({
      ...COHORT_FIXTURE,
      meta: { ...COHORT_FIXTURE.meta, status: 'announced' as const },
    });
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors._form).toMatch(/not open|closed|announced|applications/i);
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // --- Unit: success path ---

  it('unit_submit_application_inserts_user_id_from_session', async () => {
    await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(mockInsert).toHaveBeenCalled();
    const valuesArg = mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(valuesArg.userId).toBe('user-1');
  });

  it('unit_submit_application_returns_application_id_on_success', async () => {
    mockInsertReturning.mockResolvedValueOnce([{ id: 'app-uuid-xyz' }]);
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.applicationId).toBe('app-uuid-xyz');
    }
  });

  it('unit_submit_application_links_waitlist_row_when_email_matches', async () => {
    mockSelectLimit.mockResolvedValueOnce([{ id: 'wl-99' }]);
    await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    const valuesArg = mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(valuesArg.waitlistId).toBe('wl-99');
  });

  it('unit_submit_application_passes_null_waitlist_id_when_no_match', async () => {
    mockSelectLimit.mockResolvedValueOnce([]);
    await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    const valuesArg = mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(valuesArg.waitlistId).toBeNull();
  });

  // --- Integration: email side-effect ---

  it('integration_submit_application_invokes_email_on_success', async () => {
    await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(mockSendApplicationEmail).toHaveBeenCalledTimes(1);
    const callArg = mockSendApplicationEmail.mock.calls[0][0];
    expect(callArg.to).toBe('applicant@example.com');
    expect(callArg.cohort).toBeDefined();
  });

  it('integration_submit_application_email_failure_does_not_block_success', async () => {
    mockSendApplicationEmail.mockRejectedValueOnce(new Error('Resend 503'));
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('success');
  });

  // --- Security: STRIDE Tampering ---

  it('sec_tampering_user_id_from_session_only', async () => {
    const malicious = fd([
      ...VALID_FORM_ENTRIES,
      ['userId', 'attacker-user'],
      ['session.user.id', 'attacker-user'],
    ]);
    await submitApplication(idle, malicious);
    const valuesArg = mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(valuesArg.userId).toBe('user-1');
  });

  it('sec_tampering_cohort_slug_rejected_when_not_found', async () => {
    mockGetCohortBySlug.mockResolvedValueOnce(null);
    const result = await submitApplication(
      idle,
      fd([
        ['cohortSlug', 'nonexistent-cohort'],
        ...VALID_FORM_ENTRIES.slice(1),
      ]),
    );
    expect(result.status).toBe('error');
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('sec_tampering_zod_rejects_oversized_background', async () => {
    const huge = 'A'.repeat(2001);
    const result = await submitApplication(
      idle,
      fd([
        ['cohortSlug', 'ai-delivery-2026-q3'],
        ['background', huge],
        ...VALID_FORM_ENTRIES.slice(2),
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors.background).toBeTruthy();
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('sec_tampering_zod_rejects_invalid_enums', async () => {
    const result = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 3),
        ['commitmentLevel', 'ADMIN'],
        ['commitmentHours', '12'],
        ['timezone', 'UTC'],
        ['pillarInterest', 'superuser'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      // Either commitmentLevel OR pillarInterest fieldErrors must be present
      expect(
        result.fieldErrors.commitmentLevel ||
          result.fieldErrors.pillarInterest,
      ).toBeTruthy();
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  // --- Security: STRIDE info_disclosure ---

  it('sec_information_disclosure_no_stack_trace_in_state', async () => {
    mockInsertReturning.mockRejectedValueOnce(
      new Error('PG23505 duplicate key value violates unique constraint'),
    );
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      const serialized = JSON.stringify(result.fieldErrors);
      expect(serialized).not.toContain('PG23505');
      expect(serialized).not.toContain('unique constraint');
    }
  });

  // --- Security: STRIDE DoS ---

  it('sec_dos_email_failure_does_not_throw_to_caller', async () => {
    mockSendApplicationEmail.mockRejectedValueOnce(new Error('Resend 503'));
    await expect(
      submitApplication(idle, fd(VALID_FORM_ENTRIES)),
    ).resolves.toMatchObject({ status: 'success' });
  });

  // --- Contract ---

  it('contract_submit_application_idle_shape', () => {
    expect(idle).toEqual({ status: 'idle' });
  });

  it('contract_submit_application_success_shape', async () => {
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(typeof result.applicationId).toBe('string');
      expect(result.applicationId.length).toBeGreaterThan(0);
    }
  });

  it('contract_submit_application_error_shape', async () => {
    mockAuth.mockResolvedValueOnce(null);
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(typeof result.fieldErrors).toBe('object');
      expect(result.fieldErrors).not.toBeNull();
    }
  });

  // --- Edge cases ---

  it('edge_input_referral_source_empty_string', async () => {
    const result = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 7),
        ['referralSource', ''],
      ]),
    );
    expect(result.status).toBe('success');
    const valuesArg = mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(valuesArg.referralSource).toBeNull();
  });

  it('edge_input_commitment_hours_boundary_1', async () => {
    const result = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 4),
        ['commitmentHours', '1'],
        ...VALID_FORM_ENTRIES.slice(5),
      ]),
    );
    expect(result.status).toBe('success');
  });

  it('edge_input_commitment_hours_boundary_80', async () => {
    const result80 = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 4),
        ['commitmentHours', '80'],
        ...VALID_FORM_ENTRIES.slice(5),
      ]),
    );
    expect(result80.status).toBe('success');

    mockAuth.mockResolvedValue(VALID_SESSION);
    mockGetCohortBySlug.mockResolvedValue(COHORT_FIXTURE);
    const result81 = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 4),
        ['commitmentHours', '81'],
        ...VALID_FORM_ENTRIES.slice(5),
      ]),
    );
    expect(result81.status).toBe('error');
  });

  it('edge_input_timezone_regex_rejects_spaces', async () => {
    const result = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 5),
        ['timezone', 'America New_York'],
        ...VALID_FORM_ENTRIES.slice(6),
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors.timezone).toBeTruthy();
    }
  });

  it('edge_state_double_submit_idempotent', async () => {
    const first = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(first.status).toBe('success');

    // Simulate Postgres unique-violation on second submit
    mockInsertReturning.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint'),
    );
    const second = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(second.status).toBe('error');
    if (second.status === 'error') {
      expect(second.fieldErrors._form).toMatch(/already/i);
    }
  });

  // --- Error recovery ---

  it('err_db_insert_unique_violation_returns_already_applied', async () => {
    mockInsertReturning.mockRejectedValueOnce(
      new Error('duplicate key value violates unique constraint'),
    );
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors._form).toMatch(/already/i);
    }
  });

  it('err_email_failure_swallowed', async () => {
    mockSendApplicationEmail.mockRejectedValueOnce(new Error('Resend 500'));
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    expect(result.status).toBe('success');
  });

  // --- Data integrity ---

  it('data_serialization_inserted_fields_match_zod_parse', async () => {
    await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    const valuesArg = mockInsertValues.mock.calls[0][0] as Record<string, unknown>;
    expect(valuesArg).toMatchObject({
      cohortSlug: 'ai-delivery-2026-q3',
      background: expect.any(String),
      goals: expect.any(String),
      commitmentLevel: 'standard',
      commitmentHours: 12,
      timezone: 'America/New_York',
      pillarInterest: 'delivery',
      userId: 'user-1',
    });
    expect(typeof valuesArg.referralSource).toMatch(/string|undefined/);
  });

  it('data_sensitivity_session_id_not_in_state', async () => {
    const result = await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    const serialized = JSON.stringify(result);
    expect(serialized).not.toContain('sessionToken');
    expect(serialized).not.toContain('authjs');
    expect(serialized).not.toContain('applicant@example.com');
  });

  it('data_consistency_waitlist_link_uses_email_not_user_id', async () => {
    await submitApplication(idle, fd(VALID_FORM_ENTRIES));
    // mockSelect chain was called for waitlist lookup
    expect(mockSelect).toHaveBeenCalled();
    // The where clause should reference email, NOT userId
    // (We capture the where() arg structure to verify it includes 'email')
    const whereArg = mockSelectWhere.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized).toContain('email');
  });

  it('data_precision_commitment_hours_coerced_to_integer', async () => {
    const result = await submitApplication(
      idle,
      fd([
        ...VALID_FORM_ENTRIES.slice(0, 4),
        ['commitmentHours', '40.5'],
        ...VALID_FORM_ENTRIES.slice(5),
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.fieldErrors.commitmentHours).toBeTruthy();
    }
  });

  // --- Infrastructure ---

  it('infra_actions_use_server_directive', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const filepath = resolve(
      process.cwd(),
      'src/components/cohorts/actions.ts',
    );
    const source = readFileSync(filepath, 'utf-8');
    expect(source).toMatch(/^['"]use server['"];?/);
  });
});
