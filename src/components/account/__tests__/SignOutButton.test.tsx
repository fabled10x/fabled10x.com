import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

const mockSignOut = vi.fn();
vi.mock('@/auth', () => ({
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

import { SignOutButton } from '../SignOutButton';

describe('SignOutButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Batch 1: Functional (unit) ---

  it('unit_signout_renders: renders button with "Sign out" label', () => {
    render(<SignOutButton />);
    expect(
      screen.getByRole('button', { name: /sign out/i }),
    ).toBeInTheDocument();
  });

  it('unit_signout_calls: form submission calls signOut({ redirectTo: "/" })', async () => {
    mockSignOut.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({ redirectTo: '/' });
    });
  });

  // --- Batch 5: Error recovery ---

  it('err_signout_pending: button disabled and shows "Signing out…" while pending', async () => {
    let resolveSignOut: () => void;
    mockSignOut.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent(/signing out/i);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    // Cleanup: resolve the pending promise
    await act(async () => resolveSignOut!());
  });

  // --- Batch 6: Accessibility ---

  it('a11y_signout_pending: button communicates disabled state via disabled attribute', async () => {
    let resolveSignOut: () => void;
    mockSignOut.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve;
        }),
    );
    const user = userEvent.setup();

    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    await act(async () => resolveSignOut!());
  });
});
