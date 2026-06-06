import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://stubuser:stub@stubhost:5432/stubdb';
  }
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'test-auth-secret-32-bytes-long!!';
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    process.env.STRIPE_SECRET_KEY = 'sk_test_stub_key';
  }
  if (!process.env.COHORT_CHECKOUT_SECRET) {
    process.env.COHORT_CHECKOUT_SECRET = 'test-cohort-checkout-secret-32b!';
  }
  return {};
});

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockGetApplication = vi.fn();
vi.mock('@/lib/cohorts/admin', () => ({
  getApplication: (...args: unknown[]) => mockGetApplication(...args),
}));

const mockGetCohortBySlug = vi.fn();
vi.mock('@/lib/content/cohorts', () => ({
  getCohortBySlug: (...args: unknown[]) => mockGetCohortBySlug(...args),
}));

const mockCreateCohortCheckoutSession = vi.fn();
vi.mock('@/lib/cohorts/checkout', () => ({
  createCohortCheckoutSession: (...args: unknown[]) =>
    mockCreateCohortCheckoutSession(...args),
}));

function makeCohort() {
  return {
    meta: {
      slug: 'ai-delivery-2026-q3',
      title: 'AI Delivery — Q3 2026',
      stripePriceId: 'price_real_abc',
      priceCents: 200000,
      currency: 'usd',
    },
    body: '',
  };
}

function makeApplication(userId = 'user-1') {
  return {
    id: 'app-uuid-1',
    userId,
    userEmail: 'applicant@example.com',
    cohortSlug: 'ai-delivery-2026-q3',
    decision: 'pending',
    submittedAt: new Date('2026-06-01T00:00:00Z'),
  };
}

async function makeToken(payload: {
  applicationId: string;
  cohortSlug: string;
  expiresAt: number;
}) {
  // Use the real signCheckoutToken from the lib under test — this assumes
  // the file is reachable; if not, the import itself fails the test (which
  // is the desired red signal until Green creates checkout-token.ts).
  const { signCheckoutToken } = await import('@/lib/cohorts/checkout-token');
  return signCheckoutToken(payload);
}

function makeRequestUrl(slug: string, token?: string): string {
  const params = token ? `?token=${encodeURIComponent(token)}` : '';
  return `http://localhost:3000/cohorts/${slug}/checkout${params}`;
}

describe('GET /cohorts/[slug]/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({
      user: { id: 'user-1', email: 'applicant@example.com' },
    });
    mockGetCohortBySlug.mockResolvedValue(makeCohort());
    mockGetApplication.mockResolvedValue(makeApplication('user-1'));
    mockCreateCohortCheckoutSession.mockResolvedValue(
      'https://checkout.stripe.com/c/cs_test_xyz',
    );
  });

  it('route_happy_path_redirects_to_stripe: signed-in owner with valid token → 302 to Stripe', async () => {
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    expect(res.headers.get('location')).toBe(
      'https://checkout.stripe.com/c/cs_test_xyz',
    );
    expect(mockCreateCohortCheckoutSession).toHaveBeenCalledTimes(1);
  });

  it('route_no_session_redirects_to_login: no session → 302 to /login with callbackUrl preserved', async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', 'sometoken'));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toContain('/login');
    expect(loc).toContain('callbackUrl');
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('route_missing_token_redirects_to_error: no ?token query param → 302 with /cohorts?error=...', async () => {
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3'));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.status).toBeLessThan(400);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toContain('/cohorts');
    expect(loc).toContain('error=');
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('route_slug_mismatch_redirects_to_error: token cohortSlug ≠ url slug → 302 with mismatch error', async () => {
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'other-cohort',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location')).toMatch(/\/cohorts\?error=/);
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('route_application_not_found_redirects_to_error: getApplication returns null → 302 with not-found error', async () => {
    mockGetApplication.mockResolvedValue(null);
    const token = await makeToken({
      applicationId: 'app-missing',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location')).toMatch(/\/cohorts\?error=/);
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('route_cohort_not_found_redirects_to_error: getCohortBySlug returns null → 302 with not-found error', async () => {
    mockGetCohortBySlug.mockResolvedValue(null);
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location')).toMatch(/\/cohorts\?error=/);
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('sec_elevation_route_wrong_user_application: applicationId resolves to another userId → 302 error, no Stripe call', async () => {
    mockGetApplication.mockResolvedValue(makeApplication('user-OTHER'));
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location')).toMatch(/\/cohorts\?error=/);
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('sec_information_disclosure_error_text_generic: error redirect query string does NOT leak applicationId / token / internal IDs', async () => {
    mockGetApplication.mockResolvedValue(null);
    const token = await makeToken({
      applicationId: 'app-uuid-secret-leak-canary-xyz',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    const loc = res.headers.get('location') ?? '';
    expect(loc).not.toContain('app-uuid-secret-leak-canary-xyz');
    expect(loc).not.toContain(token);
  });

  it('infra_route_runtime_nodejs: route file declares `export const runtime = "nodejs"`', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const src = readFileSync(
      resolve(process.cwd(), 'src/app/cohorts/[slug]/checkout/route.ts'),
      'utf8',
    );
    expect(src).toMatch(/export\s+const\s+runtime\s*=\s*['"]nodejs['"]/);
  });

  it('perm_anonymous_checkout_route_deny: anonymous → /login redirect, no Stripe call', async () => {
    mockAuth.mockResolvedValue(null);
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', 'anytoken'));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.status).toBeGreaterThanOrEqual(300);
    expect(res.headers.get('location') ?? '').toContain('/login');
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('perm_authenticated_owner_checkout_allow: signed-in owner → reaches createCohortCheckoutSession + Stripe redirect', async () => {
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(mockCreateCohortCheckoutSession).toHaveBeenCalledTimes(1);
    expect(res.headers.get('location')).toContain('checkout.stripe.com');
  });

  it('perm_authenticated_nonowner_checkout_deny: signed-in non-owner → error redirect, no Stripe call', async () => {
    mockGetApplication.mockResolvedValue(makeApplication('user-OTHER'));
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.headers.get('location') ?? '').toMatch(/\/cohorts\?error=/);
    expect(mockCreateCohortCheckoutSession).not.toHaveBeenCalled();
  });

  it('contract_route_success_redirect_shape: success is a 302 with Location set to the Stripe URL exactly', async () => {
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect([302, 303, 307]).toContain(res.status);
    expect(res.headers.get('location')).toBe(
      'https://checkout.stripe.com/c/cs_test_xyz',
    );
  });

  it('contract_route_error_redirect_shape: error response is 302 to /cohorts?error=<string>', async () => {
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3'));
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect([302, 303, 307]).toContain(res.status);
    const loc = res.headers.get('location') ?? '';
    expect(loc).toMatch(/\/cohorts\?error=/);
  });

  it('edge_input_route_token_url_encoded: URL-encoded token in the query is decoded before verify', async () => {
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    // Force re-encoding through URL constructor (simulates email-link traversal)
    const url = new URL(`http://localhost:3000/cohorts/ai-delivery-2026-q3/checkout`);
    url.searchParams.set('token', token);
    const { GET } = await import('../route');
    const req = new Request(url.toString());
    const res = await GET(req as unknown as Parameters<typeof GET>[0], {
      params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
    });
    expect(res.headers.get('location')).toContain('checkout.stripe.com');
  });

  it('err_stripe_sdk_throws_in_route_returns_500_or_error_redirect: Stripe SDK rejection → user-visible safe outcome (not raw 500 leak)', async () => {
    mockCreateCohortCheckoutSession.mockRejectedValueOnce(new Error('Stripe down'));
    const token = await makeToken({
      applicationId: 'app-uuid-1',
      cohortSlug: 'ai-delivery-2026-q3',
      expiresAt: Date.now() + 60_000,
    });
    const { GET } = await import('../route');
    const req = new Request(makeRequestUrl('ai-delivery-2026-q3', token));
    // Either throws (Next.js will surface a 500 page) OR returns a redirect.
    // Both are acceptable; assert that if a Response is returned, it doesn't echo the error string.
    let res: Response | null = null;
    try {
      res = await GET(req as unknown as Parameters<typeof GET>[0], {
        params: Promise.resolve({ slug: 'ai-delivery-2026-q3' }),
      });
    } catch (err) {
      // throw path: Next will render an error page; test passes as long as
      // we didn't reach Stripe (we did — that's how we got the rejection).
      expect(err).toBeInstanceOf(Error);
      return;
    }
    if (res) {
      const text = await res.clone().text();
      expect(text).not.toContain('Stripe down');
    }
  });
});
