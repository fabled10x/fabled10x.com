import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const { mockResendCreate, ResendSpy } = vi.hoisted(() => {
  const mockResendCreate = vi.fn();
  const ResendSpy = vi.fn().mockImplementation(() => ({
    contacts: { create: mockResendCreate },
  }));
  return { mockResendCreate, ResendSpy };
});

vi.mock('resend', () => ({ Resend: ResendSpy }));

const {
  mockInsert,
  mockValues,
  mockOnConflictDoNothing,
  mockReturning,
} = vi.hoisted(() => {
  const mockReturning = vi.fn();
  const mockOnConflictDoNothing = vi.fn(() => ({ returning: mockReturning }));
  const mockValues = vi.fn(() => ({
    onConflictDoNothing: mockOnConflictDoNothing,
  }));
  const mockInsert = vi.fn(() => ({ values: mockValues }));
  return { mockInsert, mockValues, mockOnConflictDoNothing, mockReturning };
});

vi.mock('@/db/client', () => ({
  db: { insert: mockInsert },
  schema: {
    cohortWaitlist: {
      email: { name: 'email' },
      cohortSlug: { name: 'cohort_slug' },
    },
  },
}));

const { mockAuth } = vi.hoisted(() => ({ mockAuth: vi.fn() }));
vi.mock('@/auth', () => ({ auth: mockAuth }));

const { mockGetCohortBySlug } = vi.hoisted(() => ({
  mockGetCohortBySlug: vi.fn(),
}));
vi.mock('@/lib/content/cohorts', () => ({
  getCohortBySlug: mockGetCohortBySlug,
}));

const { mockSendEmail } = vi.hoisted(() => ({ mockSendEmail: vi.fn() }));
vi.mock('@/lib/email/cohort-waitlist-confirmation', () => ({
  sendCohortWaitlistConfirmation: mockSendEmail,
}));

import { submitWaitlist, type WaitlistState } from '../actions';

const idle: WaitlistState = { status: 'idle' };

function fd(entries: Array<[string, string]>): FormData {
  const f = new FormData();
  for (const [k, v] of entries) f.append(k, v);
  return f;
}

const COHORT_FIXTURE = {
  meta: {
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    startDate: '2026-09-14',
    durationWeeks: 6,
    commitmentHoursPerWeek: 10,
  },
  slug: 'ai-delivery-2026-q3',
  Component: () => null,
};

const originalEnv = { ...process.env };

describe('submitWaitlist server action', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'rk_test_supersecret_abc123';
    process.env.RESEND_COHORT_WAITLIST_AUDIENCE_ID = 'aud_cohort_test_xyz';
    mockResendCreate.mockReset();
    mockResendCreate.mockResolvedValue({ id: 'mock-contact-1' });
    ResendSpy.mockClear();
    mockInsert.mockClear();
    mockValues.mockClear();
    mockOnConflictDoNothing.mockClear();
    mockReturning.mockReset();
    mockReturning.mockResolvedValue([
      { id: 'wl-1', email: 'user@example.com', cohortSlug: 'ai-delivery-2026-q3' },
    ]);
    mockAuth.mockReset();
    mockAuth.mockResolvedValue(null);
    mockGetCohortBySlug.mockReset();
    mockGetCohortBySlug.mockResolvedValue(COHORT_FIXTURE);
    mockSendEmail.mockReset();
    mockSendEmail.mockResolvedValue(undefined);
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // --- Unit: WaitlistInputSchema ---

  it('unit_schema_email_valid', async () => {
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
        ['sourceTag', 'cohort-detail'],
      ]),
    );
    expect(result.status).toBe('success');
  });

  it('unit_schema_email_invalid', async () => {
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'not-an-email'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/valid email/i);
    }
  });

  it('unit_schema_slug_regex', async () => {
    // Reject uppercase
    const upper = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'AI-Delivery'],
      ]),
    );
    expect(upper.status).toBe('error');
    // Reject space
    const spaced = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai delivery 2026'],
      ]),
    );
    expect(spaced.status).toBe('error');
    // Accept lowercase-hyphen-alnum
    const ok = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(ok.status).toBe('success');
  });

  it('unit_schema_sourcetag_optional', async () => {
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ sourceTag: null }),
    );
  });

  // --- Integration ---

  it('integration_action_inserts_row', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'user-123', email: 'user@example.com' },
    });
    await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
        ['sourceTag', 'cohort-detail'],
      ]),
    );
    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        cohortSlug: 'ai-delivery-2026-q3',
        sourceTag: 'cohort-detail',
        userId: 'user-123',
      }),
    );
    expect(mockOnConflictDoNothing).toHaveBeenCalledTimes(1);
    expect(mockReturning).toHaveBeenCalledTimes(1);
  });

  it('integration_action_dedupe_returns_already', async () => {
    mockReturning.mockResolvedValue([]);
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.message).toMatch(/already.*waitlist/i);
    }
    // Should not call Resend audience or email helper when nothing inserted
    expect(mockResendCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('integration_action_resend_audience_called', async () => {
    await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(mockResendCreate).toHaveBeenCalledTimes(1);
    expect(mockResendCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        audienceId: 'aud_cohort_test_xyz',
        email: 'user@example.com',
        unsubscribed: false,
      }),
    );
  });

  it('integration_action_resend_skipped_when_env_missing', async () => {
    delete process.env.RESEND_COHORT_WAITLIST_AUDIENCE_ID;
    await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(mockResendCreate).not.toHaveBeenCalled();
  });

  it('integration_action_calls_email_helper', async () => {
    await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'user@example.com',
        cohort: COHORT_FIXTURE,
      }),
    );
  });

  // --- Security ---

  it('sec_tampering_slug_regex', async () => {
    for (const slug of ['../admin', '<script>alert(1)</script>', 'ai delivery 2026']) {
      mockInsert.mockClear();
      mockGetCohortBySlug.mockClear();
      const result = await submitWaitlist(
        idle,
        fd([
          ['email', 'u@x.co'],
          ['cohortSlug', slug],
        ]),
      );
      expect(result.status).toBe('error');
      expect(mockInsert).not.toHaveBeenCalled();
      expect(mockGetCohortBySlug).not.toHaveBeenCalled();
    }
  });

  it('sec_tampering_unknown_cohort_rejected', async () => {
    mockGetCohortBySlug.mockResolvedValue(null);
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'bogus-cohort'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/cohort not found/i);
    }
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('sec_info_disclosure_resend_error_swallowed', async () => {
    mockResendCreate.mockRejectedValue(
      new Error('rk_live_supersecret_xyz invalid api key'),
    );
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(result.message).not.toMatch(/rk_live_/);
    }
    // DB insert still happened
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('sec_dos_idempotent_dedupe', async () => {
    mockReturning.mockResolvedValue([]);
    for (let i = 0; i < 10; i++) {
      await submitWaitlist(
        idle,
        fd([
          ['email', 'spammer@example.com'],
          ['cohortSlug', 'ai-delivery-2026-q3'],
        ]),
      );
    }
    // Insert attempted 10 times but Resend never invoked because returning() empty
    expect(mockInsert).toHaveBeenCalledTimes(10);
    expect(mockResendCreate).not.toHaveBeenCalled();
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  // --- Contract ---

  it('contract_action_idle_shape', () => {
    const initial: WaitlistState = { status: 'idle' };
    expect(initial.status).toBe('idle');
    expect(Object.keys(initial)).toEqual(['status']);
  });

  it('contract_action_success_shape', async () => {
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
    if (result.status === 'success') {
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  it('contract_action_error_shape', async () => {
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', '../admin'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(typeof result.message).toBe('string');
      expect(result.message.length).toBeGreaterThan(0);
    }
  });

  // --- Edge ---

  it('edge_input_email_at_254_chars', async () => {
    const ok = 'a'.repeat(247) + '@a.com'; // 247+6 = 253 chars (just under)
    const okResult = await submitWaitlist(
      idle,
      fd([
        ['email', ok],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(okResult.status).toBe('success');

    const tooLong = 'a'.repeat(249) + '@a.com'; // 249+6 = 255 chars
    const tooLongResult = await submitWaitlist(
      idle,
      fd([
        ['email', tooLong],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(tooLongResult.status).toBe('error');
  });

  it('edge_input_sourcetag_at_128_chars', async () => {
    const ok = 'x'.repeat(128);
    const okResult = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
        ['sourceTag', ok],
      ]),
    );
    expect(okResult.status).toBe('success');

    const tooLong = 'x'.repeat(129);
    const tooLongResult = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
        ['sourceTag', tooLong],
      ]),
    );
    expect(tooLongResult.status).toBe('error');
  });

  it('edge_state_anonymous_user_null', async () => {
    mockAuth.mockResolvedValue(null);
    await submitWaitlist(
      idle,
      fd([
        ['email', 'anon@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null }),
    );
  });

  it('edge_state_signed_in_user_id_attached', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'u-987', email: 'signed@example.com' },
    });
    await submitWaitlist(
      idle,
      fd([
        ['email', 'signed@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(mockValues).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 'u-987' }),
    );
  });

  // --- Error Recovery ---

  it('err_resend_audience_failure_db_row_survives', async () => {
    mockResendCreate.mockRejectedValue(new Error('Resend down'));
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('err_email_send_failure_action_still_success', async () => {
    mockSendEmail.mockRejectedValue(new Error('Resend emails endpoint 500'));
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
    expect(mockInsert).toHaveBeenCalledTimes(1);
  });

  it('err_email_resend_send_rejects_swallowed', async () => {
    mockResendCreate.mockRejectedValue(new Error('audience 500'));
    mockSendEmail.mockRejectedValue(new Error('emails 500'));
    const result = await submitWaitlist(
      idle,
      fd([
        ['email', 'u@x.co'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(result.status).toBe('success');
  });

  // --- Data integrity ---

  it('data_consistency_unique_pair_dedupe', async () => {
    // First call: inserted
    mockReturning.mockResolvedValueOnce([{ id: 'wl-1' }]);
    await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    expect(mockResendCreate).toHaveBeenCalledTimes(1);

    // Second call: dedupe
    mockReturning.mockResolvedValueOnce([]);
    await submitWaitlist(
      idle,
      fd([
        ['email', 'user@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    // Resend audience not called a second time (gated on inserted.length > 0)
    expect(mockResendCreate).toHaveBeenCalledTimes(1);
    expect(mockSendEmail).toHaveBeenCalledTimes(1);
  });

  it('data_sensitivity_email_not_logged', async () => {
    process.env.RESEND_API_KEY = 'rk_live_DO_NOT_LEAK_abc123';
    mockResendCreate.mockRejectedValue(new Error('rk_live_DO_NOT_LEAK_abc123'));
    await submitWaitlist(
      idle,
      fd([
        ['email', 'private@example.com'],
        ['cohortSlug', 'ai-delivery-2026-q3'],
      ]),
    );
    const allLogs = [
      ...logSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ]
      .map((v) => (typeof v === 'string' ? v : ''))
      .join(' ');
    expect(allLogs).not.toContain('private@example.com');
    expect(allLogs).not.toContain('rk_live_DO_NOT_LEAK_abc123');
  });
});
