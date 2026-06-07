import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { DropAccent, Marble, Section } from '@/components/brand';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { getAllEpisodes, getEpisodeBySlug } from '@/lib/content/episodes';
import { toRoman } from '@/lib/format/roman';

export const dynamicParams = false;

export async function generateStaticParams() {
  const episodes = await getAllEpisodes();
  return episodes.map((episode) => ({ slug: episode.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getEpisodeBySlug(slug);
  if (!entry) return {};
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      type: 'article',
      publishedTime: meta.publishedAt,
      images: meta.thumbnailUrl ? [meta.thumbnailUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.summary,
    },
  };
}

export default async function EpisodeDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getEpisodeBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const { meta, Component } = entry;
  const actRoman = toRoman(meta.act);
  const epRoman = toRoman(meta.episodeNumber);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: meta.title,
    description: meta.summary,
    datePublished: meta.publishedAt,
    contentUrl: meta.youtubeUrl,
    thumbnailUrl: meta.thumbnailUrl,
  };

  return (
    <Marble>
      <Section rhythm="lg">
        <Container as="article" width="prose">
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
          />
          <span className="label">
            {meta.series} · Act {actRoman} · Episode {epRoman}
          </span>
          <h1 className="display-1 mt-(--space-3)">
            <DropAccent glyph="?" size="large">
              {meta.title}
            </DropAccent>
          </h1>
          <p className="body-1 mt-(--space-5) text-(--color-muted)">
            {meta.summary}
          </p>

          {meta.youtubeUrl && (
            <div className="mt-(--space-7)">
              <Link
                href={meta.youtubeUrl}
                className="label inline-block border-b border-(--color-oxblood) pb-(--space-1) text-(--color-oxblood)"
              >
                Watch on YouTube
              </Link>
            </div>
          )}

          <div className="build-log-prose mt-(--space-7) border-t border-(--edge-color) pt-(--space-7)">
            <Component />
          </div>

          {meta.sourceMaterialIds.length > 0 && (
            <section className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)">
              <h2 className="display-3">Source materials</h2>
              <ul className="body-2 mt-(--space-4) text-(--color-muted)">
                {meta.sourceMaterialIds.map((id) => (
                  <li key={id}>{id}</li>
                ))}
              </ul>
              <p className="body-3 mt-(--space-4) text-(--color-muted)">
                Full source-material rendering ships in a future update.
              </p>
            </section>
          )}

          {meta.lllEntryUrls.length > 0 && (
            <LllCrosslinks
              urls={meta.lllEntryUrls}
              className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)"
            />
          )}

          <section className="mt-(--space-8) border-t border-(--edge-color) pt-(--space-5)">
            <span className="label">Stay in the loop</span>
            <h2 className="display-3 mt-(--space-3)">New episodes, no spam.</h2>
            <div className="mt-(--space-5)">
              <EmailCapture source={`episode-${meta.slug}`} />
            </div>
          </section>
        </Container>
      </Section>
    </Marble>
  );
}
