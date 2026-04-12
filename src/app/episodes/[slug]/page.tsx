import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { getAllEpisodes, getEpisodeBySlug } from '@/lib/content/episodes';
import { CONTENT_PILLAR_QUESTIONS, CONTENT_TIER_LABELS } from '@/content/schemas';

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
  return {
    title: entry.meta.title,
    description: entry.meta.summary,
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

  return (
    <Container as="article" className="py-16">
      <p className="text-xs uppercase tracking-wide text-muted">
        {CONTENT_TIER_LABELS[meta.tier]} · {meta.series}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
        {meta.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{meta.summary}</p>
      <p className="mt-4 text-sm text-accent">
        {CONTENT_PILLAR_QUESTIONS[meta.pillar]}
      </p>

      {meta.youtubeUrl && (
        <div className="mt-8">
          <Link
            href={meta.youtubeUrl}
            className="inline-block rounded-md bg-accent px-5 py-3 text-sm font-medium text-parchment hover:opacity-90"
          >
            Watch on YouTube
          </Link>
        </div>
      )}

      <div className="mt-12 prose-style">
        <Component />
      </div>

      {meta.sourceMaterialIds.length > 0 && (
        <section className="mt-12 rounded-lg border border-mist p-6">
          <h2 className="font-display text-xl font-semibold">Source materials</h2>
          <ul className="mt-4 space-y-2 text-sm text-muted">
            {meta.sourceMaterialIds.map((id) => (
              <li key={id}>{id}</li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            Full source-material rendering ships in a future update.
          </p>
        </section>
      )}

      {meta.lllEntryUrls.length > 0 && (
        <LllCrosslinks urls={meta.lllEntryUrls} className="mt-12" />
      )}

      <section className="mt-16 border-t border-mist pt-12">
        <p className="text-sm uppercase tracking-wide text-muted">Stay in the loop</p>
        <h2 className="mt-3 font-display text-2xl font-semibold">
          New episodes, no spam.
        </h2>
        <div className="mt-6 max-w-md">
          <EmailCapture source={`episode-${meta.slug}`} />
        </div>
      </section>
    </Container>
  );
}
