import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import VerifyPage, { metadata } from '../page';

// styling-overhaul-7.6 — Verify reskinned to the editorial brand system:
// Marble surface, Container width="prose", "Check your email" eyebrow,
// display-2 heading with DropAccent "✓".

describe('VerifyPage (brand reskin 7.6)', () => {
  // --- Unit ---

  it('unit_verify_h1_renders', () => {
    render(<VerifyPage />);
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent(/sign.?in link is on its way/i);
  });

  it('unit_verify_eyebrow_check_email', () => {
    const { container } = render(<VerifyPage />);
    const label = container.querySelector('.label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent(/check your email/i);
  });

  it('unit_verify_metadata_noindex', () => {
    expect(metadata.title).toBe('Check your email');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // --- Integration (brand surface) ---

  it('int_verify_marble_prose_surface', () => {
    const { container } = render(<VerifyPage />);
    expect(
      container.querySelector('[class*="bg-(--color-marble)"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[class*="max-w-prose"]'),
    ).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_verify_single_h1', () => {
    render(<VerifyPage />);
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
  });

  // --- Infrastructure ---

  it('infra_verify_metadata_noindex', () => {
    expect(metadata.title).toBe('Check your email');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
