import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { JobsRollupTable } from '@/components/build-log/JobsRollupTable';
import { MarkdownDocument } from '@/components/build-log/MarkdownDocument';
import {
  getSessionStatus,
  getKnowledgeFile,
  getJobsRollup,
} from '@/lib/build-log/pipeline-state';

export const metadata: Metadata = {
  title: 'Pipeline status · Build log',
  description:
    'Live view of the fabled10x TDD pipeline — current section, completed sections, and per-job progress, read directly from session.yaml at build time.',
};

function extractSectionId(
  entry: string | { section: string; completedAt?: string },
): string {
  return typeof entry === 'string' ? entry : entry.section;
}

export default async function StatusPage() {
  const [session, knowledge, rollup] = await Promise.all([
    getSessionStatus(),
    getKnowledgeFile(),
    getJobsRollup(),
  ]);

  return (
    <Container as="main" className="py-12">
      <nav className="mb-6 text-sm">
        <Link href="/build-log" className="text-link hover:text-accent">
          ← Back to build log
        </Link>
      </nav>
      <header className="mb-10">
        <h1 className="text-4xl font-display mb-3">Pipeline status</h1>
        <p className="text-lg text-muted max-w-2xl">
          Read directly from <code className="text-accent">pipeline/active/</code>
          {' '}at build time. Refreshes whenever the site rebuilds.
        </p>
      </header>

      <section className="mb-10" aria-labelledby="current-state">
        <h2 id="current-state" className="text-2xl font-display mb-4">
          Current state
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-muted">Session</dt>
            <dd className="font-mono">{session.id}</dd>
          </div>
          {session.startedAt && (
            <div>
              <dt className="text-muted">Started</dt>
              <dd>{session.startedAt}</dd>
            </div>
          )}
          <div>
            <dt className="text-muted">Current section</dt>
            <dd className="font-mono">
              {session.currentSection || <span className="text-muted">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Current agent</dt>
            <dd>
              {session.currentAgent || <span className="text-muted">—</span>}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Current stage</dt>
            <dd>
              {session.currentStage || <span className="text-muted">—</span>}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mb-10" aria-labelledby="rollup">
        <h2 id="rollup" className="text-2xl font-display mb-4">
          Jobs at a glance
        </h2>
        <JobsRollupTable rows={rollup} />
      </section>

      <section className="mb-10" aria-labelledby="completed">
        <h2 id="completed" className="text-2xl font-display mb-4">
          Completed sections
        </h2>
        {session.completedSections.length === 0 ? (
          <p className="text-muted italic">
            No sections shipped yet — pipeline is still warming up.
          </p>
        ) : (
          <ul className="space-y-1 text-sm font-mono">
            {session.completedSections.map((entry, i) => (
              <li key={i}>{extractSectionId(entry)}</li>
            ))}
          </ul>
        )}
      </section>

      {(knowledge.projectContext?.purpose || session.notes) && (
        <section aria-labelledby="notes">
          <h2 id="notes" className="text-2xl font-display mb-4">
            Notes
          </h2>
          {session.notes && <MarkdownDocument body={session.notes} />}
        </section>
      )}
    </Container>
  );
}
