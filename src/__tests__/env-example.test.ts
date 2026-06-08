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
    // infra_env_example_documents_vars (cohort-enrollment-2.2)
    expect(text).toMatch(/^RESEND_COHORT_WAITLIST_AUDIENCE_ID=/m);
    expect(text).toMatch(/^RESEND_FROM_COHORTS=/m);

    const dbUrl = /^DATABASE_URL=(.+)$/m.exec(text)?.[1] ?? '';
    expect(dbUrl).toMatch(/localhost/i);

    const emptyExpected = [
      'AUTH_SECRET',
      'RESEND_API_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      'RESEND_COHORT_WAITLIST_AUDIENCE_ID',
      'RESEND_FROM_COHORTS',
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

  // email-funnel-1.5: NEXT_PUBLIC_SUBSTACK_EMBED_URL documentation pins.

  it('infra_env_example_documents_substack_embed_url: NEXT_PUBLIC_SUBSTACK_EMBED_URL row present', () => {
    const text = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    expect(text).toMatch(/^NEXT_PUBLIC_SUBSTACK_EMBED_URL=/m);
  });

  it('infra_env_example_substack_section_header_present: per-source comment header precedes the new var', () => {
    const text = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    const headerIdx = text.indexOf('# Substack embed');
    const varIdx = text.search(/^NEXT_PUBLIC_SUBSTACK_EMBED_URL=/m);
    expect(headerIdx).toBeGreaterThanOrEqual(0);
    expect(varIdx).toBeGreaterThanOrEqual(0);
    expect(headerIdx).toBeLessThan(varIdx);
    expect(text).toMatch(/# Substack embed \(email-funnel — supersedes self-hosted Resend funnel\)/);
  });

  it('infra_env_example_preserves_resend_and_cohort_vars: Resend + cohort vars survive the Substack swap', () => {
    const text = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    expect(text).toMatch(/^RESEND_API_KEY=/m);
    expect(text).toMatch(/^AUTH_RESEND_FROM=/m);
    expect(text).toMatch(/^RESEND_COHORT_WAITLIST_AUDIENCE_ID=/m);
    expect(text).toMatch(/^RESEND_FROM_COHORTS=/m);
  });

  it('sec_info_disclosure_env_example_substack_url_is_public_placeholder: value is the bare public embed URL, no tokens or query params', () => {
    const text = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    const match = /^NEXT_PUBLIC_SUBSTACK_EMBED_URL=(.+)$/m.exec(text);
    expect(match).not.toBeNull();
    const value = match![1];
    expect(value).toMatch(/^https:\/\/[a-z0-9-]+\.substack\.com\/embed$/);
    expect(value).not.toMatch(/\?/);
    expect(value).not.toMatch(/token|api_key|secret/i);
  });

  it('edge_input_substack_embed_url_not_in_empty_secrets_list: URL key has a non-empty placeholder and is not policed as empty-by-default', () => {
    const text = readFileSync(ENV_EXAMPLE_PATH, 'utf8');
    const match = /^NEXT_PUBLIC_SUBSTACK_EMBED_URL=(.*)$/m.exec(text);
    expect(match).not.toBeNull();
    expect((match![1] ?? '').trim().length).toBeGreaterThan(0);

    // Regression guard: source-grep this test file's own emptyExpected list to
    // prevent a future contributor from accidentally moving the URL key into the
    // secret-empty enforcement list (which would silently invert this section's
    // public-placeholder invariant).
    const selfPath = path.resolve(__dirname, 'env-example.test.ts');
    const selfText = readFileSync(selfPath, 'utf8');
    const emptyListSlice = /const emptyExpected = \[([\s\S]*?)\];/.exec(selfText)?.[1] ?? '';
    expect(emptyListSlice).not.toMatch(/NEXT_PUBLIC_SUBSTACK_EMBED_URL/);
  });
});
