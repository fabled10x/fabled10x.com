import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '../loader';
import type { Product } from '@/content/schemas';

// --- Mock loader (unit-test default; integration tests use vi.importActual) ---

vi.mock('../loader', async () => {
  const actual = await vi.importActual<typeof import('../loader')>('../loader');
  return {
    ...actual,
    loadContent: vi.fn(),
  };
});

import { loadContent } from '../loader';
const mockLoadContent = vi.mocked(loadContent);

// --- Fixtures ---

const mockComponent: ComponentType = () => null;

const productAlphaNewer: LoadedEntry<Product> = {
  meta: {
    id: 'prod-alpha',
    slug: 'alpha-product',
    title: 'Alpha Product',
    tagline: 'Newer product.',
    summary: 'Newer product summary.',
    category: 'workflow-templates',
    licenseType: 'single-user',
    priceCents: 4900,
    currency: 'usd',
    stripePriceId: 'price_alpha123',
    assetFilename: 'alpha.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-12T00:00:00Z',
  },
  slug: 'alpha-product',
  Component: mockComponent,
};

const productZetaOlder: LoadedEntry<Product> = {
  meta: {
    id: 'prod-zeta',
    slug: 'zeta-product',
    title: 'Zeta Product',
    tagline: 'Older product.',
    summary: 'Older product summary.',
    category: 'discovery-toolkit',
    licenseType: 'single-user',
    priceCents: 2900,
    currency: 'usd',
    stripePriceId: 'price_zeta456',
    assetFilename: 'zeta.zip',
    lllEntryUrls: [],
    relatedCaseIds: [],
    publishedAt: '2026-01-01T00:00:00Z',
  },
  slug: 'zeta-product',
  Component: mockComponent,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('products loader (unit, mocked loadContent)', () => {
  async function importProducts() {
    return import('../products');
  }

  it('unit_products_get_all_sorted: returns LoadedEntry<Product>[] sorted by publishedAt DESCENDING', async () => {
    mockLoadContent.mockResolvedValue([productZetaOlder, productAlphaNewer]);
    const { getAllProducts } = await importProducts();

    const result = await getAllProducts();

    expect(result).toHaveLength(2);
    // 2026-04-12 (alpha) is newer than 2026-01-01 (zeta) — descending order
    expect(result[0].slug).toBe('alpha-product');
    expect(result[1].slug).toBe('zeta-product');
  });

  it('unit_products_by_slug_found: getProductBySlug returns matching LoadedEntry with meta + Component', async () => {
    mockLoadContent.mockResolvedValue([productAlphaNewer, productZetaOlder]);
    const { getProductBySlug } = await importProducts();

    const result = await getProductBySlug('zeta-product');

    expect(result).not.toBeNull();
    expect(result!.meta.id).toBe('prod-zeta');
    expect(result!.slug).toBe('zeta-product');
    expect(result!.Component).toBe(mockComponent);
  });

  it('unit_products_by_slug_not_found: returns null for unknown slug', async () => {
    mockLoadContent.mockResolvedValue([productAlphaNewer]);
    const { getProductBySlug } = await importProducts();

    const result = await getProductBySlug('nonexistent-slug');

    expect(result).toBeNull();
  });

  it('unit_products_get_all_empty: returns [] when manifest is empty', async () => {
    mockLoadContent.mockResolvedValue([]);
    const { getAllProducts } = await importProducts();

    const result = await getAllProducts();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('products loader (infrastructure)', () => {
  async function importProducts() {
    return import('../products');
  }

  it('infra_product_loader_caches: second call uses cached result (loadContent invoked once)', async () => {
    mockLoadContent.mockResolvedValue([productAlphaNewer]);
    const { getAllProducts } = await importProducts();

    await getAllProducts();
    await getAllProducts();
    await getAllProducts();

    expect(mockLoadContent).toHaveBeenCalledTimes(1);
  });

  it('infra_product_cache_frozen: returned array is Object.frozen (paid-forward cleanup from build-in-public-docs-1.2)', async () => {
    mockLoadContent.mockResolvedValue([productAlphaNewer, productZetaOlder]);
    const { getAllProducts } = await importProducts();

    const result = await getAllProducts();

    expect(Object.isFrozen(result)).toBe(true);
  });
});

describe('products loader (contract)', () => {
  async function importProducts() {
    return import('../products');
  }

  it('contract_loader_loaded_entry_shape: each entry has shape { meta, slug, Component }', async () => {
    mockLoadContent.mockResolvedValue([productAlphaNewer]);
    const { getAllProducts } = await importProducts();

    const result = await getAllProducts();

    expect(result[0]).toHaveProperty('meta');
    expect(result[0]).toHaveProperty('slug');
    expect(result[0]).toHaveProperty('Component');
    expect(typeof result[0].slug).toBe('string');
    expect(typeof result[0].Component).toBe('function');
    // meta carries the full Product shape
    expect(result[0].meta).toHaveProperty('id');
    expect(result[0].meta).toHaveProperty('priceCents');
    expect(result[0].meta).toHaveProperty('stripePriceId');
  });

  it('contract_get_by_slug_nullable_shape: getProductBySlug return type is LoadedEntry<Product> | null (never undefined, never throws on missing)', async () => {
    mockLoadContent.mockResolvedValue([productAlphaNewer]);
    const { getProductBySlug } = await importProducts();

    const found = await getProductBySlug('alpha-product');
    expect(found).not.toBeNull();
    expect(found).not.toBeUndefined();

    const missing = await getProductBySlug('nonexistent');
    expect(missing).toBeNull();
    expect(missing).not.toBeUndefined();
  });
});

describe('products loader (edge cases)', () => {
  async function importProducts() {
    return import('../products');
  }

  it('edge_state_loader_empty_manifest: getAllProducts returns [] when manifest has no entries', async () => {
    mockLoadContent.mockResolvedValue([]);
    const { getAllProducts } = await importProducts();

    const result = await getAllProducts();

    expect(result).toEqual([]);
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });
});

describe('products loader (error recovery)', () => {
  async function importProducts() {
    return import('../products');
  }

  it('err_loader_malformed_meta: throws contextful Error if loadContent rejects on Zod failure', async () => {
    const malformedError = new Error(
      'Invalid metadata in workflow-templates.mdx: priceCents must be positive',
    );
    mockLoadContent.mockRejectedValue(malformedError);
    const { getAllProducts } = await importProducts();

    await expect(getAllProducts()).rejects.toThrow(/Invalid metadata/);
  });

  it('err_loader_missing_default_export: throws Error referencing missing default export when loadContent surfaces it', async () => {
    const missingDefault = new Error(
      'Missing default export in workflow-templates.mdx: MDX files must export a default component',
    );
    mockLoadContent.mockRejectedValue(missingDefault);
    const { getAllProducts } = await importProducts();

    await expect(getAllProducts()).rejects.toThrow(/Missing default export/);
  });

  it('err_loader_missing_meta_export: throws Error referencing missing meta export when loadContent surfaces it', async () => {
    const missingMeta = new Error(
      'Missing meta export in workflow-templates.mdx: MDX files must export a meta object',
    );
    mockLoadContent.mockRejectedValue(missingMeta);
    const { getAllProducts } = await importProducts();

    await expect(getAllProducts()).rejects.toThrow(/Missing meta export/);
  });
});

describe('products loader (data integrity)', () => {
  async function importProducts() {
    return import('../products');
  }

  it('data_consistency_loader_sort_order: result[0].publishedAt >= result[1].publishedAt (DESC)', async () => {
    mockLoadContent.mockResolvedValue([productZetaOlder, productAlphaNewer]);
    const { getAllProducts } = await importProducts();

    const result = await getAllProducts();

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].meta.publishedAt >= result[i + 1].meta.publishedAt).toBe(true);
    }
  });
});

// ── Integration: real seed MDX + real schema (loader still mocked for these) ─

describe('products integration (real seeds + real ProductSchema)', () => {
  it('integration_product_manifest_contains_seeds: productManifest exports both seeds with default + meta', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/products/manifest')>(
      '@/content/products/manifest',
    );
    const { productManifest } = manifestModule;

    expect(Object.keys(productManifest)).toContain('workflow-templates.mdx');
    expect(Object.keys(productManifest)).toContain('discovery-toolkit.mdx');
    expect(Object.keys(productManifest).length).toBeGreaterThanOrEqual(2);

    for (const filename of Object.keys(productManifest)) {
      const mod = productManifest[filename];
      expect(mod).toHaveProperty('default');
      expect(mod).toHaveProperty('meta');
    }
  });

  it('integration_product_seeds_pass_validator: every seed meta passes ProductSchema.safeParse', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/products/manifest')>(
      '@/content/products/manifest',
    );
    const schemaModule = await vi.importActual<typeof import('@/content/schemas')>(
      '@/content/schemas',
    );
    const { productManifest } = manifestModule;
    const { ProductSchema } = schemaModule;

    for (const [filename, mod] of Object.entries(productManifest)) {
      const result = ProductSchema.safeParse(mod.meta);
      if (!result.success) {
        throw new Error(
          `Seed ${filename} failed ProductSchema: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
      expect(result.success).toBe(true);
    }
  });

  it('data_consistency_seed_slug_matches_filename: each seed meta.slug === filename without .mdx extension', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/products/manifest')>(
      '@/content/products/manifest',
    );
    const { productManifest } = manifestModule;

    for (const [filename, mod] of Object.entries(productManifest)) {
      const expectedSlug = filename.replace(/\.mdx$/, '');
      const meta = mod.meta as { slug?: string };
      expect(meta.slug).toBe(expectedSlug);
    }
  });

  it('integration_loader_returns_two_seeds: real loadContent + real manifest returns 2 entries with expected slugs', async () => {
    const loaderModule = await vi.importActual<typeof import('../loader')>('../loader');
    const manifestModule = await vi.importActual<typeof import('@/content/products/manifest')>(
      '@/content/products/manifest',
    );
    const schemaModule = await vi.importActual<typeof import('@/content/schemas')>(
      '@/content/schemas',
    );
    const { loadContent: realLoadContent } = loaderModule;
    const { productManifest } = manifestModule;
    const { ProductSchema } = schemaModule;

    const entries = await realLoadContent<Product>({
      directory: 'src/content/products',
      schema: ProductSchema,
      readdirFn: async () => Object.keys(productManifest),
      importFn: async (filePath: string) => {
        const filename = path.basename(filePath);
        const mod = productManifest[filename];
        if (!mod) throw new Error(`Unknown product file: ${filename}`);
        return mod;
      },
    });

    expect(entries).toHaveLength(2);
    const slugs = entries.map((e) => e.slug).sort();
    expect(slugs).toEqual(['discovery-toolkit', 'workflow-templates']);
  });
});
