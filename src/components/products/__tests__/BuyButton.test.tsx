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

const DEFAULT_PROPS = {
  productSlug: 'workflow-templates',
  priceCents: 4900,
  currency: 'usd',
};

function rootButton(container: HTMLElement): HTMLElement {
  // BuyButton renders <div><button/>[error]</div>. The button is the chrome target.
  const btn = container.querySelector('button');
  expect(btn).not.toBeNull();
  return btn as HTMLElement;
}

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

  it('unit_buybutton_renders_buy_now: renders Buy button with price in label', () => {
    render(<BuyButton {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: /buy/i })).toBeInTheDocument();
  });

  it('unit_buybutton_click_calls_action: clicking Buy calls createCheckoutSession with slug', async () => {
    mockCheckout.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(mockCheckout).toHaveBeenCalledWith('workflow-templates');
    });
  });

  it('unit_buybutton_pending_state: button disabled and shows "Preparing checkout..." while pending', async () => {
    let resolveCheckout: () => void;
    mockCheckout.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCheckout = resolve; }),
    );
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toHaveTextContent(/preparing checkout/i);
      expect(screen.getByRole('button')).toBeDisabled();
    });

    await act(async () => resolveCheckout!());
  });

  // --- New: Button primitive adoption ---

  it('unit_buybutton_uses_button_primary_variant: button has Button primitive primary variant classes', () => {
    const { container } = render(<BuyButton {...DEFAULT_PROPS} />);
    const btn = rootButton(container);
    expect(btn.className).toMatch(/bg-\(--color-ink\)/);
    expect(btn.className).toMatch(/text-\(--color-marble\)/);
    expect(btn.className).toMatch(/hover:bg-\(--color-oxblood\)/);
  });

  it('unit_buybutton_uses_button_size_lg: button has Button size=lg classes', () => {
    const { container } = render(<BuyButton {...DEFAULT_PROPS} />);
    const btn = rootButton(container);
    expect(btn.className).toMatch(/py-\(--space-3\)/);
    expect(btn.className).toMatch(/px-\(--space-5\)/);
    expect(btn.className).toMatch(/\btext-sm\b/);
  });

  it('unit_buybutton_renders_formatted_price_in_label: label reads "Buy — $49"', () => {
    render(<BuyButton {...DEFAULT_PROPS} />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/Buy\s*[—-]\s*\$49/);
  });

  it('unit_buybutton_renders_currency_symbol_from_prop: EUR shows €, not $', () => {
    render(<BuyButton productSlug="workflow-templates" priceCents={4900} currency="eur" />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/€49/);
    expect(btn.textContent).not.toMatch(/\$49/);
  });

  it('unit_buybutton_no_legacy_bg_accent_classes: legacy "bg-accent text-parchment rounded-md" chrome is gone', () => {
    const { container } = render(<BuyButton {...DEFAULT_PROPS} />);
    const btn = rootButton(container);
    expect(btn.className).not.toMatch(/\bbg-accent\b/);
    expect(btn.className).not.toMatch(/\btext-parchment\b/);
    expect(btn.className).not.toMatch(/\brounded-md\b/);
  });

  // --- Integration ---

  it('int_buybutton_error_display: shows error message when checkout action throws', async () => {
    mockCheckout.mockRejectedValue(new Error('Stripe error'));
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(screen.getByText(/could not start checkout/i)).toBeInTheDocument();
    });
  });

  it('integration_buybutton_click_still_calls_checkout: behavior preserved after chrome swap', async () => {
    mockCheckout.mockResolvedValue(undefined);
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(mockCheckout).toHaveBeenCalledTimes(1);
      expect(mockCheckout).toHaveBeenCalledWith('workflow-templates');
    });
  });

  // --- Edge Cases ---

  it('edge_buybutton_zero_price: priceCents=0 renders "Buy — $0"', () => {
    render(<BuyButton productSlug="freebie" priceCents={0} currency="usd" />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/\$0/);
  });

  it('edge_buybutton_large_price: priceCents=199900 formats as "$1,999"', () => {
    render(<BuyButton productSlug="bundle" priceCents={199900} currency="usd" />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/\$1,999/);
  });

  it('edge_buybutton_lowercase_currency: currency="usd" still produces "$" prefix', () => {
    render(<BuyButton productSlug="x" priceCents={4900} currency="usd" />);
    const btn = screen.getByRole('button');
    expect(btn.textContent).toMatch(/\$49/);
  });

  // --- Error Recovery ---

  it('err_buybutton_checkout_failure: button re-enables after error', async () => {
    mockCheckout.mockRejectedValue(new Error('Network error'));
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /buy/i })).not.toBeDisabled();
    });
  });

  it('err_buybutton_error_alert_preserved: error message still uses role="alert" after chrome swap', async () => {
    mockCheckout.mockRejectedValue(new Error('Stripe down'));
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not start checkout/i);
    });
  });

  // --- Accessibility ---

  it('a11y_buybutton_error_alert: error message has role="alert"', async () => {
    mockCheckout.mockRejectedValue(new Error('Checkout failed'));
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

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

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      expect(screen.getByRole('button')).toBeDisabled();
    });

    await act(async () => resolveCheckout!());
  });

  it('a11y_buybutton_disabled_announces_state: pending state surfaces via disabled attribute (post chrome swap)', async () => {
    let resolveCheckout: () => void;
    mockCheckout.mockImplementation(
      () => new Promise<void>((resolve) => { resolveCheckout = resolve; }),
    );
    const user = userEvent.setup();

    render(<BuyButton {...DEFAULT_PROPS} />);
    await user.click(screen.getByRole('button', { name: /buy/i }));

    await waitFor(() => {
      const btn = screen.getByRole('button');
      expect(btn).toBeDisabled();
      expect(btn.getAttribute('disabled')).not.toBeNull();
    });

    await act(async () => resolveCheckout!());
  });

  // --- Infrastructure ---

  it('infra_buybutton_imports_button_primitive: source imports Button from brand barrel', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/components/products/BuyButton.tsx'),
      'utf-8',
    );
    expect(src).toMatch(/from\s+['"]@\/components\/brand\/Button['"]/);
    expect(src).toMatch(/\bButton\b/);
  });

  it('infra_buybutton_no_legacy_classes_in_source: source no longer contains legacy chrome strings', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/components/products/BuyButton.tsx'),
      'utf-8',
    );
    expect(src).not.toMatch(/bg-accent\s+px-/);
    expect(src).not.toMatch(/text-parchment/);
  });

  it('infra_buybutton_use_client_directive_preserved: source still begins with "use client"', () => {
    const src = readFileSync(
      path.resolve(process.cwd(), 'src/components/products/BuyButton.tsx'),
      'utf-8',
    );
    const firstLine = src
      .split('\n')
      .find((line) => line.trim().length > 0 && !line.trim().startsWith('//'));
    expect(firstLine).toMatch(/^\s*['"]use client['"];?\s*$/);
  });

  // --- Data Integrity ---

  it('data_buybutton_price_format_consistent_with_card: same Intl format as ProductCard', () => {
    // ProductCard uses Intl.NumberFormat('en-US', currency, 0/0 fraction digits).
    // BuyButton must produce the same string for the same inputs.
    render(<BuyButton productSlug="x" priceCents={4900} currency="usd" />);
    const expected = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(4900 / 100);
    expect(screen.getByRole('button').textContent).toContain(expected);
  });

  it('data_buybutton_class_construction_deterministic: 5 renders yield identical className', () => {
    const renders = Array.from({ length: 5 }, () =>
      render(<BuyButton productSlug="x" priceCents={4900} currency="usd" />),
    );
    const classes = renders.map(
      (r) => (r.container.querySelector('button') as HTMLElement).className,
    );
    const unique = new Set(classes);
    expect(unique.size).toBe(1);
    renders.forEach((r) => r.unmount());
  });
});
