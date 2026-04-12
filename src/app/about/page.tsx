import Link from 'next/link';
import type { Metadata } from 'next';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'About',
  description:
    'The Fabled10X premise, the channel, and the sister project — The Large Language Library.',
};

export default function About() {
  return (
    <Container as="article" className="py-16 max-w-3xl">
      <h1 className="font-display text-4xl font-semibold tracking-tight">About</h1>
      <section className="mt-8 space-y-6 text-lg leading-relaxed">
        <p>
          Fabled10X is the documented real-world answer to a question every
          technical freelancer is asking: what can one person actually ship
          when they manage a team of AI agents the way a senior tech lead
          manages a dev team?
        </p>
        <p>
          The channel is the answer in progress. Real clients. Real deliverables.
          Real case studies — end to end, not demos. The site you&apos;re reading
          is itself part of the exhibit: it was built and is maintained by the
          same agent workflow being documented on the channel.
        </p>
      </section>

      <section className="mt-16 rounded-lg border border-mist p-8">
        <h2 className="font-display text-2xl font-semibold">The Large Language Library</h2>
        <p className="mt-4 leading-relaxed">
          Fabled10X built and champions{' '}
          <Link
            href="https://largelanguagelibrary.ai"
            className="text-link underline-offset-2 hover:underline"
          >
            The Large Language Library
          </Link>
          , the open, AI-optimized knowledge base of solved technical problems
          that comes out of every client engagement. Fabled10X is the brand;
          LLL is the infrastructure. The tool is bigger than the brand that
          built it — that&apos;s intentional.
        </p>
      </section>
    </Container>
  );
}
