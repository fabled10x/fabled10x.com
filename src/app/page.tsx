import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { EmailCapture } from '@/components/capture/EmailCapture';
import { getLatestEpisode } from '@/lib/content/episodes';

const SECTIONS = [
  { href: '/episodes', title: 'Episodes', description: 'The full channel archive — flagship series, playbooks, shorts.' },
  { href: '/cases', title: 'Case Studies', description: 'Real client projects documented end to end.' },
  { href: '/about', title: 'About', description: 'The Fabled10X premise and the sister project.' },
];

export default async function Home() {
  const latest = await getLatestEpisode();

  return (
    <>
      <section className="border-b border-mist">
        <Container as="div" className="py-24 md:py-32">
          <p className="text-sm uppercase tracking-wide text-accent">
            The Fabled 10X Developer
          </p>
          <h1 className="mt-6 font-display text-5xl md:text-6xl font-semibold tracking-tight leading-[1.05]">
            One person.<br />
            An agent team.<br />
            Full SaaS delivery.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-muted">
            A documented real-world case study of using AI agent teams to run a
            legitimate software consulting business. Real clients, real money,
            real deliverables.
          </p>
          <div className="mt-10 max-w-md">
            <EmailCapture source="homepage-hero" />
          </div>
        </Container>
      </section>

      {latest && (
        <section>
          <Container as="div" className="py-20">
            <p className="text-sm uppercase tracking-wide text-muted">Latest episode</p>
            <h2 className="mt-3 font-display text-3xl font-semibold">
              <Link href={`/episodes/${latest.slug}`} className="hover:text-accent">
                {latest.meta.title}
              </Link>
            </h2>
            <p className="mt-4 max-w-2xl text-muted">{latest.meta.summary}</p>
          </Container>
        </section>
      )}

      <section className="border-t border-mist">
        <Container as="div" className="py-20">
          <h2 className="font-display text-3xl font-semibold">Where to next</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-3">
            {SECTIONS.map((section) => (
              <li key={section.href}>
                <Link
                  href={section.href}
                  className="block rounded-lg border border-mist p-6 hover:border-accent"
                >
                  <p className="font-display text-xl font-semibold">{section.title}</p>
                  <p className="mt-2 text-sm text-muted">{section.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>
    </>
  );
}
