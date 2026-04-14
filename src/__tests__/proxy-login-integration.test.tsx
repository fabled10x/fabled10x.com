import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const signInMock = vi.fn(async () => undefined);

vi.mock('@/auth', () => ({
  signIn: (...args: unknown[]) => signInMock(...(args as [])),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { proxy } from '../../proxy';
import LoginPage from '../app/login/page';

describe('integration: proxy redirect → login page → signIn with same callbackUrl', () => {
  beforeEach(() => {
    signInMock.mockClear();
  });

  it('integration_middleware_callbackurl_roundtrip', async () => {
    // 1. Anonymous request to gated path is redirected by the proxy
    const req = new NextRequest(
      new URL('/products/account/purchases/abc', 'http://localhost:3000'),
    );
    const res = proxy(req);
    expect(res.status).toBe(307);
    const location = res.headers.get('location') ?? '';
    const redirectUrl = new URL(location, 'http://localhost:3000');
    expect(redirectUrl.pathname).toBe('/login');
    const callbackUrl = redirectUrl.searchParams.get('callbackUrl');
    expect(callbackUrl).toBe('/products/account/purchases/abc');

    // 2. LoginPage reads callbackUrl from searchParams and forwards it to
    //    SignInForm, which submits it as redirectTo.
    const ui = await LoginPage({
      searchParams: Promise.resolve({
        callbackUrl: callbackUrl ?? undefined,
      }),
    });
    render(ui);
    const user = userEvent.setup();
    await user.type(screen.getByRole('textbox'), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(signInMock).toHaveBeenCalled());
    const args = signInMock.mock.calls[0] as [string, Record<string, string>];
    expect(args[1].redirectTo).toBe('/products/account/purchases/abc');
  });
});
