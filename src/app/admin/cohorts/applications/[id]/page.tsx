import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { Container } from '@/components/site/Container';
import { auth } from '@/auth';
import {
  getApplication,
  decideApplication,
  type AdminDecision,
} from '@/lib/cohorts/admin';
import { getCohortBySlug } from '@/lib/content/cohorts';
import {
  APPLICATION_COMMITMENT_LEVEL_LABELS,
  type ApplicationCommitmentLevel,
} from '@/content/schemas';

type RouteParams = {
  params: Promise<{ id: string }>;
};

async function decide(decision: AdminDecision, formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.email) throw new Error('Unauthenticated');

  const applicationId = String(formData.get('applicationId') ?? '');
  const decisionNote =
    (formData.get('decisionNote') as string | null)?.trim() || undefined;

  await decideApplication({
    applicationId,
    decision,
    decidedBy: session.user.email,
    decisionNote,
  });

  redirect('/admin/cohorts/applications');
}

async function acceptAction(formData: FormData) {
  'use server';
  await decide('accepted', formData);
}
async function waitlistAction(formData: FormData) {
  'use server';
  await decide('waitlisted', formData);
}
async function declineAction(formData: FormData) {
  'use server';
  await decide('declined', formData);
}

export default async function ApplicationDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const application = await getApplication(id);
  if (!application) notFound();

  const cohort = await getCohortBySlug(application.cohortSlug);

  return (
    <Container as="main" className="py-10">
      <p className="text-sm">
        <Link
          href="/admin/cohorts/applications"
          className="text-link underline-offset-2 hover:underline"
        >
          ← All applications
        </Link>
      </p>

      <header className="mt-6">
        <h1 className="font-display text-2xl font-semibold">
          {application.userEmail}
        </h1>
        <p className="mt-2 text-sm text-muted">
          Applied {new Intl.DateTimeFormat('en-US', {
            dateStyle: 'long',
            timeStyle: 'short',
          }).format(application.submittedAt)}{' '}
          · {cohort?.meta.title ?? application.cohortSlug}
        </p>
        <p className="mt-2 text-sm">
          Current decision: <strong>{application.decision}</strong>
        </p>
      </header>

      <dl className="mt-8 grid grid-cols-2 gap-6 text-sm">
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Commitment</dt>
          <dd className="mt-1">
            {APPLICATION_COMMITMENT_LEVEL_LABELS[application.commitmentLevel as ApplicationCommitmentLevel]}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Hours/week</dt>
          <dd className="mt-1">{application.commitmentHours}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Timezone</dt>
          <dd className="mt-1">{application.timezone}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Pillar</dt>
          <dd className="mt-1">{application.pillarInterest}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-muted">Referral</dt>
          <dd className="mt-1">{application.referralSource ?? '—'}</dd>
        </div>
      </dl>

      <section className="mt-10">
        <h2 className="font-display text-lg font-semibold">Background</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{application.background}</p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-lg font-semibold">Goals</h2>
        <p className="mt-3 whitespace-pre-wrap text-sm">{application.goals}</p>
      </section>

      <section className="mt-12 rounded-md border border-mist p-6">
        <h2 className="font-display text-lg font-semibold">Decide</h2>
        <p className="mt-2 text-xs text-muted">
          Internal note is private — it is stored on the admission row but
          never shown to the applicant.
        </p>
        <div className="mt-5 space-y-3">
          <textarea
            form="cohort-decide-form"
            name="decisionNote"
            rows={3}
            placeholder="Private reviewer notes (optional)"
            className="w-full rounded-md border border-mist bg-parchment px-4 py-3 text-sm"
          />
          <form id="cohort-decide-form" action={acceptAction} className="flex flex-wrap gap-3">
            <input type="hidden" name="applicationId" value={application.id} />
            <button
              type="submit"
              formAction={acceptAction}
              className="rounded-md bg-accent px-5 py-3 text-sm font-semibold text-parchment hover:bg-accent/90"
            >
              Accept
            </button>
            <button
              type="submit"
              formAction={waitlistAction}
              className="rounded-md bg-signal px-5 py-3 text-sm font-semibold text-parchment hover:bg-signal/90"
            >
              Waitlist
            </button>
            <button
              type="submit"
              formAction={declineAction}
              className="rounded-md border border-mist bg-parchment px-5 py-3 text-sm font-semibold hover:border-red-500 hover:text-red-600"
            >
              Decline
            </button>
          </form>
        </div>
      </section>
    </Container>
  );
}
