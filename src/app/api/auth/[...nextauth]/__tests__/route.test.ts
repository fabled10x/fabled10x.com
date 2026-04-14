import { describe, expect, it, vi } from 'vitest';

vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://stubuser:stub@stubhost:5432/stubdb';
  }
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'test-auth-secret-stub-32-bytes-long-xxx';
  }
  if (!process.env.RESEND_API_KEY) {
    process.env.RESEND_API_KEY = 're_test_stub_api_key';
  }
  return {};
});

describe('auth route re-export (unit)', () => {
  it('unit_route_reexports_handlers_GET_POST: src/app/api/auth/[...nextauth]/route.ts exports GET and POST functions', async () => {
    const mod = await import('../route');
    expect(mod).toHaveProperty('GET');
    expect(mod).toHaveProperty('POST');
    expect(typeof mod.GET).toBe('function');
    expect(typeof mod.POST).toBe('function');
  });

  it('infra_auth_route_file_structure: route module exposes only GET and POST (no accidental extra exports)', async () => {
    const mod = await import('../route');
    const keys = Object.keys(mod).sort();
    expect(keys).toEqual(['GET', 'POST']);
  });
});
