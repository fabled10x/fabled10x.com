import { describe, it, expect, vi } from 'vitest';

// Mock @/auth so importing LoginPage → SignInForm → @/auth doesn't trigger
// the DATABASE_URL guard in src/db/client.ts (not needed for these UI tests).
vi.mock('@/auth', () => ({
  signIn: vi.fn(async () => undefined),
}));

import { render, screen } from '@testing-library/react';

import LoginPage, { metadata } from '../page';

// styling-overhaul-7.6 — Login reskinned to the editorial brand system:
// Marble surface, Container width="prose", "Account" eyebrow, display-2
// heading. SignInForm + callbackUrl wiring preserved unchanged.

async function renderLogin(
  searchParams: { callbackUrl?: string } = {},
): Promise<ReturnType<typeof render>> {
  const ui = await LoginPage({
    searchParams: Promise.resolve(searchParams),
  });
  return render(ui);
}

describe('LoginPage (brand reskin 7.6)', () => {
  // --- Unit ---

  it('unit_login_h1_renders', async () => {
    await renderLogin();
    expect(
      screen.getByRole('heading', { level: 1, name: /sign in to the library/i }),
    ).toBeInTheDocument();
  });

  it('unit_login_eyebrow_account', async () => {
    const { container } = await renderLogin();
    const label = container.querySelector('.label');
    expect(label).toBeInTheDocument();
    expect(label).toHaveTextContent(/account/i);
  });

  it('unit_login_signinform_default_callbackurl', async () => {
    await renderLogin();
    const hidden = document.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement | null;
    expect(hidden).not.toBeNull();
    expect(hidden?.value).toBe('/products/account');
  });

  it('unit_login_signinform_passes_callbackurl', async () => {
    await renderLogin({ callbackUrl: '/products/account/purchases/abc' });
    const hidden = document.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement | null;
    expect(hidden?.value).toBe('/products/account/purchases/abc');
  });

  it('unit_login_metadata_noindex', () => {
    expect(metadata.title).toBe('Sign in');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // --- Integration (brand surface) ---

  it('int_login_marble_prose_surface', async () => {
    const { container } = await renderLogin();
    expect(
      container.querySelector('[class*="bg-(--color-marble)"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[class*="max-w-prose"]'),
    ).toBeInTheDocument();
  });

  // --- Security ---

  it('sec_login_no_session_leak', async () => {
    await renderLogin({ callbackUrl: '/products/account' });
    const text = document.body.textContent ?? '';
    expect(text).not.toMatch(/session[_-]?id/i);
    expect(text).not.toMatch(/access[_-]?token/i);
    expect(text).not.toMatch(/user[_-]?id\s*[:=]/i);
  });

  // --- Accessibility ---

  it('a11y_login_single_h1', async () => {
    await renderLogin();
    const h1s = document.querySelectorAll('h1');
    expect(h1s.length).toBe(1);
    expect(h1s[0].textContent).toMatch(/sign in to the library/i);
  });

  // --- Infrastructure ---

  it('infra_login_metadata_noindex', () => {
    expect(metadata.title).toBe('Sign in');
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  // --- Edge case ---

  it('edge_login_empty_searchparams', async () => {
    await renderLogin({});
    const hidden = document.querySelector(
      'input[name="callbackUrl"]',
    ) as HTMLInputElement | null;
    expect(hidden?.value).toBe('/products/account');
  });
});
