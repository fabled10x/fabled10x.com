import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { PhaseNav } from '@/components/build-log/PhaseNav';
import { getAllJobs, getJobBySlug } from '@/lib/build-log/jobs';

export const dynamicParams = false;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  return jobs.map((j) => ({ slug: j.slug }));
}

function jobDescription(job: { context: string; title: string }): string {
  const firstLine = job.context.split('\n')[0] ?? '';
  return firstLine.slice(0, 160) || job.title;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  const description = jobDescription(job);
  const url = `/build-log/jobs/${slug}`;
  return {
    title: `${job.title} · Build log`,
    description,
    openGraph: {
      title: job.title,
      description,
      type: 'article',
      url,
    },
    twitter: {
      card: 'summary_large_image',
      title: job.title,
      description,
    },
    alternates: { canonical: url },
  };
}

export default async function JobPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) {
    notFound();
    return;
  }

  const description = jobDescription(job);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    headline: job.title,
    description,
    url: `https://fabled10x.com/build-log/jobs/${slug}`,
    author: {
      '@type': 'Organization',
      name: 'Fabled10X',
      url: 'https://fabled10x.com',
    },
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'Build log',
      url: 'https://fabled10x.com/build-log',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container as="main" className="py-12">
        <nav className="mb-6 text-sm">
          <Link href="/build-log" className="text-link hover:text-accent">
            ← Back to build log
          </Link>
        </nav>
        <header className="mb-6">
          <h1 className="text-3xl font-display">{job.title}</h1>
          {job.alias && (
            <p className="text-sm text-muted mt-2">
              Alias: <code className="text-accent">{job.alias}</code>
            </p>
          )}
        </header>
        <PhaseNav jobSlug={job.slug} phases={job.phases} />
        <MarkdownDocument body={job.readmeBody} />
      </Container>
    </>
  );
}
