import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { getAllEpisodes } from '@/lib/content/episodes';
import { CONTENT_PILLAR_QUESTIONS, CONTENT_TIER_LABELS } from '@/content/schemas';

export const metadata: Metadata = {
  title: 'Episodes',
  description:
    'The full Fabled10X episode archive — flagship series, playbooks, shorts, and livestreams.',
};

export default async function EpisodesIndex() {
  const episodes = await getAllEpisodes();

  return (
    <Container as="section" className="py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Episodes</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every episode from the channel, with full show notes, source materials,
        and outbound crosslinks to structured knowledge entries in The Large
        Language Library.
      </p>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {episodes.map((episode) => (
          <li key={episode.meta.id}>
            <Link
              href={`/episodes/${episode.slug}`}
              className="block rounded-lg border border-mist p-6 hover:border-accent"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {CONTENT_TIER_LABELS[episode.meta.tier]}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">
                {episode.meta.title}
              </h2>
              <p className="mt-3 text-sm text-muted">{episode.meta.summary}</p>
              <p className="mt-4 text-xs text-accent">
                {CONTENT_PILLAR_QUESTIONS[episode.meta.pillar]}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
