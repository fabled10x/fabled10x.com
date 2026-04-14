'use client';

import { useTransition } from 'react';
import { signOut } from '@/auth';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await signOut({ redirectTo: '/' });
        });
      }}
    >
      <button
        type="submit"
        disabled={isPending}
        className="rounded-md border border-mist px-4 py-2 text-sm text-muted hover:border-accent hover:text-accent disabled:opacity-60"
      >
        {isPending ? 'Signing out\u2026' : 'Sign out'}
      </button>
    </form>
  );
}
