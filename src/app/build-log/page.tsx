import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { JobCard } from '@/components/build-log/JobCard';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getJobsRollup } from '@/lib/build-log/pipeline-state';

export const metadata: Metadata = {
  title: 'Build log',
  description:
    'A live view of the agent-driven build process behind fabled10x.com — every job plan, every phase, every section the TDD pipeline has shipped or is about to ship.',
  openGraph: {
    title: 'Build log · fabled10x',
    description:
      'The agent-driven build process behind fabled10x.com, rendered as published content.',
    type: 'website',
    url: '/build-log',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Build log · fabled10x',
    description:
      'The agent-driven build process behind fabled10x.com, rendered as published content.',
  },
  alternates: {
    canonical: '/build-log',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Build log',
  description:
    'The agent-driven build process behind fabled10x.com, rendered as published content.',
  url: 'https://fabled10x.com/build-log',
  isPartOf: {
    '@type': 'WebSite',
    name: 'fabled10x',
    url: 'https://fabled10x.com',
  },
};

function firstParagraph(context: string): string {
  const para = context.split(/\n\s*\n/)[0] ?? '';
  return para.replace(/\s+/g, ' ').trim();
}

export default async function BuildLogIndexPage() {
  const [jobs, rollup] = await Promise.all([getAllJobs(), getJobsRollup()]);

  const rollupBySlug = new Map(rollup.map((r) => [r.slug, r]));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container as="main" className="py-12">
        <header className="mb-10">
          <h1 className="text-4xl font-display mb-3">Build log</h1>
          <p className="text-lg text-muted max-w-2xl">
            The agent-driven build process behind fabled10x.com, rendered as
            published content. Every job has a plan, every plan has phases,
            every phase has features the TDD pipeline ships through.
          </p>
          <p className="mt-4">
            <a href="/build-log/status" className="text-link hover:text-accent">
              See live pipeline status →
            </a>
          </p>
        </header>

        {jobs.length === 0 ? (
          <p className="text-muted italic">
            No jobs have been planned yet. Initializing…
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {jobs.map((job) => {
              const r = rollupBySlug.get(job.slug);
              if (!r) return null;
              return (
                <JobCard
                  key={job.slug}
                  rollup={r}
                  excerpt={firstParagraph(job.context)}
                />
              );
            })}
          </div>
        )}
      </Container>
    </>
  );
}
