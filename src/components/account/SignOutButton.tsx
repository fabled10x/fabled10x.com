'use client';

import { useTransition } from 'react';
import { signOutAction } from '@/lib/actions/auth';
import { Button } from '@/components/brand/Button';

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <form
      action={() => {
        startTransition(async () => {
          await signOutAction();
        });
      }}
    >
      <Button type="submit" variant="ghost" size="sm" disabled={isPending}>
        {isPending ? 'Signing out…' : 'Sign out'}
      </Button>
    </form>
  );
}
