import type { Metadata } from 'next';
import type { Job, JobRollupEntry } from '@/content/schemas';
import { Container } from '@/components/site/Container';
import { JobCard } from '@/components/build-log/JobCard';
import { getAllJobs } from '@/lib/build-log/jobs';
import { getJobsRollup } from '@/lib/build-log/pipeline-state';

export const dynamic = 'force-dynamic';

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

interface JobWithRollup {
  job: Job;
  rollup: JobRollupEntry;
  excerpt: string;
}

interface JobGroup {
  id: string;
  heading: string;
  blurb: string;
  items: JobWithRollup[];
}

function groupJobs(jobs: readonly Job[], rollup: readonly JobRollupEntry[]): JobGroup[] {
  const rollupBySlug = new Map(rollup.map((r) => [r.slug, r]));
  const withRollup: JobWithRollup[] = jobs
    .map((job) => {
      const r = rollupBySlug.get(job.slug);
      if (!r) return null;
      return { job, rollup: r, excerpt: firstParagraph(job.context) };
    })
    .filter((x): x is JobWithRollup => x !== null);

  const inProgress = withRollup.filter((x) => x.rollup.status === 'in-progress');
  const planned = withRollup.filter(
    (x) => x.rollup.status === 'planned' || x.rollup.status === 'unknown',
  );
  const complete = withRollup.filter((x) => x.rollup.status === 'complete');

  return [
    {
      id: 'in-progress',
      heading: 'In progress',
      blurb: 'Jobs the TDD pipeline is actively shipping features for.',
      items: inProgress,
    },
    {
      id: 'planned',
      heading: 'Planned',
      blurb: 'Jobs with a plan but no shipped features yet.',
      items: planned,
    },
    {
      id: 'complete',
      heading: 'Complete',
      blurb: 'Jobs whose features have all shipped to main.',
      items: complete,
    },
  ].filter((g) => g.items.length > 0);
}

export default async function BuildLogIndexPage() {
  const [jobs, rollup] = await Promise.all([getAllJobs(), getJobsRollup()]);
  const groups = groupJobs(jobs, rollup);

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

        {groups.length === 0 ? (
          <p className="text-muted italic">
            No jobs have been planned yet. Initializing…
          </p>
        ) : (
          groups.map((group) => (
            <section
              key={group.id}
              aria-labelledby={`group-${group.id}`}
              className="mb-12 last:mb-0"
            >
              <header className="mb-5 border-b border-mist pb-2 flex items-baseline justify-between gap-4">
                <h2 id={`group-${group.id}`} className="text-2xl font-display">
                  {group.heading}
                </h2>
                <span className="text-xs text-muted tabular-nums">
                  {group.items.length} {group.items.length === 1 ? 'job' : 'jobs'}
                </span>
              </header>
              <p className="text-sm text-muted mb-5">{group.blurb}</p>
              <div className="grid gap-6 md:grid-cols-2">
                {group.items.map(({ job, rollup, excerpt }) => (
                  <JobCard key={job.slug} rollup={rollup} excerpt={excerpt} />
                ))}
              </div>
            </section>
          ))
        )}
      </Container>
    </>
  );
}
