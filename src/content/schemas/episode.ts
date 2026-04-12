import type { ContentPillar } from './content-pillar';
import type { ContentTier } from './content-tier';

export interface Episode {
  id: string;
  slug: string;
  title: string;
  series: string;
  season?: number;
  act?: number;
  episodeNumber: number;
  tier: ContentTier;
  pillar: ContentPillar;
  summary: string;
  sourceMaterialIds: string[];
  lllEntryUrls: string[];
  durationMinutes?: number;
  publishedAt?: string;
  youtubeUrl?: string;
  thumbnailUrl?: string;
  transcriptPath?: string;
}
