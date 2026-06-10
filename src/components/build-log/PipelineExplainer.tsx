import { PhaseStepper } from './PhaseStepper';

export function PipelineExplainer() {
  return (
    <details id="whatisthis" open className="mb-10 border border-bone p-5">
      <summary className="cursor-pointer font-display text-xl">
        What is this?
      </summary>

      <div className="mt-4 max-w-3xl space-y-3 text-sm text-(--color-ink)">
        <p>
          Every feature on this site is built by an AI agent following a strict
          test-first pipeline. The agent researches the change, writes the tests
          that describe what should happen, makes them pass, polishes the code,
          then ships it as a single commit.
        </p>
        <p>
          This page is a live readout of that work. It reads the same files the
          agents read — <code className="font-mono text-(--color-oxblood)">pipeline/active/session.yaml</code>,
          live <code className="font-mono text-(--color-oxblood)">git worktree</code> state,
          and every job&apos;s plan tree under <code className="font-mono text-(--color-oxblood)">currentwork/</code>
          — and renders them in plain English. It rebuilds whenever the site
          deploys.
        </p>
        <p className="text-(--color-muted)">
          The seven phases an agent moves through, in order:
        </p>
        <div className="pt-2">
          <PhaseStepper currentPhase={null} size="md" />
        </div>
      </div>
    </details>
  );
}
