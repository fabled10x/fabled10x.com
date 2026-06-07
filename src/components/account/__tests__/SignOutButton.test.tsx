import { vi, describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const mockSignOutAction = vi.fn();
vi.mock('@/lib/actions/auth', () => ({
  signOutAction: (...args: unknown[]) => mockSignOutAction(...args),
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

  it('unit_signout_calls: form submission calls signOutAction', async () => {
    mockSignOutAction.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));

    await waitFor(() => {
      expect(mockSignOutAction).toHaveBeenCalled();
    });
  });

  // --- Batch 5: Error recovery ---

  it('err_signout_pending: button disabled and shows "Signing out…" while pending', async () => {
    let resolveSignOut: () => void;
    mockSignOutAction.mockImplementation(
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
    mockSignOutAction.mockImplementation(
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

  // --- styling-overhaul-5.4: Button primitive adoption (ghost / sm) ---

  it('unit_signout_uses_button_ghost_variant', () => {
    const { container } = render(<SignOutButton />);
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn).not.toBeNull();
    expect(btn.className).toMatch(/\bbg-transparent\b/);
    expect(btn.className).toMatch(/text-\(--color-ink\)/);
    expect(btn.className).toMatch(/border-\(--color-ink\)/);
    expect(btn.className).toMatch(/hover:bg-\(--color-ink\)/);
  });

  it('unit_signout_uses_button_size_sm', () => {
    const { container } = render(<SignOutButton />);
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn.className).toMatch(/py-\(--space-1\)/);
    expect(btn.className).toMatch(/px-\(--space-3\)/);
  });

  it('unit_signout_no_legacy_border_mist_classes', () => {
    const { container } = render(<SignOutButton />);
    const btn = container.querySelector('button') as HTMLElement;
    expect(btn.className).not.toMatch(/\bborder-mist\b/);
    expect(btn.className).not.toMatch(/\btext-muted\b/);
    expect(btn.className).not.toMatch(/\brounded-md\b/);
  });

  it('integration_signout_submit_still_calls_action', async () => {
    mockSignOutAction.mockResolvedValue(undefined);
    const user = userEvent.setup();
    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => expect(mockSignOutAction).toHaveBeenCalled());
  });

  it('a11y_signout_button_disabled_announces_state', async () => {
    let resolveSignOut: () => void;
    mockSignOutAction.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSignOut = resolve;
        }),
    );
    const user = userEvent.setup();
    render(<SignOutButton />);
    await user.click(screen.getByRole('button', { name: /sign out/i }));
    await waitFor(() => {
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(btn.getAttribute('disabled')).not.toBeNull();
    });
    await act(async () => resolveSignOut!());
  });

  it('edge_signout_pending_disables_button', async () => {
    let resolveSignOut: () => void;
    mockSignOutAction.mockImplementation(
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
    await act(async () => resolveSignOut!());
  });

  it('infra_signout_imports_button_primitive', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/components/account/SignOutButton.tsx'),
      'utf-8',
    );
    expect(src).toMatch(/from\s+['"]@\/components\/brand\/Button['"]/);
  });

  it('infra_signout_no_legacy_classes_in_source', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/components/account/SignOutButton.tsx'),
      'utf-8',
    );
    expect(src).not.toMatch(/border-mist\s+px-/);
    expect(src).not.toMatch(/text-muted\s+hover/);
  });
});
