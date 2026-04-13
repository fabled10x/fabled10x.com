import { readFileSync } from 'node:fs';
import path from 'node:path';
import { render, screen } from '@testing-library/react';
import { BuyButton } from '../BuyButton';

describe('BuyButton', () => {
  // --- Unit ---

  it('unit_buybutton_coming_soon_text: renders "Coming soon" label', () => {
    render(<BuyButton productSlug="workflow-templates" />);
    expect(screen.getByText(/coming soon/i)).toBeInTheDocument();
  });

  it('unit_buybutton_disabled_state: button has disabled attribute', () => {
    render(<BuyButton productSlug="workflow-templates" />);
    const button = screen.getByRole('button', { name: /coming soon/i });
    expect(button).toBeDisabled();
  });

  it('unit_buybutton_is_client_component: source file has "use client" directive', () => {
    const filePath = path.resolve(
      process.cwd(),
      'src/components/products/BuyButton.tsx',
    );
    const source = readFileSync(filePath, 'utf-8');
    // 'use client' or "use client" as the first non-comment line
    const firstLine = source
      .split('\n')
      .find((line) => line.trim().length > 0 && !line.trim().startsWith('//'));
    expect(firstLine).toMatch(/^\s*['"]use client['"];?\s*$/);
  });

  // --- Accessibility ---

  it('a11y_buybutton_aria_disabled: button has aria-disabled="true"', () => {
    render(<BuyButton productSlug="workflow-templates" />);
    const button = screen.getByRole('button', { name: /coming soon/i });
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });
});
