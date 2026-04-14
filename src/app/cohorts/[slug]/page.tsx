import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Container } from '@/components/site/Container';
import { getAllCohorts, getCohortBySlug } from '@/lib/content/cohorts';
import { CohortDetailHero } from '@/components/cohorts/CohortDetailHero';

type RouteParams = {
  params: Promise<{ slug: string }>;
};

export const dynamicParams = false;

export async function generateStaticParams() {
  const all = await getAllCohorts();
  return all.map((entry) => ({ slug: entry.meta.slug }));
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const entry = await getCohortBySlug(slug);
  if (!entry) return { title: 'Cohort not found' };
  return {
    title: entry.meta.title,
    description: entry.meta.summary,
    openGraph: {
      title: entry.meta.title,
      description: entry.meta.summary,
      type: 'website',
    },
  };
}

export default async function CohortDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  const entry = await getCohortBySlug(slug);
  if (!entry) {
    notFound();
    return;
  }

  const { meta, default: MdxBody } = entry;

  return (
    <Container as="main" className="py-16">
      <CohortDetailHero cohort={meta} />

      <article className="prose mt-16 max-w-2xl">
        <MdxBody />
      </article>

      <section className="mt-16" aria-labelledby="cta-heading">
        <h2 id="cta-heading" className="font-display text-2xl font-semibold">
          Next step
        </h2>
        <div className="mt-6 rounded-md border border-mist p-6 text-sm text-muted">
          {meta.status === 'announced' ? (
            <p>
              Waitlist form coming online soon. This cohort&apos;s applications
              open in Phase 2 of the build.
            </p>
          ) : meta.status === 'open' ? (
            <p>
              Application form coming online in Phase 3. Signed-in applicants
              will fill out background, goals, and commitment here.
            </p>
          ) : meta.status === 'closed' ? (
            <p>Applications are closed. Decisions go out within two weeks.</p>
          ) : meta.status === 'enrolled' ? (
            <p>This cohort is full. Join the waitlist for the next run.</p>
          ) : (
            <p>This cohort has shipped.</p>
          )}
        </div>
      </section>
    </Container>
  );
}
