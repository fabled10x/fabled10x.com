import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { Container } from '@/components/site/Container';

function parseAllowlist(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter((email) => email.length > 0);
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect('/login?callbackUrl=%2Fadmin%2Fcohorts%2Fapplications');
  }

  const allowlist = parseAllowlist(process.env.ADMIN_EMAILS);
  const email = session.user.email.toLowerCase();
  if (!allowlist.includes(email)) {
    return (
      <Container as="main" className="py-16">
        <h1 className="font-display text-2xl font-semibold">Forbidden</h1>
        <p className="mt-3 text-sm text-muted">
          Your account is not in the admin allowlist.{' '}
          <Link href="/" className="text-link underline-offset-2 hover:underline">
            Back to site
          </Link>
        </p>
      </Container>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <header className="border-b border-mist bg-parchment/80 backdrop-blur">
        <Container className="flex items-center justify-between py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-muted">
            Admin
          </p>
          <nav className="flex items-center gap-4 text-sm">
            <Link href="/admin/cohorts/applications" className="hover:text-accent">
              Cohort applications
            </Link>
            <span className="text-xs text-muted">Signed in as {session.user.email}</span>
          </nav>
        </Container>
      </header>
      {children}
    </div>
  );
}
