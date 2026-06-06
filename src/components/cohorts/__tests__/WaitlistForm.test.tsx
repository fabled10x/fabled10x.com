import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

const { mockSubmit } = vi.hoisted(() => ({ mockSubmit: vi.fn() }));

vi.mock('../actions', () => ({
  submitWaitlist: mockSubmit,
}));

// React.useActionState mock so we can drive (state, isPending) deterministically.
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

import { WaitlistForm } from '../WaitlistForm';

const formAction = vi.fn();

describe('WaitlistForm', () => {
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

  // --- Unit ---

  it('unit_form_initial_render', () => {
    render(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    expect(
      screen.getByRole('button', { name: /join the waitlist/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    const hidden = document.querySelector(
      'input[type="hidden"][name="cohortSlug"]',
    ) as HTMLInputElement | null;
    expect(hidden?.value).toBe('ai-delivery-2026-q3');
  });

  it('unit_form_sourcetag_conditional', () => {
    const { rerender } = render(
      <WaitlistForm cohortSlug="ai-delivery-2026-q3" />,
    );
    expect(
      document.querySelector('input[type="hidden"][name="sourceTag"]'),
    ).toBeNull();

    rerender(
      <WaitlistForm
        cohortSlug="ai-delivery-2026-q3"
        sourceTag="cohort-detail"
      />,
    );
    const tag = document.querySelector(
      'input[type="hidden"][name="sourceTag"]',
    ) as HTMLInputElement | null;
    expect(tag?.value).toBe('cohort-detail');
  });

  it('unit_form_pending_disables', () => {
    useActionStateMock.mockReturnValue([
      { status: 'idle' },
      formAction,
      true, // isPending = true
    ]);
    render(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/joining/i);
  });

  it('unit_form_success_status_role', () => {
    useActionStateMock.mockReturnValue([
      { status: 'success', message: "You're on the waitlist." },
      formAction,
      false,
    ]);
    render(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/on the waitlist/i);
  });

  it('unit_form_error_styled_red', () => {
    useActionStateMock.mockReturnValue([
      { status: 'error', message: 'Please enter a valid email.' },
      formAction,
      false,
    ]);
    render(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    const status = screen.getByRole('status');
    expect(status).toHaveTextContent(/valid email/i);
    // Red styling — match class containing "red" or "text-red-"
    expect(status.className).toMatch(/red/i);
  });

  // --- Accessibility ---

  it('a11y_perceivable_label_sr_only', () => {
    render(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    const label = screen.getByText(/email address/i);
    expect(label.tagName).toBe('LABEL');
    expect(label.className).toContain('sr-only');
    const input = screen.getByLabelText(/email address/i);
    expect(label.getAttribute('for')).toBe(input.id);
  });

  it('a11y_robust_status_role', () => {
    // Idle: no role=status
    const { rerender } = render(
      <WaitlistForm cohortSlug="ai-delivery-2026-q3" />,
    );
    expect(screen.queryByRole('status')).toBeNull();

    useActionStateMock.mockReturnValue([
      { status: 'success', message: 'ok' },
      formAction,
      false,
    ]);
    rerender(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByRole('status')).toBeInTheDocument();

    useActionStateMock.mockReturnValue([
      { status: 'error', message: 'bad' },
      formAction,
      false,
    ]);
    rerender(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('a11y_operable_required_email_type', () => {
    render(<WaitlistForm cohortSlug="ai-delivery-2026-q3" />);
    const input = screen.getByLabelText(/email address/i) as HTMLInputElement;
    expect(input.type).toBe('email');
    expect(input.required).toBe(true);
    expect(input.autocomplete).toBe('email');
  });
});
