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

describe('proxy (edge session gate)', () => {
  // --- Unit: public paths pass through ---

  it('unit_middleware_public_path_passthrough', () => {
    const res = proxy(makeRequest('/products'));
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  it('unit_middleware_public_product_page_passthrough', () => {
    const res = proxy(makeRequest('/products/workflow-templates'));
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  // --- Unit: gated paths without cookie redirect ---

  it('unit_middleware_gated_redirect_no_cookie', () => {
    const res = proxy(makeRequest('/products/account'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('callbackUrl=%2Fproducts%2Faccount');
  });

  it('unit_middleware_gated_redirect_preserves_full_path', () => {
    const res = proxy(makeRequest('/products/account/purchases/abc'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain(
      'callbackUrl=%2Fproducts%2Faccount%2Fpurchases%2Fabc',
    );
  });

  it('unit_middleware_download_api_gated', () => {
    const res = proxy(makeRequest('/api/products/downloads/xyz'));
    expect(res.status).toBe(307);
    const location = res.headers.get('location');
    expect(location).toContain('/login');
    expect(location).toContain('callbackUrl=%2Fapi%2Fproducts%2Fdownloads%2Fxyz');
  });

  // --- Unit: cookies allow passthrough ---

  it('unit_middleware_passes_with_dev_cookie', () => {
    const res = proxy(
      makeRequest('/products/account', [
        { name: 'authjs.session-token', value: 'dev-session-abc' },
      ]),
    );
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  it('unit_middleware_passes_with_secure_cookie', () => {
    const res = proxy(
      makeRequest('/products/account', [
        { name: '__Secure-authjs.session-token', value: 'prod-session-xyz' },
      ]),
    );
    expect(isPassthrough(res)).toBe(true);
    expect(res.headers.get('location')).toBeNull();
  });

  // --- Unit: config.matcher exported ---

  it('unit_middleware_config_matcher_exported', () => {
    expect(config).toBeDefined();
    expect(Array.isArray(config.matcher)).toBe(true);
    expect(config.matcher).toContain('/products/account/:path*');
    expect(config.matcher).toContain('/api/products/downloads/:path*');
  });

  // --- Security: cookie presence alone is not authentication ---

  it('sec_cookie_presence_is_not_auth', () => {
    // Middleware is a filter-only check; any truthy cookie value passes
    // through. Real validation happens in page handlers via auth().
    // This test documents the boundary of responsibility.
    const spoofValues = [
      'spoofed-cookie-value-123',
      'opaque-random-string',
      'obviously-fake',
    ];
    for (const value of spoofValues) {
      const res = proxy(
        makeRequest('/products/account', [
          { name: 'authjs.session-token', value },
        ]),
      );
      expect(isPassthrough(res)).toBe(true);
    }
  });

  // --- Edge cases ---

  it('edge_middleware_empty_cookie_value', () => {
    // Cookie present but empty-string value → treated as absent (Boolean
    // check rejects falsy values).
    const res = proxy(
      makeRequest('/products/account', [
        { name: 'authjs.session-token', value: '' },
      ]),
    );
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/login');
  });

  it('edge_middleware_both_cookies_present', () => {
    const res = proxy(
      makeRequest('/products/account', [
        { name: 'authjs.session-token', value: 'dev-val' },
        { name: '__Secure-authjs.session-token', value: 'prod-val' },
      ]),
    );
    expect(isPassthrough(res)).toBe(true);
  });

  it('edge_middleware_callbackurl_preserves_query_string', () => {
    const req = new NextRequest(
      new URL('/products/account/purchases?sort=date&page=2', 'http://localhost:3000'),
    );
    const res = proxy(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    expect(location).toContain(
      'callbackUrl=%2Fproducts%2Faccount%2Fpurchases%3Fsort%3Ddate%26page%3D2',
    );
  });

  // --- Infrastructure ---

  it('infra_middleware_config_matcher_paths', () => {
    expect(config.matcher).toEqual(
      expect.arrayContaining([
        '/products/account/:path*',
        '/api/products/downloads/:path*',
      ]),
    );
    expect(config.matcher).toHaveLength(2);
  });

  it('infra_middleware_edge_runtime_safe', async () => {
    // Proxy runs in the edge runtime. It must not import Node-only modules
    // or anything that would pull in @/auth, @/db/client, next-auth, etc.
    const [fs, path] = await Promise.all([
      import('node:fs'),
      import('node:path'),
    ]);
    const proxyPath = path.resolve(process.cwd(), 'proxy.ts');
    const proxySource = fs.readFileSync(proxyPath, 'utf-8');
    expect(proxySource).not.toMatch(/from ['"]@\/auth['"]/);
    expect(proxySource).not.toMatch(/from ['"]@\/db\//);
    expect(proxySource).not.toMatch(/from ['"]next-auth['"]/);
    expect(proxySource).not.toMatch(/from ['"]@auth\//);
  });

  // --- Data integrity: URL encoding ---

  it('data_middleware_callbackurl_url_encoded', () => {
    const res = proxy(
      makeRequest('/products/account/purchases?id=1&sort=asc'),
    );
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    // Query-string special characters must be percent-encoded INSIDE the
    // callbackUrl param so the login page receives them as a single value.
    expect(location).toContain('callbackUrl=');
    expect(location).toContain('%3F'); // encoded '?'
    expect(location).toContain('%3D'); // encoded '='
    expect(location).toContain('%26'); // encoded '&'
  });
});
