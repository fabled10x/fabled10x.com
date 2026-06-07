'use client';

import { useActionState } from 'react';

import { Bone } from '@/components/brand/Bone';
import { Button } from '@/components/brand/Button';

import { captureEmail, type CaptureState } from './actions';

const initialState: CaptureState = { status: 'idle' };

interface EmailCaptureProps {
  source: string;
  placeholder?: string;
  buttonLabel?: string;
}

export function EmailCapture({
  source,
  placeholder = 'you@somewhere.dev',
  buttonLabel = 'Join the library',
}: EmailCaptureProps) {
  const [state, formAction, pending] = useActionState(captureEmail, initialState);

  if (state.status === 'success') {
    return (
      <Bone edge="subtle" className="p-(--space-5) flex items-center gap-(--space-3)">
        <span aria-hidden="true" className="text-(--color-verdigris) text-2xl">
          ✓
        </span>
        <div>
          <p className="label">Welcome to the library.</p>
          <p className="body-3 mt-(--space-1)">
            Episode notifications begin with the next release.
          </p>
        </div>
      </Bone>
    );
  }

  const inputId = `email-${source}`;

  return (
    <Bone edge="subtle" className="p-(--space-5)">
      <form
        action={formAction}
        aria-label="Email capture"
        className="flex flex-col gap-(--space-3) md:flex-row md:items-end"
      >
        <input type="hidden" name="source" value={source} />
        <label
          htmlFor={inputId}
          className="flex-1 flex flex-col gap-(--space-1)"
        >
          <span className="label">Email</span>
          <input
            id={inputId}
            type="email"
            name="email"
            required
            placeholder={placeholder}
            className="bg-transparent border-0 border-b border-(--color-ink) focus:outline-none focus:border-(--color-oxblood) py-(--space-2) body-1 placeholder:text-(--color-muted)"
          />
        </label>
        <Button type="submit" disabled={pending}>
          {pending ? 'Sending…' : buttonLabel}
        </Button>
      </form>
      {state.status === 'error' && (
        <p
          role="alert"
          className="body-3 mt-(--space-2) text-(--color-oxblood)"
        >
          {state.message}
        </p>
      )}
    </Bone>
  );
}
