import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockSubmit } = vi.hoisted(() => ({ mockSubmit: vi.fn() }));

vi.mock('../actions', () => ({
  submitApplication: mockSubmit,
}));

const { useActionStateMock } = vi.hoisted(() => ({
  useActionStateMock: vi.fn(),
}));

vi.mock('react', async () => {
  const actual = await vi.importActual<typeof import('react')>('react');
  return {
    ...actual,
    useActionState: useActionStateMock,
  };
});

import { ApplicationForm } from '../ApplicationForm';

const formAction = vi.fn();

describe('ApplicationForm', () => {
  beforeEach(() => {
    mockSubmit.mockReset();
    formAction.mockReset();
    useActionStateMock.mockReset();
    useActionStateMock.mockReturnValue([
      { status: 'idle' },
      formAction,
      false,
    ]);
  });

  // --- Unit: render ---

  it('unit_application_form_renders_all_fields', () => {
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByLabelText(/background/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/commitment level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pillar/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/referral/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /submit application/i }),
    ).toBeInTheDocument();
  });

  it('unit_application_form_hidden_cohort_slug', () => {
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const hidden = document.querySelector(
      'input[type="hidden"][name="cohortSlug"]',
    ) as HTMLInputElement | null;
    expect(hidden?.value).toBe('ai-delivery-2026-q3');
  });

  it('unit_application_form_commitment_options', () => {
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const select = screen.getByLabelText(/commitment level/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('light');
    expect(options).toContain('standard');
    expect(options).toContain('intense');
  });

  it('unit_application_form_pillar_options', () => {
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const select = screen.getByLabelText(/pillar/i) as HTMLSelectElement;
    const options = Array.from(select.options).map((o) => o.value);
    expect(options).toContain('delivery');
    expect(options).toContain('workflow');
    expect(options).toContain('business');
    expect(options).toContain('future');
  });

  it('unit_application_form_pending_disables_submit', () => {
    useActionStateMock.mockReturnValue([
      { status: 'idle' },
      formAction,
      true, // isPending
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/submitting/i);
  });

  it('unit_application_form_error_state_renders_field_errors', () => {
    useActionStateMock.mockReturnValue([
      {
        status: 'error',
        fieldErrors: {
          background: 'Background too short',
          goals: 'Goals too short',
        },
      },
      formAction,
      false,
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByText('Background too short')).toBeInTheDocument();
    expect(screen.getByText('Goals too short')).toBeInTheDocument();
  });

  it('unit_application_form_form_error_renders_at_top', () => {
    useActionStateMock.mockReturnValue([
      {
        status: 'error',
        fieldErrors: { _form: 'You must be signed in to apply.' },
      },
      formAction,
      false,
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    expect(
      screen.getByText(/you must be signed in/i),
    ).toBeInTheDocument();
  });

  it('unit_application_form_success_state_renders_thanks', () => {
    useActionStateMock.mockReturnValue([
      { status: 'success', applicationId: 'app-uuid-xyz' },
      formAction,
      false,
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByText(/thanks|received|submitted/i)).toBeInTheDocument();
    // The form should NOT render the background textarea anymore
    expect(screen.queryByLabelText(/background/i)).not.toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_form_fields_have_labels', () => {
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    // Every form control queried by label is wired up
    expect(screen.getByLabelText(/background/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/goals/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/commitment level/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/timezone/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/pillar/i)).toBeInTheDocument();
  });

  it('a11y_error_messages_have_aria_alert', () => {
    useActionStateMock.mockReturnValue([
      {
        status: 'error',
        fieldErrors: {
          background: 'Background too short',
          _form: 'something broke',
        },
      },
      formAction,
      false,
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThanOrEqual(2);
  });

  it('a11y_error_messages_aria_describedby', () => {
    useActionStateMock.mockReturnValue([
      {
        status: 'error',
        fieldErrors: { background: 'Background too short' },
      },
      formAction,
      false,
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const input = screen.getByLabelText(/background/i);
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    if (describedBy) {
      const errorEl = document.getElementById(describedBy);
      expect(errorEl?.textContent).toMatch(/too short/i);
    }
  });

  it('a11y_required_inputs_marked', () => {
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByLabelText(/background/i)).toBeRequired();
    expect(screen.getByLabelText(/goals/i)).toBeRequired();
    expect(screen.getByLabelText(/hours/i)).toBeRequired();
    expect(screen.getByLabelText(/timezone/i)).toBeRequired();
  });

  it('a11y_pending_status_announced', () => {
    useActionStateMock.mockReturnValue([
      { status: 'idle' },
      formAction,
      true,
    ]);
    render(<ApplicationForm cohortSlug="ai-delivery-2026-q3" />);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  // --- Infrastructure ---

  it('infra_application_form_use_client', async () => {
    const { readFileSync } = await import('node:fs');
    const { resolve } = await import('node:path');
    const filepath = resolve(
      process.cwd(),
      'src/components/cohorts/ApplicationForm.tsx',
    );
    const source = readFileSync(filepath, 'utf-8');
    expect(source).toMatch(/^['"]use client['"];?/);
  });
});
