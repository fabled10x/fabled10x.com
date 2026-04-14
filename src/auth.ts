import NextAuth, { type NextAuthConfig } from 'next-auth';
import Resend from 'next-auth/providers/resend';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import { db, schema } from '@/db/client';

export const sessionCallback: NonNullable<
  NonNullable<NextAuthConfig['callbacks']>['session']
> = async ({ session, user }) => {
  if (session.user && user) {
    session.user.id = user.id;
  }
  return session;
};

export const authConfig: NextAuthConfig = {
  adapter: DrizzleAdapter(db, {
    usersTable: schema.users,
    accountsTable: schema.accounts,
    sessionsTable: schema.sessions,
    verificationTokensTable: schema.verificationTokens,
  }),
  providers: [
    Resend({
      apiKey: process.env.RESEND_API_KEY,
      from: process.env.AUTH_RESEND_FROM ?? 'no-reply@fabled10x.com',
    }),
  ],
  session: { strategy: 'database', maxAge: 60 * 60 * 24 * 30 },
  pages: { signIn: '/login', verifyRequest: '/login/verify' },
  trustHost: true,
  callbacks: { session: sessionCallback },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
