import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';

import { proxy, config } from '../../proxy';

function makeRequest(
  path: string,
  cookies: { name: string; value: string }[] = [],
): NextRequest {
  const req = new NextRequest(new URL(path, 'http://localhost:3000'));
  for (const { name, value } of cookies) {
    req.cookies.set(name, value);
  }
  return req;
}

function isPassthrough(res: Response): boolean {
  return res.headers.get('x-middleware-next') === '1' || res.status === 200;
}

describe('proxy — cohort apply route (ce-3.2)', () => {
  // --- Permission: matcher includes cohort apply route ---

  it('perm_anonymous_proxy_blocks_apply_route', () => {
    const res = proxy(makeRequest('/cohorts/ai-delivery-2026-q3/apply'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain(
      'callbackUrl=%2Fcohorts%2Fai-delivery-2026-q3%2Fapply',
    );
  });

  it('perm_authenticated_proxy_passes_apply_route', () => {
    const res = proxy(
      makeRequest('/cohorts/ai-delivery-2026-q3/apply', [
        { name: 'authjs.session-token', value: 'dev-session-abc' },
      ]),
    );
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  it('perm_proxy_does_not_match_cohorts_index', () => {
    // /cohorts is public — should pass through without redirect
    const res = proxy(makeRequest('/cohorts'));
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  it('perm_proxy_does_not_match_cohort_detail', () => {
    // /cohorts/[slug] is public — should pass through without redirect
    const res = proxy(makeRequest('/cohorts/ai-delivery-2026-q3'));
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  // --- Security: STRIDE elevation ---

  it('sec_elevation_proxy_redirects_unauthenticated', () => {
    const res = proxy(makeRequest('/cohorts/workflow-mastery-2026-q4/apply'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toMatch(/callbackUrl=%2Fcohorts%2F[^/]+%2Fapply/);
  });

  // --- Contract: matcher + redirect shape ---

  it('contract_proxy_matcher_includes_apply_route', () => {
    expect(Array.isArray(config.matcher)).toBe(true);
    const hasApplyMatcher = (config.matcher as string[]).some(
      (m) => m.includes('/cohorts/') && m.includes('/apply'),
    );
    expect(hasApplyMatcher).toBe(true);
  });

  it('contract_proxy_redirect_response_shape', () => {
    const res = proxy(makeRequest('/cohorts/ai-delivery-2026-q3/apply'));
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBeTruthy();
  });

  // --- Infrastructure ---

  it('infra_proxy_matcher_array_length', () => {
    // sa-2.3 baseline matcher: /products/account/:path* + /api/products/downloads/:path*
    // ce-3.2 adds exactly one entry (the cohort apply matcher).
    const matcher = config.matcher as string[];
    expect(matcher.length).toBeGreaterThanOrEqual(3);
    expect(matcher).toContain('/products/account/:path*');
    expect(matcher).toContain('/api/products/downloads/:path*');
  });
});
