import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PipelineExplainer } from '../PipelineExplainer';
import * as buildLogBarrel from '..';
import { PHASE_LABELS } from '@/lib/build-log/phase-labels';

// Resolve repo root from this file (NOT process.cwd()) so source-regex
// assertions pass inside worktree slots. Matches PhaseStepper.test.tsx.
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const PIPELINE_EXPLAINER_SOURCE =
  'src/components/build-log/PipelineExplainer.tsx';

describe('PipelineExplainer', () => {
  // ── Unit ──────────────────────────────────────────────────────────────
  it('unit_renders_what_is_this_summary: <summary> shows "What is this?"', () => {
    render(<PipelineExplainer />);
    expect(screen.getByText('What is this?')).toBeInTheDocument();
  });

  it('unit_details_open_by_default: the <details> has the open attribute', () => {
    const { container } = render(<PipelineExplainer />);
    const details = container.querySelector('details');
    expect(details).toBeInTheDocument();
    expect(details).toHaveAttribute('open');
  });

  it('unit_carries_whatisthis_id: #whatisthis anchor present (Hero links to it)', () => {
    const { container } = render(<PipelineExplainer />);
    expect(container.querySelector('#whatisthis')).toBeInTheDocument();
  });

  it('unit_mounts_phasestepper_legend_seven_phases: 7 list items rendered', () => {
    render(<PipelineExplainer />);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  // ── Integration (consumes PhaseStepper → phase-labels) ─────────────────
  it('int_phasestepper_legend_mode_no_current: currentPhase=null ⇒ no data-current dot', () => {
    const { container } = render(<PipelineExplainer />);
    expect(container.querySelector('[data-current="true"]')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('int_renders_friendly_phase_labels: a friendly PHASE_LABEL is rendered text', () => {
    render(<PipelineExplainer />);
    // size="md" legend renders every friendly label; assert one is present.
    expect(screen.getByText(PHASE_LABELS.green)).toBeInTheDocument();
  });

  // ── Accessibility ──────────────────────────────────────────────────────
  it('a11y_summary_native_disclosure: <details> wraps a <summary> (native, keyboard-operable)', () => {
    const { container } = render(<PipelineExplainer />);
    const summary = container.querySelector('details > summary');
    expect(summary).toBeInTheDocument();
    expect(summary?.tagName).toBe('SUMMARY');
  });

  it('a11y_phasestepper_group_labelled: legend exposes role=group with non-empty aria-label', () => {
    render(<PipelineExplainer />);
    // <details> also exposes an implicit role=group, so target the PhaseStepper
    // legend specifically by its accessible name.
    const group = screen.getByRole('group', { name: 'Build phase legend' });
    expect(group).toHaveAttribute('aria-label');
    expect(group.getAttribute('aria-label')).toBeTruthy();
  });

  it('a11y_summary_text_accessible: "What is this?" discoverable via accessible text', () => {
    render(<PipelineExplainer />);
    expect(screen.getByText('What is this?')).toBeVisible();
  });

  // ── Infrastructure ─────────────────────────────────────────────────────
  it('infra_barrel_reexports_pipelineexplainer: importable via build-log barrel', () => {
    expect(buildLogBarrel).toHaveProperty('PipelineExplainer');
    expect(
      typeof (buildLogBarrel as Record<string, unknown>).PipelineExplainer,
    ).toBe('function');
  });

  it('infra_server_component_no_client_directive: no use client / useState / useEffect', () => {
    const src = readFileSync(
      join(REPO_ROOT, PIPELINE_EXPLAINER_SOURCE),
      'utf8',
    );
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).not.toMatch(/\buseState\b/);
    expect(src).not.toMatch(/\buseEffect\b/);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('edge_state_renders_all_three_paragraphs: three explainer <p> present', () => {
    const { container } = render(<PipelineExplainer />);
    expect(container.querySelectorAll('p')).toHaveLength(3);
  });

  it('edge_input_code_refs_rendered_as_code: a <code> ref contains "session.yaml"', () => {
    const { container } = render(<PipelineExplainer />);
    const codes = Array.from(container.querySelectorAll('code'));
    expect(codes.length).toBeGreaterThanOrEqual(1);
    expect(codes.some((c) => c.textContent?.includes('session.yaml'))).toBe(
      true,
    );
  });

  it('edge_state_open_attribute_present_for_returning_collapse: #whatisthis is open by default', () => {
    const { container } = render(<PipelineExplainer />);
    const whatisthis = container.querySelector('#whatisthis');
    expect(whatisthis?.hasAttribute('open')).toBe(true);
  });
});
