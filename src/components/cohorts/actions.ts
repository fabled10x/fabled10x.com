'use server';

import { z } from 'zod';
import { eq, and } from 'drizzle-orm';
import { Resend } from 'resend';
import { db, schema } from '@/db/client';
import { auth } from '@/auth';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { sendCohortWaitlistConfirmation } from '@/lib/email/cohort-waitlist-confirmation';
import { sendCohortApplicationReceived } from '@/lib/email/cohort-application-received';
import { CohortApplicationInputSchema } from '@/content/schemas/validators';

const WaitlistInputSchema = z.object({
  email: z.email().max(254),
  cohortSlug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, 'invalid slug'),
  sourceTag: z.string().max(128).optional(),
});

export type WaitlistState =
  | { status: 'idle' }
  | { status: 'success'; message: string }
  | { status: 'error'; message: string };

export async function submitWaitlist(
  _prev: WaitlistState,
  formData: FormData,
): Promise<WaitlistState> {
  const parsed = WaitlistInputSchema.safeParse({
    email: formData.get('email'),
    cohortSlug: formData.get('cohortSlug'),
    sourceTag: formData.get('sourceTag') ?? undefined,
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email.' };
  }

  const { email, cohortSlug, sourceTag } = parsed.data;

  const cohort = await getCohortBySlug(cohortSlug);
  if (!cohort) {
    return { status: 'error', message: 'Cohort not found.' };
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;

  const inserted = await db
    .insert(schema.cohortWaitlist)
    .values({ email, cohortSlug, sourceTag: sourceTag ?? null, userId })
    .onConflictDoNothing({
      target: [schema.cohortWaitlist.email, schema.cohortWaitlist.cohortSlug],
    })
    .returning();

  if (inserted.length === 0) {
    return {
      status: 'success',
      message: "You're already on the waitlist for this cohort.",
    };
  }

  const audienceId = process.env.RESEND_COHORT_WAITLIST_AUDIENCE_ID;
  const apiKey = process.env.RESEND_API_KEY;
  if (audienceId && apiKey) {
    try {
      const resend = new Resend(apiKey);
      await resend.contacts.create({
        audienceId,
        email,
        unsubscribed: false,
      });
    } catch {
      // Best-effort — DB row is the canonical record.
    }
  }

  try {
    await sendCohortWaitlistConfirmation({ to: email, cohort });
  } catch {
    // best-effort
  }

  return {
    status: 'success',
    message: "You're on the waitlist. We'll email you when applications open.",
  };
}

export type ApplicationFieldErrors = Partial<
  Record<
    | 'background'
    | 'goals'
    | 'commitmentLevel'
    | 'commitmentHours'
    | 'timezone'
    | 'pillarInterest'
    | 'referralSource'
    | 'cohortSlug'
    | '_form',
    string
  >
>;

export type ApplicationState =
  | { status: 'idle' }
  | { status: 'error'; fieldErrors: ApplicationFieldErrors }
  | { status: 'success'; applicationId: string };

function flattenZodFieldErrors(
  err: z.ZodError,
): ApplicationFieldErrors {
  const out: ApplicationFieldErrors = {};
  for (const issue of err.issues) {
    const path = issue.path[0];
    if (typeof path === 'string') {
      const key = path as keyof ApplicationFieldErrors;
      if (!out[key]) out[key] = issue.message;
    }
  }
  return out;
}

export async function submitApplication(
  _prev: ApplicationState,
  formData: FormData,
): Promise<ApplicationState> {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return {
      status: 'error',
      fieldErrors: { _form: 'You must be signed in to apply.' },
    };
  }

  const parsed = CohortApplicationInputSchema.safeParse({
    cohortSlug: formData.get('cohortSlug'),
    background: formData.get('background'),
    goals: formData.get('goals'),
    commitmentLevel: formData.get('commitmentLevel'),
    commitmentHours: formData.get('commitmentHours'),
    timezone: formData.get('timezone'),
    pillarInterest: formData.get('pillarInterest'),
    referralSource: formData.get('referralSource') ?? undefined,
  });

  if (!parsed.success) {
    return {
      status: 'error',
      fieldErrors: flattenZodFieldErrors(parsed.error),
    };
  }

  const input = parsed.data;
  const cohort = await getCohortBySlug(input.cohortSlug);
  if (!cohort) {
    return {
      status: 'error',
      fieldErrors: { _form: 'Cohort not found.' },
    };
  }

  if (cohort.meta.status !== 'open') {
    return {
      status: 'error',
      fieldErrors: {
        _form: 'Applications are not open for this cohort.',
      },
    };
  }

  // Best-effort waitlist row match (cohortSlug + applicant email).
  // userId is nullable on cohort_waitlist (anonymous join allowed), so
  // we key on email, not session.user.id.
  let waitlistId: string | null = null;
  try {
    const [waitlistRow] = await db
      .select({ id: schema.cohortWaitlist.id })
      .from(schema.cohortWaitlist)
      .where(
        and(
          eq(schema.cohortWaitlist.cohortSlug, input.cohortSlug),
          eq(schema.cohortWaitlist.email, session.user.email),
        ),
      )
      .limit(1);
    if (waitlistRow?.id) waitlistId = waitlistRow.id;
  } catch {
    // Lookup is best-effort — null waitlistId is allowed.
  }

  let inserted: { id: string }[] = [];
  try {
    inserted = await db
      .insert(schema.cohortApplications)
      .values({
        cohortSlug: input.cohortSlug,
        userId: session.user.id,
        background: input.background,
        goals: input.goals,
        commitmentLevel: input.commitmentLevel,
        commitmentHours: input.commitmentHours,
        timezone: input.timezone,
        pillarInterest: input.pillarInterest,
        referralSource: input.referralSource ?? null,
        waitlistId,
      })
      .returning({ id: schema.cohortApplications.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : '';
    if (/duplicate key|unique constraint/i.test(message)) {
      return {
        status: 'error',
        fieldErrors: {
          _form: 'You have already applied to this cohort.',
        },
      };
    }
    return {
      status: 'error',
      fieldErrors: { _form: 'Something went wrong. Please try again.' },
    };
  }

  const applicationId = inserted[0]?.id;
  if (!applicationId) {
    return {
      status: 'error',
      fieldErrors: { _form: 'Something went wrong. Please try again.' },
    };
  }

  try {
    await sendCohortApplicationReceived({
      to: session.user.email,
      cohort,
    });
  } catch {
    // best-effort email
  }

  return { status: 'success', applicationId };
}
