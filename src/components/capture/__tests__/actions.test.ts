import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockCreate = vi.fn();

vi.mock('resend', () => ({
  Resend: vi.fn().mockImplementation(() => ({
    contacts: { create: mockCreate },
  })),
}));

import { captureEmail } from '../actions';
import type { CaptureState } from '../actions';

const idle: CaptureState = { status: 'idle' };

function formDataFrom(entries: Array<[string, string]>): FormData {
  const fd = new FormData();
  for (const [k, v] of entries) fd.append(k, v);
  return fd;
}

const originalEnv = { ...process.env };

describe('captureEmail server action', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    process.env.RESEND_API_KEY = 'rk_test_supersecret_abc123';
    process.env.RESEND_AUDIENCE_ID = 'aud_supersecret_xyz789';
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({ id: 'mock-contact' });
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    logSpy.mockRestore();
    errorSpy.mockRestore();
  });

  // --- Unit ---

  it('unit_action_validates_email', async () => {
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('success');
  });

  it('unit_action_rejects_invalid', async () => {
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'not-an-email'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/valid email/i);
    }
  });

  it('unit_action_missing_env', async () => {
    delete process.env.RESEND_API_KEY;
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/temporarily unavailable/i);
    }
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('unit_action_missing_audience', async () => {
    delete process.env.RESEND_AUDIENCE_ID;
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/temporarily unavailable/i);
    }
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('unit_action_resend_success', async () => {
    await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'user@example.com',
        audienceId: 'aud_supersecret_xyz789',
        unsubscribed: false,
      }),
    );
  });

  it('unit_action_logs_on_success', async () => {
    await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    const logged = logSpy.mock.calls.flat().join(' ');
    expect(logged).toContain('[capture] subscribed');
    expect(logged).toContain('homepage-hero');
  });

  // --- Security ---

  it('sec_zod_rejects_bad_email', async () => {
    for (const badEmail of ['', 'a@b', 'no at sign', 'spaces in@email.com']) {
      mockCreate.mockClear();
      const result = await captureEmail(
        idle,
        formDataFrom([
          ['email', badEmail],
          ['source', 'homepage-hero'],
        ]),
      );
      expect(result.status).toBe('error');
      expect(mockCreate).not.toHaveBeenCalled();
    }
  });

  it('sec_zod_rejects_missing_fields', async () => {
    // Missing email
    let result = await captureEmail(idle, formDataFrom([['source', 'test']]));
    expect(result.status).toBe('error');
    expect(mockCreate).not.toHaveBeenCalled();

    // Missing source
    result = await captureEmail(
      idle,
      formDataFrom([['email', 'user@example.com']]),
    );
    expect(result.status).toBe('error');
    expect(mockCreate).not.toHaveBeenCalled();

    // Source too long (>128)
    result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'x'.repeat(129)],
      ]),
    );
    expect(result.status).toBe('error');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('sec_no_api_key_in_response', async () => {
    mockCreate.mockRejectedValue(new Error('Resend 500: rk_test_supersecret_abc123 failed'));
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).not.toContain('rk_test_supersecret_abc123');
      expect(result.message).not.toContain('aud_supersecret_xyz789');
    }
  });

  it('sec_no_api_key_in_log', async () => {
    // Trigger env-missing path
    delete process.env.RESEND_API_KEY;
    await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    // Trigger Resend-error path
    process.env.RESEND_API_KEY = 'rk_test_supersecret_abc123';
    mockCreate.mockRejectedValue(new Error('boom'));
    await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    const allLogs = [
      ...logSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ]
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(' ');
    expect(allLogs).not.toContain('rk_test_supersecret_abc123');
    expect(allLogs).not.toContain('aud_supersecret_xyz789');
  });

  // --- Edge ---

  it('edge_action_resend_network_error', async () => {
    mockCreate.mockRejectedValue(new Error('ECONNRESET'));
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('error');
    if (result.status === 'error') {
      expect(result.message).toMatch(/something went wrong|try again/i);
    }
  });

  it('edge_action_boundary_source_length', async () => {
    // 128 exactly — accepted
    let result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'x'.repeat(128)],
      ]),
    );
    expect(result.status).toBe('success');

    // 129 — rejected
    mockCreate.mockClear();
    result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'x'.repeat(129)],
      ]),
    );
    expect(result.status).toBe('error');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  // --- Error recovery ---

  it('err_resend_throws', async () => {
    mockCreate.mockRejectedValue(new Error('Resend API is down'));
    const result = await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    expect(result.status).toBe('error');
    expect(errorSpy).toHaveBeenCalled();
    const errorCall = errorSpy.mock.calls.flat().join(' ');
    expect(errorCall).toContain('[capture]');
  });

  // --- Data integrity ---

  it('data_env_not_logged', async () => {
    // Run through both paths — env-missing and success
    delete process.env.RESEND_API_KEY;
    await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    process.env.RESEND_API_KEY = 'rk_test_supersecret_abc123';
    await captureEmail(
      idle,
      formDataFrom([
        ['email', 'user@example.com'],
        ['source', 'homepage-hero'],
      ]),
    );
    const allLogs = [
      ...logSpy.mock.calls.flat(),
      ...errorSpy.mock.calls.flat(),
    ]
      .map((v) => (typeof v === 'string' ? v : JSON.stringify(v)))
      .join(' ');
    expect(allLogs).not.toContain('rk_test_supersecret_abc123');
    expect(allLogs).not.toContain('aud_supersecret_xyz789');
  });
});
