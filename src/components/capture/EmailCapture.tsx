'use client';

import { useActionState } from 'react';
import { captureEmail, type CaptureState } from './actions';

const initialState: CaptureState = { status: 'idle' };

interface EmailCaptureProps {
  source: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function EmailCapture({
  source,
  placeholder = 'you@domain.com',
  buttonLabel = 'Get the updates',
}: EmailCaptureProps) {
  const [state, formAction, isPending] = useActionState(captureEmail, initialState);

  if (state.status === 'success') {
    return (
      <p className="rounded-md border border-mist p-4 text-sm text-foreground">
        You&apos;re on the list. Check your inbox.
      </p>
    );
  }

  const inputId = `email-${source}`;

  return (
    <form action={formAction} aria-label="Email capture" className="space-y-3">
      <input type="hidden" name="source" value={source} />
      <div className="flex gap-2">
        <label className="sr-only" htmlFor={inputId}>
          Email address
        </label>
        <input
          id={inputId}
          name="email"
          type="email"
          required
          placeholder={placeholder}
          className="flex-1 rounded-md border border-mist bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-parchment hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? 'Sending…' : buttonLabel}
        </button>
      </div>
      {state.status === 'error' && (
        <p className="text-sm text-accent">{state.message}</p>
      )}
    </form>
  );
}
