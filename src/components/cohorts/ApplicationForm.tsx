'use client';

import { useActionState } from 'react';
import {
  APPLICATION_COMMITMENT_LEVELS,
  APPLICATION_COMMITMENT_LEVEL_LABELS,
} from '@/content/schemas/cohort-application';
import {
  CONTENT_PILLARS,
  type ContentPillar,
} from '@/content/schemas/content-pillar';

const PILLAR_LABELS: Record<ContentPillar, string> = {
  delivery: 'Delivery — what AI agents can actually ship',
  workflow: 'Workflow — managing AI agents on complex projects',
  business: 'Business — running this as a business',
  future: 'Future — where this model is heading',
};
import {
  submitApplication,
  type ApplicationState,
  type ApplicationFieldErrors,
} from './actions';

const INITIAL: ApplicationState = { status: 'idle' };

interface ApplicationFormProps {
  cohortSlug: string;
}

function fieldErrorId(field: keyof ApplicationFieldErrors): string {
  return `application-${field}-error`;
}

export function ApplicationForm({ cohortSlug }: ApplicationFormProps) {
  const [state, formAction, isPending] = useActionState(
    submitApplication,
    INITIAL,
  );

  const fieldErrors: ApplicationFieldErrors =
    state.status === 'error' ? state.fieldErrors : {};

  if (state.status === 'success') {
    return (
      <div
        role="status"
        className="rounded-md border border-accent/40 bg-accent/5 p-6"
      >
        <h3 className="font-display text-xl font-semibold">
          Thanks — your application has been received.
        </h3>
        <p className="mt-3 text-sm text-muted">
          We&apos;ll review it editorially and email you a decision within two
          weeks of the cohort&apos;s application close date.
        </p>
        <p className="mt-2 text-xs text-muted">
          Reference: <code className="font-mono">{state.applicationId}</code>
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex flex-col gap-6">
      <input type="hidden" name="cohortSlug" value={cohortSlug} />

      {fieldErrors._form ? (
        <p
          role="alert"
          id={fieldErrorId('_form')}
          className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700"
        >
          {fieldErrors._form}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="application-background"
          className="block text-sm font-medium"
        >
          Background
        </label>
        <p className="mt-1 text-xs text-muted">
          A couple of sentences about who you are and what you ship.
        </p>
        <textarea
          id="application-background"
          name="background"
          required
          rows={5}
          minLength={80}
          maxLength={2000}
          disabled={isPending}
          aria-describedby={
            fieldErrors.background ? fieldErrorId('background') : undefined
          }
          className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {fieldErrors.background ? (
          <p
            role="alert"
            id={fieldErrorId('background')}
            className="mt-1 text-xs text-red-600"
          >
            {fieldErrors.background}
          </p>
        ) : null}
      </div>

      <div>
        <label
          htmlFor="application-goals"
          className="block text-sm font-medium"
        >
          Goals for this cohort
        </label>
        <p className="mt-1 text-xs text-muted">
          What concrete outcome are you aiming for by the end?
        </p>
        <textarea
          id="application-goals"
          name="goals"
          required
          rows={4}
          minLength={40}
          maxLength={1500}
          disabled={isPending}
          aria-describedby={
            fieldErrors.goals ? fieldErrorId('goals') : undefined
          }
          className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {fieldErrors.goals ? (
          <p
            role="alert"
            id={fieldErrorId('goals')}
            className="mt-1 text-xs text-red-600"
          >
            {fieldErrors.goals}
          </p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="application-commitment-level"
            className="block text-sm font-medium"
          >
            Commitment level
          </label>
          <select
            id="application-commitment-level"
            name="commitmentLevel"
            required
            disabled={isPending}
            defaultValue="standard"
            aria-describedby={
              fieldErrors.commitmentLevel
                ? fieldErrorId('commitmentLevel')
                : undefined
            }
            className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {APPLICATION_COMMITMENT_LEVELS.map((level) => (
              <option key={level} value={level}>
                {APPLICATION_COMMITMENT_LEVEL_LABELS[level]}
              </option>
            ))}
          </select>
          {fieldErrors.commitmentLevel ? (
            <p
              role="alert"
              id={fieldErrorId('commitmentLevel')}
              className="mt-1 text-xs text-red-600"
            >
              {fieldErrors.commitmentLevel}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="application-commitment-hours"
            className="block text-sm font-medium"
          >
            Hours per week
          </label>
          <input
            id="application-commitment-hours"
            name="commitmentHours"
            type="number"
            required
            min={1}
            max={80}
            step={1}
            disabled={isPending}
            aria-describedby={
              fieldErrors.commitmentHours
                ? fieldErrorId('commitmentHours')
                : undefined
            }
            className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {fieldErrors.commitmentHours ? (
            <p
              role="alert"
              id={fieldErrorId('commitmentHours')}
              className="mt-1 text-xs text-red-600"
            >
              {fieldErrors.commitmentHours}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label
            htmlFor="application-timezone"
            className="block text-sm font-medium"
          >
            Timezone (IANA)
          </label>
          <input
            id="application-timezone"
            name="timezone"
            type="text"
            required
            maxLength={64}
            placeholder="America/New_York"
            disabled={isPending}
            aria-describedby={
              fieldErrors.timezone ? fieldErrorId('timezone') : undefined
            }
            className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
          {fieldErrors.timezone ? (
            <p
              role="alert"
              id={fieldErrorId('timezone')}
              className="mt-1 text-xs text-red-600"
            >
              {fieldErrors.timezone}
            </p>
          ) : null}
        </div>

        <div>
          <label
            htmlFor="application-pillar-interest"
            className="block text-sm font-medium"
          >
            Pillar interest
          </label>
          <select
            id="application-pillar-interest"
            name="pillarInterest"
            required
            disabled={isPending}
            defaultValue="delivery"
            aria-describedby={
              fieldErrors.pillarInterest
                ? fieldErrorId('pillarInterest')
                : undefined
            }
            className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          >
            {CONTENT_PILLARS.map((pillar) => (
              <option key={pillar} value={pillar}>
                {PILLAR_LABELS[pillar]}
              </option>
            ))}
          </select>
          {fieldErrors.pillarInterest ? (
            <p
              role="alert"
              id={fieldErrorId('pillarInterest')}
              className="mt-1 text-xs text-red-600"
            >
              {fieldErrors.pillarInterest}
            </p>
          ) : null}
        </div>
      </div>

      <div>
        <label
          htmlFor="application-referral-source"
          className="block text-sm font-medium"
        >
          Referral source <span className="text-muted">(optional)</span>
        </label>
        <p className="mt-1 text-xs text-muted">
          How did you hear about this cohort?
        </p>
        <input
          id="application-referral-source"
          name="referralSource"
          type="text"
          maxLength={200}
          disabled={isPending}
          aria-describedby={
            fieldErrors.referralSource
              ? fieldErrorId('referralSource')
              : undefined
          }
          className="mt-2 w-full rounded-md border border-mist bg-parchment px-3 py-2 text-sm shadow-sm focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
        />
        {fieldErrors.referralSource ? (
          <p
            role="alert"
            id={fieldErrorId('referralSource')}
            className="mt-1 text-xs text-red-600"
          >
            {fieldErrors.referralSource}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="self-start rounded-md bg-accent px-5 py-3 text-sm font-semibold text-parchment hover:bg-accent/90 disabled:opacity-60"
      >
        {isPending ? 'Submitting…' : 'Submit application'}
      </button>
    </form>
  );
}
