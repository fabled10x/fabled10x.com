'use server';

import { z } from 'zod';
import { Resend } from 'resend';
import { db, schema } from '@/db/client';
import { auth } from '@/auth';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { sendCohortWaitlistConfirmation } from '@/lib/email/cohort-waitlist-confirmation';

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
