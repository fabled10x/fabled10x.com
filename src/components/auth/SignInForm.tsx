'use client';

import { useActionState } from 'react';
import { signInAction, type SignInState } from '@/lib/actions/auth';
import { Button } from '@/components/brand/Button';

interface SignInFormProps {
  callbackUrl: string;
}

export function SignInForm({ callbackUrl }: SignInFormProps) {
  const [state, formAction, isPending] = useActionState<SignInState, FormData>(
    signInAction,
    { status: 'idle' },
  );

  return (
    <form action={formAction} className="flex flex-col gap-(--space-4)">
      <input type="hidden" name="callbackUrl" value={callbackUrl} />
      <label className="flex flex-col gap-(--space-1)">
        <span className="label">Email</span>
        <input
          type="email"
          name="email"
          required
          autoComplete="email"
          className="bg-transparent border-0 border-b border-(--color-ink) focus:outline-none focus:border-(--color-oxblood) py-(--space-2) body-1 placeholder:text-(--color-muted)"
        />
      </label>
      {state.status === 'error' ? (
        <p
          role="alert"
          className="body-3 text-(--color-oxblood)"
        >
          {state.message}
        </p>
      ) : null}
      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Sending link…' : 'Send me a sign-in link'}
      </Button>
    </form>
  );
}
