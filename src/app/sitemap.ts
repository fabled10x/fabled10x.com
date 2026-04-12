import type { MetadataRoute } from 'next';
import { getAllEpisodes } from '@/lib/content/episodes';
import { getAllCases } from '@/lib/content/cases';

const BASE_URL = 'https://fabled10x.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [episodes, cases] = await Promise.all([
    getAllEpisodes(),
    getAllCases(),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/`, changeFrequency: 'weekly', priority: 1.0 },
    { url: `${BASE_URL}/episodes`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${BASE_URL}/cases`, changeFrequency: 'monthly', priority: 0.9 },
    { url: `${BASE_URL}/about`, changeFrequency: 'yearly', priority: 0.5 },
  ];

  const episodeRoutes: MetadataRoute.Sitemap = episodes.map((ep) => ({
    url: `${BASE_URL}/episodes/${ep.slug}`,
    ...(ep.meta.publishedAt
      ? { lastModified: new Date(ep.meta.publishedAt) }
      : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  const caseRoutes: MetadataRoute.Sitemap = cases.map((c) => ({
    url: `${BASE_URL}/cases/${c.slug}`,
    ...(c.meta.shippedAt
      ? { lastModified: new Date(c.meta.shippedAt) }
      : {}),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...staticRoutes, ...episodeRoutes, ...caseRoutes];
}
