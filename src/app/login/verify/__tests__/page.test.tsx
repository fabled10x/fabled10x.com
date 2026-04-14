import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

import VerifyPage, { metadata } from '../page';

describe('VerifyPage', () => {
  it('unit_verifypage_renders_check_email', () => {
    render(<VerifyPage />);
    expect(
      screen.getByRole('heading', { level: 1 }),
    ).toHaveTextContent(/sign.?in link sent/i);
    expect(screen.getByText(/check your email/i)).toBeInTheDocument();
  });

  it('unit_verifypage_metadata_noindex', () => {
    expect(metadata.title).toBe('Check your email');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });
});
