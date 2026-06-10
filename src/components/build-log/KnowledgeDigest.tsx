import type { KnowledgeFile } from '@/content/schemas';

interface NamedItem {
  name?: string;
  title?: string;
  summary?: string;
  description?: string;
}

export interface KnowledgeDigestProps {
  knowledge: KnowledgeFile | null;
}

export function KnowledgeDigest({ knowledge }: KnowledgeDigestProps) {
  const patterns = extractItems(knowledge?.patterns);
  const followups = extractItems(
    (knowledge as KnowledgeFile & { deferredFollowups?: readonly unknown[] })
      ?.deferredFollowups,
  );

  if (!patterns.length && !followups.length) return null;

  return (
    <section className="mb-10" aria-labelledby="knowledge-heading">
      <h2 id="knowledge-heading" className="text-2xl font-display mb-1">
        Patterns the agents have learned
      </h2>
      <p className="text-sm text-(--color-muted) mb-4">
        Reusable patterns established across sections and deferred follow-ups
        queued for future work, pulled directly from{' '}
        <code className="font-mono text-(--color-oxblood)">
          pipeline/active/knowledge.yaml
        </code>
        .
      </p>

      <details className="border border-bone p-4">
        <summary className="cursor-pointer font-display text-lg">
          {patterns.length} patterns · {followups.length} deferred follow-ups
        </summary>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          {patterns.length > 0 && (
            <div>
              <h3 className="font-display text-base mb-2">Patterns</h3>
              <ul className="space-y-2 text-sm">
                {patterns.map((p, i) => (
                  <li key={`p-${i}`}>
                    <p className="font-mono text-(--color-oxblood) text-xs">
                      {p.name ?? p.title ?? '(untitled)'}
                    </p>
                    {(p.summary ?? p.description) && (
                      <p className="text-(--color-muted) mt-0.5">
                        {p.summary ?? p.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {followups.length > 0 && (
            <div>
              <h3 className="font-display text-base mb-2">Deferred follow-ups</h3>
              <ul className="space-y-2 text-sm">
                {followups.map((f, i) => (
                  <li key={`f-${i}`}>
                    <p className="font-mono text-(--color-oxblood) text-xs">
                      {f.name ?? f.title ?? '(untitled)'}
                    </p>
                    {(f.summary ?? f.description) && (
                      <p className="text-(--color-muted) mt-0.5">
                        {f.summary ?? f.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </details>
    </section>
  );
}

function extractItems(raw: readonly unknown[] | undefined): NamedItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((x): x is NamedItem => typeof x === 'object' && x !== null)
    .map((x) => ({
      name: typeof x.name === 'string' ? x.name : undefined,
      title: typeof x.title === 'string' ? x.title : undefined,
      summary: typeof x.summary === 'string' ? x.summary : undefined,
      description: typeof x.description === 'string' ? x.description : undefined,
    }));
}
