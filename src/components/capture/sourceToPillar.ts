import type { ContentPillar } from '@/content/schemas/content-pillar';

export function sourceToPillar(source: string): ContentPillar {
  if (source.startsWith('episode-')) return 'delivery';
  if (source.startsWith('case-')) return 'business';
  if (source === 'homepage-hero') return 'delivery';
  return 'delivery';
}
