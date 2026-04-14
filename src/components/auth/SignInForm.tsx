'use client';

import { useActionState } from 'react';
import { signIn } from '@/auth';

interface SignInFormProps {
  callbackUrl: string;
}

type SignInState =
  | { status: 'idle' }
  | { status: 'error'; message: string };

async function signInAction(
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const email = formData.get('email');
  const callbackUrl = formData.get('callbackUrl');
  if (typeof email !== 'string' || !email.includes('@')) {
    return { status: 'error', message: 'Enter a valid email address.' };
  }
  try {
    await signIn('resend', {
      email,
      redirectTo:
        typeof callbackUrl === 'string' ? callbackUrl : '/products/account',
    });
    return { status: 'idle' };
  } catch {
    return {
      status: 'error',
      message: 'Something went wrong sending the link. Try again in a moment.',
    };
  }
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
        {isPending ? 'Sending link…' : 'Send me a sign-in link'}
      </button>
    </form>
  );
}
