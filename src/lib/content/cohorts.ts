import path from 'node:path';
import type { Cohort } from '@/content/schemas';
import { CohortSchema } from '@/content/schemas';
import { cohortManifest } from '@/content/cohorts/manifest';
import { loadContent, type LoadedEntry } from './loader';

let cache: ReadonlyArray<LoadedEntry<Cohort>> | null = null;

export async function getAllCohorts(): Promise<ReadonlyArray<LoadedEntry<Cohort>>> {
  if (!cache) {
    const entries = await loadContent<Cohort>({
      directory: 'src/content/cohorts',
      schema: CohortSchema,
      readdirFn: async () => Object.keys(cohortManifest),
      importFn: async (filePath: string) => {
        const filename = path.basename(filePath);
        const mod = cohortManifest[filename];
        if (!mod) {
          throw new Error(`Unknown cohort file: ${filename}`);
        }
        return mod;
      },
    });
    cache = Object.freeze(
      entries.sort((a, b) => a.meta.startDate.localeCompare(b.meta.startDate)),
    );
  }
  return cache;
}

export async function getCohortBySlug(
  slug: string,
): Promise<LoadedEntry<Cohort> | null> {
  const cohorts = await getAllCohorts();
  return cohorts.find((c) => c.slug === slug) ?? null;
}

export async function getCohortBuckets(): Promise<{
  upcoming: ReadonlyArray<LoadedEntry<Cohort>>;
  archived: ReadonlyArray<LoadedEntry<Cohort>>;
}> {
  const all = await getAllCohorts();
  const upcoming = all.filter(
    (e) =>
      e.meta.status === 'announced' ||
      e.meta.status === 'open' ||
      e.meta.status === 'closed',
  );
  const archived = all.filter(
    (e) => e.meta.status === 'enrolled' || e.meta.status === 'shipped',
  );
  return { upcoming, archived };
}
