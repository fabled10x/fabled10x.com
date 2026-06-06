import path from 'node:path';
import type { Case } from '@/content/schemas';
import { CaseSchema } from '@/content/schemas';
import { caseManifest } from '@/content/cases/manifest';
import { loadContent, type LoadedEntry } from './loader';

let cache: LoadedEntry<Case>[] | null = null;

export async function getAllCases(): Promise<LoadedEntry<Case>[]> {
  if (!cache) {
    const entries = await loadContent({
      directory: 'src/content/cases',
      schema: CaseSchema,
      readdirFn: async () => Object.keys(caseManifest),
      importFn: async (filePath: string) => {
        const filename = path.basename(filePath);
        const mod = caseManifest[filename];
        if (!mod) {
          throw new Error(`Unknown case file: ${filename}`);
        }
        return mod;
      },
    });
    cache = entries.sort((a, b) => a.meta.title.localeCompare(b.meta.title));
  }
  return cache;
}

export async function getCaseBySlug(
  slug: string,
): Promise<LoadedEntry<Case> | null> {
  const cases = await getAllCases();
  return cases.find((c) => c.slug === slug) ?? null;
}
