import { ImageResponse } from 'next/og';
import { OG_SIZE, OG_CONTENT_TYPE, loadOgFonts, buildOgComposition } from '@/lib/og/og-image';

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;
export const alt = 'Fabled 10X — One person. An agent team. Full SaaS delivery.';

export default async function Image() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    buildOgComposition({
      tag: 'The Fabled 10X Developer',
      titleLines: ['Build the whole', 'thing alone'],
      accent: '?',
      fontSize: 88,
    }),
    { ...size, fonts },
  );
}
