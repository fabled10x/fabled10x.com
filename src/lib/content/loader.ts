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
  importFn: (filePath: string) => Promise<{ default: ComponentType; meta: unknown }>;
  readdirFn: (dirPath: string) => Promise<string[]>;
}

export async function loadContent<T>(
  options: LoadContentOptions<T>,
): Promise<LoadedEntry<T>[]> {
  const files = await options.readdirFn(options.directory);
  const mdxFiles = files.filter((f) => f.endsWith('.mdx'));

  if (mdxFiles.length === 0) return [];

  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = file.replace(/\.mdx$/, '');
      const filePath = path.join(options.directory, file);
      const mod = await options.importFn(filePath);

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
