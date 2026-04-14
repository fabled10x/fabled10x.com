import { describe, it, expect, vi } from 'vitest';

// Mock @/auth so importing LoginPage → SignInForm → @/auth doesn't trigger
// the DATABASE_URL guard in src/db/client.ts (not needed for these UI tests).
vi.mock('@/auth', () => ({
  signIn: vi.fn(async () => undefined),
}));

import { render, screen } from '@testing-library/react';

import LoginPage, { metadata } from '../page';

async function renderLogin(
  searchParams: { callbackUrl?: string } = {},
): Promise<ReturnType<typeof render>> {
  const ui = await LoginPage({
    searchParams: Promise.resolve(searchParams),
  });
  return render(ui);
}

describe('LoginPage', () => {
  // --- Unit ---

  it('unit_loginpage_renders_heading', async () => {
    await renderLogin();
    expect(
      screen.getByRole('heading', { level: 1, name: /sign in/i }),
    ).toBeInTheDocument();
  });

  it('unit_loginpage_signinform_receives_callbackurl', async () => {
    await renderLogin({ callbackUrl: '/products/account/purchases/abc' });
    const hidden = document.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement | null;
    expect(hidden).not.toBeNull();
    expect(hidden?.value).toBe('/products/account/purchases/abc');
  });

  it('unit_loginpage_signinform_default_callbackurl', async () => {
    await renderLogin();
    const hidden = document.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement | null;
    expect(hidden).not.toBeNull();
    expect(hidden?.value).toBe('/products/account');
  });

  it('unit_loginpage_metadata_noindex', () => {
    expect(metadata.title).toBe('Sign in');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // --- Security ---

  it('sec_login_pages_no_session_data_leak', async () => {
    await renderLogin({ callbackUrl: '/products/account' });
    // LoginPage must not render user identifiers or session metadata.
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/session[_-]?id/i);
    expect(text).not.toMatch(/access[_-]?token/i);
    expect(text).not.toMatch(/user[_-]?id\s*[:=]/i);
  });

  // --- Accessibility ---

  it('a11y_loginpage_heading_hierarchy', async () => {
    await renderLogin();
    const h1s = document.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toMatch(/sign in/i);
  });

  // --- Edge case ---

  it('edge_loginpage_empty_searchparams', async () => {
    await renderLogin({});
    const hidden = document.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement | null;
    expect(hidden?.value).toBe('/products/account');
  });
});
