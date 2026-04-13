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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJobBySlug(slug);
  if (!job) return {};
  const firstLine = job.context.split('\n')[0] ?? '';
  return {
    title: `${job.title} · Build log`,
    description: firstLine.slice(0, 160) || job.title,
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

  return (
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
  );
}
