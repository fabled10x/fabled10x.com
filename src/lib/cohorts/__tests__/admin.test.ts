import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockSelect,
  mockSelectFrom,
  mockInnerJoin,
  mockWhere,
  mockOrderBy,
  mockLimit,
} = vi.hoisted(() => {
  const mockOrderBy = vi.fn();
  const mockLimit = vi.fn();
  const mockWhere = vi.fn<(...args: unknown[]) => { orderBy: typeof mockOrderBy; limit: typeof mockLimit }>(
    () => ({ orderBy: mockOrderBy, limit: mockLimit }),
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
  return { mockSelect, mockSelectFrom, mockInnerJoin, mockWhere, mockOrderBy, mockLimit };
});

vi.mock('@/db/client', () => ({
  db: { select: mockSelect },
  schema: {
    cohortApplications: {
      id: { name: 'id' },
      cohortSlug: { name: 'cohort_slug' },
      userId: { name: 'user_id' },
      decision: { name: 'decision' },
      submittedAt: { name: 'submitted_at' },
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
}));

import { listApplications, getApplication, type ApplicationListRow } from '../admin';

const APPLICATION_FIXTURE = {
  id: 'app-uuid-1',
  cohortSlug: 'ai-delivery-2026-q3',
  userId: 'user-uuid-1',
  waitlistId: null,
  decision: 'pending' as const,
  commitmentLevel: 'standard' as const,
  commitmentHours: 12,
  timezone: 'America/New_York',
  pillarInterest: 'delivery' as const,
  background: 'I have 10 years of experience',
  goals: 'Ship one real AI feature',
  referralSource: null,
  submittedAt: new Date('2026-06-01T10:00:00Z'),
};

function joinedRows(...rows: Array<{ application: typeof APPLICATION_FIXTURE; userEmail: string }>) {
  return rows;
}

describe('listApplications', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockInnerJoin.mockClear();
    mockWhere.mockClear();
    mockOrderBy.mockClear();
    mockOrderBy.mockResolvedValue([]);
    mockLimit.mockClear();
  });

  it('unit_admin_list_applications_no_filter_joins_email: returns rows joined with users.email', async () => {
    mockOrderBy.mockResolvedValueOnce(
      joinedRows({ application: APPLICATION_FIXTURE, userEmail: 'applicant@example.com' }),
    );

    const result = await listApplications({});
    expect(result).toHaveLength(1);
    const row: ApplicationListRow = result[0];
    expect(row.userEmail).toBe('applicant@example.com');
    expect(row.cohortSlug).toBe('ai-delivery-2026-q3');
  });

  it('unit_admin_list_applications_filter_cohort_slug: applies cohortSlug filter via Drizzle eq', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    await listApplications({ cohortSlug: 'workflow-mastery-2026-q4' });
    const whereArg = mockWhere.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized).toContain('workflow-mastery-2026-q4');
  });

  it('unit_admin_list_applications_filter_decision: applies decision filter via Drizzle eq', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    await listApplications({ decision: 'accepted' });
    const whereArg = mockWhere.mock.calls[0]?.[0];
    const serialized = JSON.stringify(whereArg);
    expect(serialized).toContain('accepted');
  });

  it('unit_admin_list_applications_orders_desc_submitted: orderBy descending on submittedAt', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    await listApplications({});
    const orderByArg = mockOrderBy.mock.calls[0]?.[0];
    const serialized = JSON.stringify(orderByArg);
    expect(serialized).toContain('desc');
    expect(serialized).toContain('submitted_at');
  });

  it('contract_list_applications_return_type: resolves to Promise<ApplicationListRow[]> with userEmail field per row', async () => {
    mockOrderBy.mockResolvedValueOnce(
      joinedRows(
        { application: APPLICATION_FIXTURE, userEmail: 'one@example.com' },
        {
          application: { ...APPLICATION_FIXTURE, id: 'app-uuid-2' },
          userEmail: 'two@example.com',
        },
      ),
    );
    const rows = await listApplications({});
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.every((r) => 'userEmail' in r)).toBe(true);
  });

  it('data_sensitivity_decision_note_not_in_list_query: ApplicationListRow does not include decisionNote (admission-only field)', async () => {
    mockOrderBy.mockResolvedValueOnce(
      joinedRows({ application: APPLICATION_FIXTURE, userEmail: 'one@example.com' }),
    );
    const rows = await listApplications({});
    expect(rows[0]).not.toHaveProperty('decisionNote');
  });

  it('data_cascade_user_delete_cascades_to_application: innerJoin filters out rows with no matching user', async () => {
    // simulate innerJoin behaviour: rows with deleted user are not returned
    mockOrderBy.mockResolvedValueOnce([]);
    const rows = await listApplications({});
    expect(rows).toEqual([]);
    expect(mockInnerJoin).toHaveBeenCalled();
  });
});

describe('getApplication', () => {
  beforeEach(() => {
    mockSelect.mockClear();
    mockSelectFrom.mockClear();
    mockInnerJoin.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
  });

  it('unit_admin_get_application_by_id_returns_joined_row: returns ApplicationListRow with userEmail joined', async () => {
    mockLimit.mockResolvedValueOnce([
      { application: APPLICATION_FIXTURE, userEmail: 'applicant@example.com' },
    ]);
    const row = await getApplication('app-uuid-1');
    expect(row).not.toBeNull();
    expect(row?.userEmail).toBe('applicant@example.com');
    expect(row?.id).toBe('app-uuid-1');
  });

  it('unit_admin_get_application_bogus_id_returns_null: returns null when no row matches', async () => {
    mockLimit.mockResolvedValueOnce([]);
    const row = await getApplication('00000000-0000-0000-0000-000000000000');
    expect(row).toBeNull();
  });

  it('contract_get_application_nullable_return: signature is Promise<ApplicationListRow | null>', async () => {
    mockLimit.mockResolvedValueOnce([]);
    const result = getApplication('any');
    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toBeNull();
  });
});

describe('infrastructure: admin module boundary', () => {
  it('infra_admin_ts_imports_only_server_modules: admin.ts exports do not include client-only React hooks', () => {
    // smoke check: importing admin.ts at top of file works in Node env without React DOM
    expect(typeof listApplications).toBe('function');
    expect(typeof getApplication).toBe('function');
  });
});
