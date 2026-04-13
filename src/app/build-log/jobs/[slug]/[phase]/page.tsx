import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import { PhaseNav } from '@/components/build-log/PhaseNav';
import { getAllJobs, getJobBySlug, getJobPhase } from '@/lib/build-log/jobs';

export const dynamicParams = false;

export async function generateStaticParams() {
  const jobs = await getAllJobs();
  const tuples: { slug: string; phase: string }[] = [];
  for (const job of jobs) {
    for (const phase of job.phases) {
      tuples.push({ slug: job.slug, phase: phase.slug });
    }
  }
  return tuples;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; phase: string }>;
}): Promise<Metadata> {
  const { slug, phase } = await params;
  const job = await getJobBySlug(slug);
  const ph = job?.phases.find((p) => p.slug === phase);
  if (!job || !ph) return {};
  const title =
    ph.header.title && ph.header.phaseNumber !== undefined
      ? `Phase ${ph.header.phaseNumber}: ${ph.header.title} · ${job.title}`
      : `${ph.slug} · ${job.title}`;
  return {
    title,
    description: ph.header.totalSize ?? `Phase document for ${job.title}.`,
  };
}

export default async function PhasePage({
  params,
}: {
  params: Promise<{ slug: string; phase: string }>;
}) {
  const { slug, phase } = await params;
  const [job, ph] = await Promise.all([
    getJobBySlug(slug),
    getJobPhase(slug, phase),
  ]);
  if (!job || !ph) {
    notFound();
    return;
  }

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm">
        <Link href="/build-log" className="text-link hover:text-accent">
          ← Build log
        </Link>
        {' · '}
        <Link
          href={`/build-log/jobs/${job.slug}`}
          className="text-link hover:text-accent"
        >
          {job.title}
        </Link>
      </nav>
      <header className="mb-6">
        <h1 className="text-3xl font-display">
          {ph.header.title && ph.header.phaseNumber !== undefined
            ? `Phase ${ph.header.phaseNumber}: ${ph.header.title}`
            : ph.slug}
        </h1>
        {(ph.header.totalSize || ph.header.prerequisites) && (
          <dl className="mt-3 text-sm text-muted space-y-1">
            {ph.header.totalSize && (
              <div>
                <dt className="inline font-medium">Total size: </dt>
                <dd className="inline">{ph.header.totalSize}</dd>
              </div>
            )}
            {ph.header.prerequisites && (
              <div>
                <dt className="inline font-medium">Prerequisites: </dt>
                <dd className="inline">{ph.header.prerequisites}</dd>
              </div>
            )}
          </dl>
        )}
      </header>
      <PhaseNav
        jobSlug={job.slug}
        phases={job.phases}
        activePhaseSlug={ph.slug}
      />
      <MarkdownDocument body={ph.body} />
    </Container>
  );
}
