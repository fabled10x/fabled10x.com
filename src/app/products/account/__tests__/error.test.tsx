import { vi } from 'vitest';
import fs from 'fs';
import path from 'path';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AccountError from '../error';

describe('AccountError', () => {
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

  it('unit_account_error_heading', () => {
    render(<AccountError error={mockError} unstable_retry={mockRetry} />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('unit_account_error_retry_button', () => {
    render(<AccountError error={mockError} unstable_retry={mockRetry} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  // --- Error recovery ---

  it('err_account_error_retry_callback', async () => {
    const user = userEvent.setup();
    render(<AccountError error={mockError} unstable_retry={mockRetry} />);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('err_account_error_console_log', () => {
    render(<AccountError error={mockError} unstable_retry={mockRetry} />);
    expect(console.error).toHaveBeenCalled();
  });

  // --- Accessibility ---

  it('a11y_account_error_heading_hierarchy', () => {
    render(<AccountError error={mockError} unstable_retry={mockRetry} />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  // --- Infrastructure ---

  it('infra_account_error_use_client', () => {
    const filePath = path.resolve(__dirname, '../error.tsx');
    const content = fs.readFileSync(filePath, 'utf-8');
    expect(content.trimStart().startsWith("'use client'")).toBe(true);
  });
});
