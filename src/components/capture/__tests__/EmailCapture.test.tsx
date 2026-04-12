import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockAction = vi.fn(async (_prev: unknown, formData: FormData) => {
  const email = formData.get('email');
  if (typeof email !== 'string' || !email.includes('@')) {
    return { status: 'error' as const, message: 'Please enter a valid email address.' };
  }
  return { status: 'success' as const };
});

vi.mock('../actions', () => ({
  captureEmail: (...args: Parameters<typeof mockAction>) => mockAction(...args),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmailCapture } from '../EmailCapture';

describe('EmailCapture', () => {
  beforeEach(() => {
    mockAction.mockClear();
  });

  // --- Unit ---

  it('unit_capture_idle_state', () => {
    render(<EmailCapture source="homepage-hero" />);
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(screen.queryByText(/on the list/i)).not.toBeInTheDocument();
  });

  it('unit_capture_source_hidden_input', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const input = container.querySelector('input[name="source"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe('hidden');
    expect(input.value).toBe('homepage-hero');
  });

  it('unit_capture_button_label_default', () => {
    render(<EmailCapture source="test" />);
    expect(
      screen.getByRole('button', { name: /get the updates/i }),
    ).toBeInTheDocument();
  });

  it('unit_capture_button_label_override', () => {
    render(<EmailCapture source="test" buttonLabel="Subscribe" />);
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('unit_capture_placeholder_default', () => {
    render(<EmailCapture source="test" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.placeholder).toBe('you@domain.com');
  });

  it('unit_capture_placeholder_override', () => {
    render(<EmailCapture source="test" placeholder="email@acme.dev" />);
    const input = screen.getByRole('textbox') as HTMLInputElement;
    expect(input.placeholder).toBe('email@acme.dev');
  });

  it('unit_capture_email_input_attrs', () => {
    const { container } = render(<EmailCapture source="test" />);
    const email = container.querySelector('input[name="email"]') as HTMLInputElement;
    expect(email).toBeInTheDocument();
    expect(email.type).toBe('email');
    expect(email.required).toBe(true);
  });

  // --- Integration ---

  it('integration_action_source_in_formdata', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const email = container.querySelector('input[name="email"]') as HTMLInputElement;
    await user.type(email, 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(mockAction).toHaveBeenCalled());
    const formData = mockAction.mock.calls[0][1] as FormData;
    expect(formData.get('source')).toBe('homepage-hero');
    expect(formData.get('email')).toBe('user@example.com');
  });

  it('integration_capture_success_transition', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    const email = container.querySelector('input[name="email"]') as HTMLInputElement;
    await user.type(email, 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/on the list/i)).toBeInTheDocument());
    // Form should be gone
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
  });

  it('integration_capture_error_message_rendered', async () => {
    mockAction.mockResolvedValueOnce({
      status: 'error',
      message: 'Custom error message from action',
    });
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    const email = container.querySelector('input[name="email"]') as HTMLInputElement;
    await user.type(email, 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText(/custom error message from action/i)).toBeInTheDocument(),
    );
    // Form still visible
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_capture_sr_only_label', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const email = container.querySelector('input[name="email"]') as HTMLInputElement;
    const labelFor = container.querySelector(`label[for="${email.id}"]`);
    expect(labelFor).toBeInTheDocument();
    expect(labelFor?.className).toMatch(/sr-only/);
  });

  it('a11y_capture_form_landmark', () => {
    render(<EmailCapture source="test" />);
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('a11y_capture_button_focus', async () => {
    const user = userEvent.setup();
    render(<EmailCapture source="test" />);
    const button = screen.getByRole('button');
    await user.tab();
    await user.tab();
    expect(button).toHaveFocus();
  });

  // --- Error recovery ---

  it('err_capture_form_double_submit', async () => {
    let resolveAction: (v: { status: 'success' }) => void = () => {};
    mockAction.mockImplementationOnce(
      () =>
        new Promise<{ status: 'success' }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    const email = container.querySelector('input[name="email"]') as HTMLInputElement;
    await user.type(email, 'user@example.com');
    const button = screen.getByRole('button') as HTMLButtonElement;
    await user.click(button);
    // Immediately clicking again should not enqueue a second invocation
    await user.click(button);
    await user.click(button);
    expect(button.disabled).toBe(true);
    // Only one invocation — double-submit prevented
    expect(mockAction).toHaveBeenCalledTimes(1);
    // Resolve so React can clean up pending state; form unmounts on success
    resolveAction({ status: 'success' });
    await waitFor(() => expect(screen.getByText(/on the list/i)).toBeInTheDocument());
  });
});
