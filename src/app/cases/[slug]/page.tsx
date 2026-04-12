import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { LllCrosslinks } from '@/components/crosslinks/LllCrosslinks';
import { getAllCases, getCaseBySlug } from '@/lib/content/cases';
import { getAllEpisodes } from '@/lib/content/episodes';
import { CASE_STATUS_LABELS } from '@/content/schemas';

export const dynamicParams = false;

export async function generateStaticParams() {
  const cases = await getAllCases();
  return cases.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getCaseBySlug(slug);
  if (!entry) return {};
  const { meta } = entry;
  return {
    title: meta.title,
    description: meta.summary,
    openGraph: {
      title: meta.title,
      description: meta.summary,
      images: meta.heroImageUrl ? [meta.heroImageUrl] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title: meta.title,
      description: meta.summary,
    },
  };
}

export default async function CaseDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const entry = await getCaseBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const { meta, Component } = entry;
  const allEpisodes = await getAllEpisodes();
  const relatedEpisodes = allEpisodes.filter((ep) =>
    meta.relatedEpisodeIds.includes(ep.meta.id),
  );

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: meta.title,
    description: meta.summary,
    creator: {
      '@type': 'Organization',
      name: 'Fabled10X',
      url: 'https://fabled10x.com',
    },
    about: meta.client,
  };

  return (
    <Container as="article" className="py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-xs uppercase tracking-wide text-muted">
        {CASE_STATUS_LABELS[meta.status]} · {meta.client}
      </p>
      <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight">
        {meta.title}
      </h1>
      <p className="mt-4 max-w-2xl text-muted">{meta.summary}</p>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">The problem</h2>
        <p className="mt-3 text-muted">{meta.problem}</p>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Deliverables</h2>
        <ul className="mt-3 list-disc pl-6 space-y-1 text-muted">
          {meta.deliverables.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="mt-12">
        <h2 className="font-display text-2xl font-semibold">Outcome</h2>
        <p className="mt-3 text-muted">{meta.outcome}</p>
      </section>

      <div className="mt-12 prose-style">
        <Component />
      </div>

      {relatedEpisodes.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-semibold">Episodes</h2>
          <ul className="mt-4 space-y-3">
            {relatedEpisodes.map((ep) => (
              <li key={ep.meta.id}>
                <Link
                  href={`/episodes/${ep.slug}`}
                  className="text-link hover:underline underline-offset-2"
                >
                  {ep.meta.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {meta.lllEntryUrls.length > 0 && (
        <LllCrosslinks urls={meta.lllEntryUrls} className="mt-12" />
      )}

      <section className="mt-16 border-t border-mist pt-12">
        <div className="max-w-md">
          <EmailCapture source={`case-${meta.slug}`} />
        </div>
      </section>
    </Container>
  );
}
