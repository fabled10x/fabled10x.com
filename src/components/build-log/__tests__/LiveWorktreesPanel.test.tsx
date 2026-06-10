import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LiveWorktreesPanel } from '../LiveWorktreesPanel';

const NOW = '2026-06-07T12:00:00Z';

describe('LiveWorktreesPanel', () => {
  // --- unit ---

  it('unit_returns_null_when_empty: empty DOM when no worktrees and no current section', () => {
    const { container } = render(
      <LiveWorktreesPanel worktrees={[]} session={null} nowIso={NOW} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('unit_no_worktree_with_current_section: renders "checked out but no worktree" + section id', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[]}
        session={{ id: 's', currentSection: 'foo-1.1', completedSections: [] }}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/checked out but no worktree/i)).toBeInTheDocument();
    expect(screen.getByText('foo-1.1')).toBeInTheDocument();
  });

  it('unit_singular_label: singular copy for exactly 1 worktree', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 1234, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/one section is in active development/i)).toBeInTheDocument();
  });

  it('unit_plural_label: plural copy with count for >1 worktrees', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[
          { sectionId: 'a-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never,
          { sectionId: 'b-1.1', currentPhase: 'red', pid: 2, slotPath: '/y' } as never,
        ]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/2 sections are in active development/i)).toBeInTheDocument();
  });

  it('unit_orphan_badge_when_pid_null: orphan-slot badge, no pid text', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: null, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('orphan slot')).toBeInTheDocument();
    expect(screen.queryByText(/^pid /i)).toBeNull();
  });

  it('unit_pid_shown_when_present: shows "pid {n}", no orphan badge', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 4321, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/pid 4321/)).toBeInTheDocument();
    expect(screen.queryByText('orphan slot')).toBeNull();
  });

  it('unit_friendly_phase_label: renders friendly phaseLabel not internal name', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('Making the tests pass')).toBeInTheDocument();
    expect(screen.queryByText(/^green$/)).toBeNull();
  });

  it('unit_agent_name_and_started_and_slotpath: optional fields render when present', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{
          sectionId: 'foo-1.1',
          currentPhase: 'green',
          pid: 1,
          slotPath: '/var/lib/worktrees/section-foo-1.1',
          agentName: 'green-agent-7',
          startedAt: '2026-06-07T09:00:00Z',
        } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('green-agent-7')).toBeInTheDocument();
    expect(screen.getByText(/started.*3h ago/i)).toBeInTheDocument();
    expect(screen.getByText('/var/lib/worktrees/section-foo-1.1')).toBeInTheDocument();
  });

  // --- integration ---

  it('int_phasestepper_per_worktree: one PhaseStepper (role=group) per worktree', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[
          { sectionId: 'a-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never,
          { sectionId: 'b-1.1', currentPhase: 'red', pid: 2, slotPath: '/y' } as never,
        ]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getAllByRole('group')).toHaveLength(2);
  });

  it('int_relative_time_integration: startedAt rendered via formatRelativeTime against nowIso', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{
          sectionId: 'foo-1.1',
          currentPhase: 'green',
          pid: 1,
          slotPath: '/x',
          startedAt: '2026-06-07T11:30:00Z',
        } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText(/started.*30m ago/i)).toBeInTheDocument();
  });

  // --- edge case ---

  it('edge_state_empty_returns_null: no "Live work" header above nothing', () => {
    const { container } = render(
      <LiveWorktreesPanel worktrees={[]} session={null} nowIso={NOW} />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText(/live work/i)).toBeNull();
  });

  it('edge_input_missing_optional_fields: card renders with only sectionId + pid, no crash', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', pid: 99 } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.getByText('foo-1.1')).toBeInTheDocument();
    expect(screen.getByText(/pid 99/)).toBeInTheDocument();
    // No friendly Phase row because currentPhase is undefined
    expect(screen.queryByText(/^Phase:/)).toBeNull();
  });

  it('edge_input_invalid_phase_string: non-phase currentPhase → no Phase row, stepper still renders', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'bogus', pid: 1, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    expect(screen.queryByText('Phase:')).toBeNull();
    expect(screen.getByRole('group')).toBeInTheDocument();
  });

  // --- error recovery ---

  it('err_partial_failure_partial_worktree_no_throw: partial worktree renders without throwing', () => {
    expect(() =>
      render(
        <LiveWorktreesPanel
          worktrees={[{ sectionId: 'foo-1.1' } as never]}
          session={null}
          nowIso={NOW}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText('foo-1.1')).toBeInTheDocument();
  });

  // --- accessibility ---

  it('a11y_section_labelledby_heading: section aria-labelledby matches the h2 id', () => {
    const { container } = render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    const section = container.querySelector('section');
    const labelledBy = section?.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    const heading = container.querySelector('h2');
    expect(heading?.getAttribute('id')).toBe(labelledBy);
  });

  it('a11y_phasestepper_group_role: each per-worktree PhaseStepper exposes role=group with a label', () => {
    render(
      <LiveWorktreesPanel
        worktrees={[{ sectionId: 'foo-1.1', currentPhase: 'green', pid: 1, slotPath: '/x' } as never]}
        session={null}
        nowIso={NOW}
      />,
    );
    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group.getAttribute('aria-label')).toBeTruthy();
  });
});
