import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.hoisted(() => {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgres://stubuser:stub@stubhost:5432/stubdb';
  }
  if (!process.env.AUTH_SECRET) {
    process.env.AUTH_SECRET = 'test-auth-secret-32-bytes-long!!';
  }
  return {};
});

const mockAuth = vi.fn();
vi.mock('@/auth', () => ({
  auth: () => mockAuth(),
}));

const mockSelect = vi.fn();
const mockFrom = vi.fn();
const mockWhere = vi.fn();
const mockLimit = vi.fn();

vi.mock('@/db/client', () => ({
  db: {
    select: (...args: unknown[]) => {
      mockSelect(...args);
      return {
        from: (...fArgs: unknown[]) => {
          mockFrom(...fArgs);
          return {
            where: (...wArgs: unknown[]) => {
              mockWhere(...wArgs);
              return {
                limit: (...lArgs: unknown[]) => {
                  mockLimit(...lArgs);
                  return mockLimit();
                },
              };
            },
          };
        },
      };
    },
  },
  schema: {
    purchases: {
      id: 'id',
      userId: 'user_id',
      productSlug: 'product_slug',
    },
  },
}));

const mockGetProductBySlug = vi.fn();
vi.mock('@/lib/content/products', () => ({
  getProductBySlug: (...args: unknown[]) => mockGetProductBySlug(...args),
}));

const mockReadFile = vi.fn();
vi.mock('node:fs/promises', () => ({
  default: { readFile: (...args: unknown[]) => mockReadFile(...args) },
  readFile: (...args: unknown[]) => mockReadFile(...args),
}));

function createDownloadRequest(purchaseId: string) {
  return new Request(
    `http://localhost:3000/api/products/downloads/${purchaseId}`,
    { method: 'GET' },
  );
}

function createContext(purchaseId: string) {
  return {
    params: Promise.resolve({ purchaseId }),
  };
}

const MOCK_PURCHASE = {
  id: 'purchase-abc-123',
  userId: 'user-owner-id',
  productSlug: 'workflow-templates',
  stripeSessionId: 'cs_test_123',
  stripePaymentIntentId: 'pi_test_123',
  amountCents: 4900,
  currency: 'usd',
  purchasedAt: new Date('2026-04-14'),
};

const MOCK_PRODUCT_ENTRY = {
  meta: {
    id: 'prod-workflow-templates',
    slug: 'workflow-templates',
    title: 'Agent Workflow Templates',
    assetFilename: 'workflow-templates.zip',
    priceCents: 4900,
    currency: 'usd',
  },
  slug: 'workflow-templates',
  Component: () => null,
};

const MOCK_FILE_BUFFER = Buffer.from('PK\x03\x04stub-zip-content');

describe('GET /api/products/downloads/[purchaseId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    mockAuth.mockResolvedValue({
      user: { id: 'user-owner-id', email: 'owner@example.com' },
    });
    mockLimit.mockResolvedValue([MOCK_PURCHASE]);
    mockGetProductBySlug.mockResolvedValue(MOCK_PRODUCT_ENTRY);
    mockReadFile.mockResolvedValue(MOCK_FILE_BUFFER);
  });

  // --- Batch 1: Functional (unit) ---

  it('unit_download_happy_path: authenticated owner gets 200 + file bytes with correct headers', async () => {
    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );

    expect(response.status).toBe(200);

    const body = await response.arrayBuffer();
    expect(Buffer.from(body)).toEqual(MOCK_FILE_BUFFER);

    expect(response.headers.get('content-type')).toBe('application/zip');
    expect(response.headers.get('content-disposition')).toBe(
      'attachment; filename="workflow-templates.zip"',
    );
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(response.headers.get('content-length')).toBe(
      String(MOCK_FILE_BUFFER.byteLength),
    );
  });

  it('unit_download_not_found: valid session but purchaseId not in DB returns 404', async () => {
    mockLimit.mockResolvedValue([]);

    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('nonexistent-id') as never,
      createContext('nonexistent-id'),
    );
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toEqual({ error: 'Not found' });
  });

  it('unit_download_product_gone: purchase exists but product MDX deleted returns 410', async () => {
    mockGetProductBySlug.mockResolvedValue(null);

    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );
    const json = await response.json();

    expect(response.status).toBe(410);
    expect(json).toEqual({ error: 'Product no longer available' });
  });

  // --- Batch 2: Security ---

  it('sec_download_unauthenticated: no session returns 401', async () => {
    mockAuth.mockResolvedValue(null);

    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json).toEqual({ error: 'Unauthenticated' });
  });

  it('sec_download_wrong_user: authenticated but non-owner returns 403', async () => {
    mockAuth.mockResolvedValue({
      user: { id: 'different-user-id', email: 'other@example.com' },
    });

    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );
    const json = await response.json();

    expect(response.status).toBe(403);
    expect(json).toEqual({ error: 'Forbidden' });
  });

  it('sec_download_path_traversal: assetFilename escaping PRODUCTS_DIR returns 400', async () => {
    mockGetProductBySlug.mockResolvedValue({
      ...MOCK_PRODUCT_ENTRY,
      meta: {
        ...MOCK_PRODUCT_ENTRY.meta,
        assetFilename: '../../etc/passwd',
      },
    });

    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json).toEqual({ error: 'Invalid asset path' });
  });

  // --- Batch 5: Edge/error/data ---

  it('edge_download_file_missing: asset file missing on disk returns 500', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toEqual({ error: 'Asset missing on disk' });
  });

  it('edge_download_response_headers: response includes all required headers', async () => {
    const { GET } = await import('../route');
    const response = await GET(
      createDownloadRequest('purchase-abc-123') as never,
      createContext('purchase-abc-123'),
    );

    expect(response.headers.get('content-type')).toBe('application/zip');
    expect(response.headers.get('content-disposition')).toContain('attachment');
    expect(response.headers.get('content-disposition')).toContain(
      'workflow-templates.zip',
    );
    expect(response.headers.get('content-length')).toBeTruthy();
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  // --- Batch 6: Infrastructure ---

  it('infra_download_exports_GET: route module exports GET function', async () => {
    const mod = await import('../route');
    expect(mod).toHaveProperty('GET');
    expect(typeof mod.GET).toBe('function');
  });

  it('infra_download_runtime_nodejs: route exports runtime = nodejs', async () => {
    const mod = await import('../route');
    expect(mod).toHaveProperty('runtime', 'nodejs');
  });
});
