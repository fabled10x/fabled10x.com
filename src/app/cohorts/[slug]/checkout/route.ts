import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { verifyCheckoutToken } from '@/lib/cohorts/checkout-token';
import { getCohortBySlug } from '@/lib/content/cohorts';
import { getApplication } from '@/lib/cohorts/admin';
import { createCohortCheckoutSession } from '@/lib/cohorts/checkout';

export const runtime = 'nodejs';

type RouteContext = {
  params: Promise<{ slug: string }>;
};

function errorRedirect(message: string, base: string | URL): NextResponse {
  const url = new URL('/cohorts', base);
  url.searchParams.set('error', message);
  return NextResponse.redirect(url);
}

export async function GET(request: Request, context: RouteContext) {
  const { slug } = await context.params;
  const url = new URL(request.url);

  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    const callback = `/cohorts/${slug}/checkout${url.search}`;
    const login = new URL(
      `/login?callbackUrl=${encodeURIComponent(callback)}`,
      request.url,
    );
    return NextResponse.redirect(login);
  }

  const token = url.searchParams.get('token');
  if (!token) {
    return errorRedirect('Missing token.', request.url);
  }

  const result = verifyCheckoutToken(token);
  if (!result.ok) {
    const reason =
      result.reason === 'expired'
        ? 'This acceptance link has expired.'
        : 'This acceptance link is invalid.';
    return errorRedirect(reason, request.url);
  }

  const { applicationId, cohortSlug } = result.payload;
  if (cohortSlug !== slug) {
    return errorRedirect(
      'This acceptance link does not match the cohort.',
      request.url,
    );
  }

  const application = await getApplication(applicationId);
  if (!application) {
    return errorRedirect('Application not found.', request.url);
  }
  if (application.userId !== session.user.id) {
    return errorRedirect(
      'This acceptance link belongs to a different account.',
      request.url,
    );
  }

  const cohort = await getCohortBySlug(cohortSlug);
  if (!cohort) {
    return errorRedirect('Cohort not found.', request.url);
  }

  let checkoutUrl: string;
  try {
    checkoutUrl = await createCohortCheckoutSession({
      cohort: cohort.meta,
      applicationId,
      userId: session.user.id,
      userEmail: session.user.email,
    });
  } catch (err) {
    console.error('createCohortCheckoutSession failed:', err);
    return errorRedirect(
      'Could not start checkout. Please try again or contact us.',
      request.url,
    );
  }

  return NextResponse.redirect(checkoutUrl);
}
