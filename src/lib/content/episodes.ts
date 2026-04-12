import type { Episode } from '@/content/schemas';
import { EpisodeSchema } from '@/content/schemas';
import { loadContent, type LoadedEntry } from './loader';

let cache: LoadedEntry<Episode>[] | null = null;

export async function getAllEpisodes(): Promise<LoadedEntry<Episode>[]> {
  if (!cache) {
    const entries = await loadContent({
      directory: 'src/content/episodes',
      schema: EpisodeSchema,
    });
    cache = entries.sort((a, b) => {
      const dateA = a.meta.publishedAt ?? '';
      const dateB = b.meta.publishedAt ?? '';
      return dateB.localeCompare(dateA);
    });
  }
  return cache;
}

export async function getEpisodeBySlug(
  slug: string,
): Promise<LoadedEntry<Episode> | null> {
  const episodes = await getAllEpisodes();
  return episodes.find((e) => e.slug === slug) ?? null;
}

export async function getLatestEpisode(): Promise<LoadedEntry<Episode> | null> {
  const episodes = await getAllEpisodes();
  return episodes[0] ?? null;
}
