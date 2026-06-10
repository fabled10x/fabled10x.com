import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RootError from '../error';

// styling-overhaul-7.6 — RootError reskinned to the editorial brand system:
// Marble surface, Container width="prose", DropAccent "✕", Button retry.
// 'use client' directive, unstable_retry callback, and console.error logging
// are all preserved.

describe('RootError (brand reskin 7.6)', () => {
  const mockError = Object.assign(new Error('Test error'), { digest: 'abc123' });
  const mockRetry = vi.fn();

  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    mockRetry.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // --- Unit ---

  it('unit_error_heading', () => {
    render(<RootError error={mockError} unstable_retry={mockRetry} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('unit_error_retry_button', () => {
    render(<RootError error={mockError} unstable_retry={mockRetry} />);
    expect(
      screen.getByRole('button', { name: /try again/i }),
    ).toBeInTheDocument();
  });

  // --- Integration (brand surface) ---

  it('int_error_marble_prose_surface', () => {
    const { container } = render(
      <RootError error={mockError} unstable_retry={mockRetry} />,
    );
    expect(
      container.querySelector('[class*="bg-(--color-marble)"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[class*="max-w-prose"]'),
    ).toBeInTheDocument();
  });

  // --- Accessibility ---

  it('a11y_error_retry_button_name', () => {
    render(<RootError error={mockError} unstable_retry={mockRetry} />);
    const button = screen.getByRole('button', { name: /try again/i });
    expect(button.textContent!.trim().length).toBeGreaterThan(0);
  });

  // --- Error recovery ---

  it('err_error_retry_invokes_callback', async () => {
    const user = userEvent.setup();
    render(<RootError error={mockError} unstable_retry={mockRetry} />);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('err_error_logs_to_console_on_mount', () => {
    render(<RootError error={mockError} unstable_retry={mockRetry} />);
    expect(console.error).toHaveBeenCalled();
  });

  // --- Infrastructure ---

  it('infra_error_use_client_directive', () => {
    const filePath = path.resolve(__dirname, '../error.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content.trimStart().startsWith("'use client'")).toBe(true);
  });
});
