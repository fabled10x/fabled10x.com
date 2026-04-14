import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BuyButton } from '../BuyButton';

vi.mock('@/lib/stripe/checkout', () => ({
  createCheckoutSession: vi.fn(),
}));

import { createCheckoutSession } from '@/lib/stripe/checkout';

const mockCheckout = vi.mocked(createCheckoutSession);

describe('BuyButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Unit ---

  it('unit_buybutton_is_client_component: source file has "use client" directive', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/products/BuyButton.tsx',
    );
    const source = readFileSync(filePath, 'utf-8');
    const firstLine = source
      .split('\n')
      .find((line) => line.trim().length > 0 && !line.trim().startsWith('//'));
    expect(firstLine).toMatch(/^\s*['"]use client['"];?\s*$/);
  });

  it('unit_buybutton_renders_buy_now: renders "Buy now" button', () => {
    render(<BuyButton productSlug="workflow-templates" />);
    expect(screen.getByRole('button', { name: /buy now/i })).toBeInTheDocument();
  });

  it('unit_buybutton_click_calls_action: clicking Buy now calls createCheckoutSession with slug', async () => {
    mockCheckout.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<BuyButton productSlug="workflow-templates" />);
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    await waitFor(() => {
      expect(mockCheckout).toHaveBeenCalledWith('workflow-templates');
    });
  });

  it('unit_buybutton_pending_state: button is disabled and shows "Preparing checkout..." while pending', async () => {
    let resolveCheckout: () => void;
    mockCheckout.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCheckout = resolve; }),
    );
    const user = userEvent.setup();

    render(<BuyButton productSlug="workflow-templates" />);
    // Start checkout (don't await the click since the action will pend)
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent(/preparing checkout/i);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    // Resolve to clean up
    await act(async () => resolveCheckout!());
  });

  // --- Integration ---

  it('int_buybutton_error_display: shows error message when checkout action throws', async () => {
    mockCheckout.mockRejectedValue(new Error('Stripe error'));
    const user = userEvent.setup();

    render(<BuyButton productSlug="workflow-templates" />);
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not start checkout/i)).toBeInTheDocument();
    });
  });

  // --- Error Recovery ---

  it('err_buybutton_checkout_failure: button re-enables after error', async () => {
    mockCheckout.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();

    render(<BuyButton productSlug="workflow-templates" />);
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    await waitFor(() => {
      const button = screen.getByRole('button', { name: /buy now/i });
      expect(button).not.toBeDisabled();
    });
  });

  // --- Accessibility ---

  it('a11y_buybutton_error_alert: error message has role="alert"', async () => {
    mockCheckout.mockRejectedValue(new Error('Checkout failed'));
    const user = userEvent.setup();

    render(<BuyButton productSlug="workflow-templates" />);
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(
        /could not start checkout/i,
      );
    });
  });

  it('a11y_buybutton_disabled_state: button has disabled attribute during pending checkout', async () => {
    let resolveCheckout: () => void;
    mockCheckout.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCheckout = resolve; }),
    );
    const user = userEvent.setup();

    render(<BuyButton productSlug="workflow-templates" />);
    await user.click(screen.getByRole('button', { name: /buy now/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    await act(async () => resolveCheckout!());
  });
});
