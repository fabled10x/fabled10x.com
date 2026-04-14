'use client';

import { useActionState } from 'react';
import { signInAction, type SignInState } from '@/lib/actions/auth';

interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signInAction,
    { status: 'idle' },
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-semibold">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="rounded-md border border-mist bg-background px-4 py-3 text-foreground"
        />
      </label>
      {state.status === 'error' ? (
        <p className="text-sm text-red-600" role="alert">
          {state.message}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-accent px-6 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
      >
        {isPending ? 'Sending link\u2026' : 'Send me a sign-in link'}
      </button>
    </form>
  );
}
