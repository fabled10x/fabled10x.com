import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const ENV_EXAMPLE_PATH = path.resolve(__dirname, '..', '..', '.env.example');

describe('.env.example safety', () => {
  it('sec_info_disclosure_env_example_contains_no_real_secrets: only placeholder values, safe to commit', () => {
    expect(existsSync(ENV_EXAMPLE_PATH)).toBe(true);
    const text = readFileSync(ENV_EXAMPLE_PATH, 'utf8');

    expect(text).toMatch(/^DATABASE_URL=/m);
    expect(text).toMatch(/^POSTGRES_USER=/m);
    expect(text).toMatch(/^POSTGRES_PASSWORD=/m);
    expect(text).toMatch(/^POSTGRES_DB=/m);
    expect(text).toMatch(/^AUTH_SECRET=/m);
    expect(text).toMatch(/^AUTH_URL=/m);
    expect(text).toMatch(/^AUTH_RESEND_FROM=/m);
    expect(text).toMatch(/^RESEND_API_KEY=/m);
    expect(text).toMatch(/^STRIPE_SECRET_KEY=/m);
    expect(text).toMatch(/^STRIPE_WEBHOOK_SECRET=/m);
    expect(text).toMatch(/^NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=/m);

    const dbUrl = /^DATABASE_URL=(.+)$/m.exec(text)?.[1] ?? '';
    expect(dbUrl).toMatch(/localhost/i);

    const emptyExpected = [
      'AUTH_SECRET',
      'RESEND_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    ];
    for (const key of emptyExpected) {
      const re = new RegExp(`^${key}=(.*)$`, 'm');
      const value = re.exec(text)?.[1] ?? 'NOT_FOUND';
      expect(value.trim()).toBe('');
    }

    expect(text).not.toMatch(/sk_live_/);
    expect(text).not.toMatch(/re_[A-Za-z0-9]{16,}/);
    expect(text).not.toMatch(/whsec_[A-Za-z0-9]{16,}/);
  });
});
