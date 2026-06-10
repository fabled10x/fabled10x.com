import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { PhaseStepper } from '../PhaseStepper';
import * as buildLogBarrel from '..';
import { PHASE_ORDER, PHASE_LABELS } from '@/lib/build-log/phase-labels';

// Resolve repo root from this file (NOT process.cwd()) so source-regex
// assertions pass inside worktree slots. Matches StatusBadge.test.tsx.
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const PHASE_STEPPER_SOURCE = 'src/components/build-log/PhaseStepper.tsx';

describe('PhaseStepper', () => {
  // ── Unit ──────────────────────────────────────────────────────────────
  it('unit_renders_seven_phases: one list item per canonical phase', () => {
    render(<PhaseStepper currentPhase="green" />);
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('unit_marks_current_phase: exactly one data-current, matching data-phase', () => {
    const { container } = render(<PhaseStepper currentPhase="green" />);
    const currents = container.querySelectorAll('[data-current="true"]');
    expect(currents).toHaveLength(1);
    expect(currents[0].getAttribute('data-phase')).toBe('green');
  });

  it('unit_marks_completed_phases: green (index 3) ⇒ 3 completed', () => {
    const { container } = render(<PhaseStepper currentPhase="green" />);
    expect(container.querySelectorAll('[data-completed="true"]')).toHaveLength(3);
  });

  it('unit_default_size_md_shows_labels: friendly label text rendered', () => {
    render(<PhaseStepper currentPhase="green" />);
    expect(screen.getByText(PHASE_LABELS.green)).toBeInTheDocument();
  });

  it('unit_sm_hides_labels: size="sm" renders no label text', () => {
    render(<PhaseStepper currentPhase="green" size="sm" />);
    expect(screen.queryByText(PHASE_LABELS.discovery)).toBeNull();
  });

  it('unit_classname_passthrough: custom className appended to root', () => {
    render(<PhaseStepper currentPhase="green" className="custom-xyz" />);
    expect(screen.getByRole('group')).toHaveClass('custom-xyz');
  });

  // ── Integration (consumes phase-labels module) ─────────────────────────
  it('int_uses_phase_labels_friendly_aria: aria-label from PHASE_LABELS', () => {
    render(<PhaseStepper currentPhase="green" />);
    expect(screen.getByRole('group')).toHaveAttribute(
      'aria-label',
      'Build phase: Making the tests pass',
    );
  });

  it('int_renders_against_every_phase_in_order: index i ⇒ i completed, current matches', () => {
    PHASE_ORDER.forEach((phase, i) => {
      const { container, unmount } = render(<PhaseStepper currentPhase={phase} />);
      const current = container.querySelectorAll('[data-current="true"]');
      expect(current).toHaveLength(1);
      expect(current[0].getAttribute('data-phase')).toBe(phase);
      expect(container.querySelectorAll('[data-completed="true"]')).toHaveLength(i);
      unmount();
    });
  });

  // ── Accessibility ──────────────────────────────────────────────────────
  it('a11y_role_group_aria_label: root is role=group with non-empty aria-label', () => {
    render(<PhaseStepper currentPhase="green" />);
    const group = screen.getByRole('group');
    expect(group).toHaveAttribute('aria-label');
    expect(group.getAttribute('aria-label')).toBeTruthy();
  });

  it('a11y_ordered_list_semantics: root is <ol>, dots are aria-hidden', () => {
    const { container } = render(<PhaseStepper currentPhase="green" />);
    expect(screen.getByRole('group').tagName).toBe('OL');
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBeGreaterThanOrEqual(7);
  });

  it('a11y_custom_aria_label_override: ariaLabel prop wins', () => {
    render(<PhaseStepper currentPhase="green" ariaLabel="Custom legend" />);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Custom legend');
  });

  // ── Infrastructure ─────────────────────────────────────────────────────
  it('infra_barrel_reexports_phasestepper: importable via build-log barrel', () => {
    expect(buildLogBarrel).toHaveProperty('PhaseStepper');
    expect(typeof (buildLogBarrel as Record<string, unknown>).PhaseStepper).toBe('function');
  });

  it('infra_server_component_no_client_directive: no use client / useState / useEffect', () => {
    const src = readFileSync(join(REPO_ROOT, PHASE_STEPPER_SOURCE), 'utf8');
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).not.toMatch(/\buseState\b/);
    expect(src).not.toMatch(/\buseEffect\b/);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('edge_input_null_legend_mode: currentPhase=null ⇒ legend, no current/completed', () => {
    const { container } = render(<PhaseStepper currentPhase={null} />);
    expect(container.querySelector('[data-current="true"]')).toBeNull();
    expect(container.querySelector('[data-completed="true"]')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Build phase legend');
  });

  it('edge_input_unknown_phase_no_highlight: unknown string ⇒ no highlight, still 7 dots', () => {
    const { container } = render(<PhaseStepper currentPhase={'unknown-future' as never} />);
    expect(container.querySelector('[data-current="true"]')).toBeNull();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });

  it('edge_input_empty_string: "" ⇒ treated as no current (legend)', () => {
    const { container } = render(<PhaseStepper currentPhase="" />);
    expect(container.querySelector('[data-current="true"]')).toBeNull();
    expect(screen.getByRole('group')).toHaveAttribute('aria-label', 'Build phase legend');
  });

  it('edge_state_first_phase_zero_completed: preflight (index 0) ⇒ 0 completed', () => {
    const { container } = render(<PhaseStepper currentPhase="preflight" />);
    expect(container.querySelectorAll('[data-completed="true"]')).toHaveLength(0);
    const current = container.querySelectorAll('[data-current="true"]');
    expect(current).toHaveLength(1);
    expect(current[0].getAttribute('data-phase')).toBe('preflight');
  });

  it('edge_state_last_phase_six_completed: release (index 6) ⇒ 6 completed', () => {
    const { container } = render(<PhaseStepper currentPhase="release" />);
    expect(container.querySelectorAll('[data-completed="true"]')).toHaveLength(6);
    expect(
      container.querySelector('[data-current="true"]')?.getAttribute('data-phase'),
    ).toBe('release');
  });

  // ── Error recovery ─────────────────────────────────────────────────────
  it('err_invalid_phase_renders_cleanly: non-string garbage ⇒ no throw, legend fallback', () => {
    expect(() => render(<PhaseStepper currentPhase={42 as never} />)).not.toThrow();
    expect(screen.getAllByRole('listitem')).toHaveLength(7);
  });
});
