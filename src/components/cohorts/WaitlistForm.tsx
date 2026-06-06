'use client';

import { useActionState } from 'react';
import { submitWaitlist, type WaitlistState } from './actions';

const INITIAL: WaitlistState = { status: 'idle' };

interface WaitlistFormProps {
  cohortSlug: string;
  sourceTag?: string;
}

export function WaitlistForm({ cohortSlug, sourceTag }: WaitlistFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitWaitlist,
    INITIAL,
  );
  const inputId = `waitlist-email-${cohortSlug}`;

  return (
    <form
      action={formAction}
      className="flex flex-col gap-3 sm:flex-row sm:items-start"
    >
      <input type="hidden" name="cohortSlug" value={cohortSlug} />
      {sourceTag ? (
        <input type="hidden" name="sourceTag" value={sourceTag} />
      ) : null}
      <label className="sr-only" htmlFor={inputId}>
        Email address
      </label>
      <input
        id={inputId}
        name="email"
        type="email"
        required
        autoComplete="email"
        placeholder="you@example.com"
        disabled={isPending}
        className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30 sm:max-w-xs"
      />
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
      >
        {isPending ? 'Joining…' : 'Join the waitlist'}
      </button>
      {state.status !== 'idle' ? (
        <p
          role="status"
          className={`text-sm sm:w-full ${
            state.status === 'success' ? 'text-foreground' : 'text-red-600'
          }`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
