import path from 'node:path';
import type { Product } from '@/content/schemas';
import { ProductSchema } from '@/content/schemas';
import { productManifest } from '@/content/products/manifest';
import { loadContent, type LoadedEntry } from './loader';

let cache: ReadonlyArray<LoadedEntry<Product>> | null = null;

export async function getAllProducts(): Promise<ReadonlyArray<LoadedEntry<Product>>> {
  if (!cache) {
    const entries = await loadContent<Product>({
      directory: 'src/content/products',
      schema: ProductSchema,
      readdirFn: async () => Object.keys(productManifest),
      importFn: async (filePath: string) => {
        const filename = path.basename(filePath);
        const mod = productManifest[filename];
        if (!mod) {
          throw new Error(`Unknown product file: ${filename}`);
        }
        return mod;
      },
    });
    cache = Object.freeze(
      entries.sort((a, b) => b.meta.publishedAt.localeCompare(a.meta.publishedAt)),
    );
  }
  return cache;
}

export async function getProductBySlug(
  slug: string,
): Promise<LoadedEntry<Product> | null> {
  const products = await getAllProducts();
  return products.find((p) => p.slug === slug) ?? null;
}
