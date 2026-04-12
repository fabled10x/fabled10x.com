import type { Case } from '@/content/schemas';
import { CaseSchema } from '@/content/schemas';
import { loadContent, type LoadedEntry } from './loader';

let cache: LoadedEntry<Case>[] | null = null;

export async function getAllCases(): Promise<LoadedEntry<Case>[]> {
  if (!cache) {
    const entries = await loadContent({
      directory: 'src/content/cases',
      schema: CaseSchema,
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
