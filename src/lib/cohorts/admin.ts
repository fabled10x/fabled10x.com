import { and, desc, eq } from 'drizzle-orm';
import { db, schema } from '@/db/client';
import type { CohortApplicationRow } from '@/db/schema';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { sendCohortDecision } from '@/lib/email/cohort-decision';
import { ACCEPTANCE_WINDOW_DAYS } from './constants';

export interface ApplicationListRow extends CohortApplicationRow {
  userEmail: string;
}

export type AdminDecision = 'accepted' | 'waitlisted' | 'declined';

export interface DecideOptions {
  applicationId: string;
  decision: AdminDecision;
  decidedBy: string;
  decisionNote?: string;
}

export async function listApplications(options: {
  cohortSlug?: string;
  decision?: 'pending' | 'accepted' | 'waitlisted' | 'declined';
}): Promise<ApplicationListRow[]> {
  const conditions = [];
  if (options.cohortSlug) {
    conditions.push(eq(schema.cohortApplications.cohortSlug, options.cohortSlug));
  }
  if (options.decision) {
    conditions.push(eq(schema.cohortApplications.decision, options.decision));
  }

  const rows = await db
    .select({
      application: schema.cohortApplications,
      userEmail: schema.users.email,
    })
    .from(schema.cohortApplications)
    .innerJoin(schema.users, eq(schema.cohortApplications.userId, schema.users.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(schema.cohortApplications.submittedAt));

  return rows.map((row) => ({
    ...row.application,
    userEmail: row.userEmail,
  }));
}

export async function getApplication(id: string): Promise<ApplicationListRow | null> {
  const rows = await db
    .select({
      application: schema.cohortApplications,
      userEmail: schema.users.email,
    })
    .from(schema.cohortApplications)
    .innerJoin(schema.users, eq(schema.cohortApplications.userId, schema.users.id))
    .where(eq(schema.cohortApplications.id, id))
    .limit(1);

  const row = rows[0];
  if (!row) return null;
  return { ...row.application, userEmail: row.userEmail };
}

export async function decideApplication({
  applicationId,
  decision,
  decidedBy,
  decisionNote,
}: DecideOptions): Promise<void> {
  const application = await getApplication(applicationId);
  if (!application) {
    throw new Error(`Application ${applicationId} not found`);
  }

  const cohort = await getCohortBySlug(application.cohortSlug);
  if (!cohort) {
    throw new Error(`Cohort ${application.cohortSlug} no longer exists`);
  }

  const acceptedUntil =
    decision === 'accepted'
      ? new Date(Date.now() + ACCEPTANCE_WINDOW_DAYS * 24 * 60 * 60 * 1000)
      : null;

  await db.transaction(async (tx) => {
    await tx
      .insert(schema.cohortAdmissions)
      .values({
        applicationId,
        decidedBy,
        decision,
        decisionNote: decisionNote ?? null,
        acceptedUntil,
      })
      .onConflictDoNothing({
        target: schema.cohortAdmissions.applicationId,
      });

    await tx
      .update(schema.cohortApplications)
      .set({ decision })
      .where(eq(schema.cohortApplications.id, applicationId));
  });

  try {
    await sendCohortDecision({
      to: application.userEmail,
      decision,
      application,
      cohort,
      acceptedUntil,
    });
  } catch {
    // Best-effort — DB rows are the canonical record. Admin can re-trigger from detail page.
  }
}
