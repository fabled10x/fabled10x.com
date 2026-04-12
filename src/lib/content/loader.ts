import { readdir } from 'node:fs/promises';
import path from 'node:path';
import type { ComponentType } from 'react';
import type { ZodType } from 'zod';

export interface LoadedEntry<T> {
  meta: T;
  slug: string;
  Component: ComponentType;
}

export interface LoadContentOptions<T> {
  directory: string;
  schema: ZodType<T>;
  importFn?: (filePath: string) => Promise<{ default: ComponentType; meta: unknown }>;
  readdirFn?: (dirPath: string) => Promise<string[]>;
}

export async function loadContent<T>(
  options: LoadContentOptions<T>,
): Promise<LoadedEntry<T>[]> {
  const dir = path.resolve(process.cwd(), options.directory);
  const doReaddir = options.readdirFn ?? (async (p: string) => (await readdir(p)).map(String));
  const files = await doReaddir(dir);
  const mdxFiles = files.filter((f) => f.endsWith('.mdx'));

  if (mdxFiles.length === 0) return [];

  const doImport =
    options.importFn ??
    ((filePath: string) => import(filePath) as Promise<{ default: ComponentType; meta: unknown }>);

  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(dir, file);
      const mod = await doImport(filePath);

      if (!mod.default) {
        throw new Error(
          `Missing default export in ${file}: MDX files must export a default component`,
        );
      }

      if (mod.meta === undefined || mod.meta === null) {
        throw new Error(
          `Missing meta export in ${file}: MDX files must export a meta object`,
        );
      }

      const result = options.schema.safeParse(mod.meta);
      if (!result.success) {
        throw new Error(
          `Invalid metadata in ${file}: ${result.error.message}`,
        );
      }

      return {
        meta: result.data as T,
        slug,
        Component: mod.default,
      };
    }),
  );
}
