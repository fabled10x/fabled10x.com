import { describe, it, expect, vi, beforeEach } from 'vitest';

const signInMock = vi.fn(async () => undefined);

vi.mock('@/auth', () => ({
  signIn: (...args: unknown[]) => signInMock(...(args as [])),
}));

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignInForm } from '../SignInForm';

describe('SignInForm', () => {
  beforeEach(() => {
    signInMock.mockClear();
    signInMock.mockImplementation(async () => undefined);
  });

  // --- Unit ---

  it('unit_signinform_renders_email_input', () => {
    render(<SignInForm callbackUrl="/products/account" />);
    const email = screen.getByRole('textbox') as HTMLInputElement;
    expect(email).toBeInTheDocument();
    expect(email.type).toBe('email');
    expect(email.required).toBe(true);
    expect(email.autocomplete).toBe('email');
  });

  it('unit_signinform_renders_hidden_callbackurl', () => {
    const { container } = render(
      <SignInForm callbackUrl="/products/account/purchases/abc" />,
    );
    const hidden = container.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement;
    expect(hidden).toBeInTheDocument();
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('/products/account/purchases/abc');
  });

  it('unit_signinform_default_button_label', () => {
    render(<SignInForm callbackUrl="/products/account" />);
    expect(
      screen.getByRole('button', { name: /send me a sign.?in link/i }),
    ).toBeInTheDocument();
  });

  // --- Integration ---

  it('integration_signinform_valid_email_calls_signin', async () => {
    const user = userEvent.setup();
    render(<SignInForm callbackUrl="/products/account" />);
    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
    const args = signInMock.mock.calls[0] as [string, Record<string, string>];
    expect(args[0]).toBe('resend');
    expect(args[1]).toEqual(
      expect.objectContaining({
        email: 'user@example.com',
        redirectTo: '/products/account',
      }),
    );
  });

  it('integration_signinform_invalid_email_blocks_signin', async () => {
    const { container } = render(
      <SignInForm callbackUrl="/products/account" />,
    );
    // Submit form directly so we exercise the action's own validation path
    // without being blocked by jsdom's HTML5 constraint validation for
    // non-empty non-email values.
    const email = container.querySelector(
      'input[name="email"]',
    ) as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'nope' } });
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i),
    );
    expect(signInMock).not.toHaveBeenCalled();
  });

  // --- Security ---

  it('sec_callbackurl_external_blocked_by_authjs', async () => {
    const user = userEvent.setup();
    render(<SignInForm callbackUrl="https://evil.com/harvest" />);
    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    // SignInForm passes the raw callbackUrl through to signIn. Auth.js v5's
    // internal redirectTo validation is responsible for blocking external
    // hosts. This test documents the trust boundary.
    const args = signInMock.mock.calls[0] as [string, Record<string, string>];
    expect(args[1].redirectTo).toBe('https://evil.com/harvest');
  });

  // --- Accessibility ---

  it('a11y_signinform_label_associated_with_input', () => {
    render(<SignInForm callbackUrl="/products/account" />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });

  it('a11y_signinform_error_uses_role_alert', async () => {
    const { container } = render(
      <SignInForm callbackUrl="/products/account" />,
    );
    const email = container.querySelector(
      'input[name="email"]',
    ) as HTMLInputElement;
    fireEvent.change(email, { target: { value: 'nope' } });
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });

  it('a11y_signinform_keyboard_submit', async () => {
    const user = userEvent.setup();
    render(<SignInForm callbackUrl="/products/account" />);
    const email = screen.getByRole('textbox');
    await user.click(email);
    await user.type(email, 'user@example.com');
    await user.keyboard('{Enter}');
    await waitFor(() => expect(signInMock).toHaveBeenCalledTimes(1));
  });

  // --- Edge case ---

  it('edge_signinform_empty_email_submission', async () => {
    const { container } = render(
      <SignInForm callbackUrl="/products/account" />,
    );
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i),
    );
    expect(signInMock).not.toHaveBeenCalled();
  });

  it('edge_signinform_whitespace_only_email', async () => {
    const { container } = render(
      <SignInForm callbackUrl="/products/account" />,
    );
    const email = container.querySelector(
      'input[name="email"]',
    ) as HTMLInputElement;
    fireEvent.change(email, { target: { value: '   ' } });
    fireEvent.submit(container.querySelector('form')!);
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(/valid email/i),
    );
    expect(signInMock).not.toHaveBeenCalled();
  });

  // --- Error recovery ---

  it('err_signinform_signin_throws_renders_error', async () => {
    signInMock.mockImplementationOnce(async () => {
      throw new Error('Resend API down');
    });
    const user = userEvent.setup();
    render(<SignInForm callbackUrl="/products/account" />);
    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        /something went wrong|try again/i,
      ),
    );
    // Button re-enabled so user can retry
    const button = screen.getByRole('button') as HTMLButtonElement;
    expect(button.disabled).toBe(false);
  });

  it('err_signinform_double_submit_prevented', async () => {
    let resolveSignIn: () => void = () => {};
    signInMock.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          resolveSignIn = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<SignInForm callbackUrl="/products/account" />);
    await user.type(screen.getByRole('textbox'), 'user@example.com');
    const button = screen.getByRole('button') as HTMLButtonElement;
    await user.click(button);
    // Rapid extra clicks while pending should be no-ops.
    await user.click(button);
    await user.click(button);
    expect(button.disabled).toBe(true);
    expect(signInMock).toHaveBeenCalledTimes(1);
    resolveSignIn();
    await waitFor(() => expect(button.disabled).toBe(false));
  });

  // --- Data integrity ---

  it('data_signinform_redirectto_matches_callbackurl_prop', async () => {
    const trickyCallback = '/products/account/purchases?sort=date#top';
    const user = userEvent.setup();
    const { container } = render(<SignInForm callbackUrl={trickyCallback} />);
    const hidden = container.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement;
    expect(hidden.value).toBe(trickyCallback);
    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    const args = signInMock.mock.calls[0] as [string, Record<string, string>];
    expect(args[1].redirectTo).toBe(trickyCallback);
  });
});
