import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';
import { getAllCases } from '@/lib/content/cases';
import { CASE_STATUS_LABELS } from '@/content/schemas';

export const metadata: Metadata = {
  title: 'Case Studies',
  description:
    'Full documented project histories of Fabled10X client work — the proof layer behind the channel narrative.',
};

export default async function CasesIndex() {
  const cases = await getAllCases();

  return (
    <Container as="section" className="py-16">
      <h1 className="font-display text-4xl font-semibold tracking-tight">Case Studies</h1>
      <p className="mt-4 max-w-2xl text-muted">
        Real projects, real clients, real outcomes. The structured technical
        entries that came out of each build live in The Large Language Library
        — case studies link out directly.
      </p>
      <ul className="mt-12 grid gap-6 md:grid-cols-2">
        {cases.map((caseStudy) => (
          <li key={caseStudy.meta.id}>
            <Link
              href={`/cases/${caseStudy.slug}`}
              className="block rounded-lg border border-mist p-6 hover:border-accent"
            >
              <p className="text-xs uppercase tracking-wide text-muted">
                {CASE_STATUS_LABELS[caseStudy.meta.status]}
              </p>
              <h2 className="mt-2 font-display text-xl font-semibold">
                {caseStudy.meta.title}
              </h2>
              <p className="mt-3 text-sm text-muted">{caseStudy.meta.summary}</p>
              <p className="mt-4 text-xs text-accent">{caseStudy.meta.client}</p>
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
