import { sql } from 'drizzle-orm';
import {
  check,
  index,
  integer,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { APPLICATION_COMMITMENT_LEVELS } from '@/content/schemas/cohort-application';
import { CONTENT_PILLARS } from '@/content/schemas/content-pillar';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('email_verified', { withTimezone: true, mode: 'date' }),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSignInAt: timestamp('last_sign_in_at', { withTimezone: true }),
});

export const accounts = pgTable(
  'accounts',
  {
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('provider_account_id').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (table) => [
    primaryKey({ columns: [table.provider, table.providerAccountId] }),
  ],
);

export const sessions = pgTable('sessions', {
  sessionToken: text('session_token').primaryKey(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { withTimezone: true }).notNull(),
});

export const verificationTokens = pgTable(
  'verification_tokens',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: timestamp('expires', { withTimezone: true }).notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.identifier, table.token] }),
  ],
);

export const purchases = pgTable(
  'purchases',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    productSlug: text('product_slug').notNull(),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    purchasedAt: timestamp('purchased_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index('purchases_user_id_idx').on(table.userId)],
);

export const cohortWaitlist = pgTable(
  'cohort_waitlist',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    email: text('email').notNull(),
    cohortSlug: text('cohort_slug').notNull(),
    sourceTag: text('source_tag'),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('cohort_waitlist_email_cohort_idx').on(
      table.email,
      table.cohortSlug,
    ),
    index('cohort_waitlist_cohort_slug_idx').on(table.cohortSlug),
  ],
);

export const cohortApplications = pgTable(
  'cohort_applications',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    cohortSlug: text('cohort_slug').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    background: text('background').notNull(),
    goals: text('goals').notNull(),
    commitmentLevel: text('commitment_level').notNull(),
    commitmentHours: integer('commitment_hours').notNull(),
    timezone: text('timezone').notNull(),
    pillarInterest: text('pillar_interest').notNull(),
    referralSource: text('referral_source'),
    waitlistId: uuid('waitlist_id').references(() => cohortWaitlist.id, {
      onDelete: 'set null',
    }),
    decision: text('decision').notNull().default('pending'),
    submittedAt: timestamp('submitted_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex('cohort_applications_cohort_user_idx').on(
      table.cohortSlug,
      table.userId,
    ),
    index('cohort_applications_cohort_decision_idx').on(
      table.cohortSlug,
      table.decision,
    ),
    index('cohort_applications_user_idx').on(table.userId),
    // sql.raw is safe here ONLY because the tuple values are compile-time
    // constants from typed `as const` declarations. Never pass user input
    // to sql.raw. The drizzle-kit parameterized-template alternative
    // (sql`${v}` inside sql.join) produces $1/$2/$3 placeholders which are
    // invalid in DDL CHECK clauses.
    check(
      'cohort_applications_commitment_level_check',
      sql.raw(
        `commitment_level IN (${APPLICATION_COMMITMENT_LEVELS.map((v) => `'${v}'`).join(', ')})`,
      ),
    ),
    check(
      'cohort_applications_pillar_interest_check',
      sql.raw(
        `pillar_interest IN (${CONTENT_PILLARS.map((v) => `'${v}'`).join(', ')})`,
      ),
    ),
    check(
      'cohort_applications_decision_check',
      sql`${table.decision} IN ('pending','accepted','waitlisted','declined')`,
    ),
  ],
);

export const cohortAdmissions = pgTable(
  'cohort_admissions',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    applicationId: uuid('application_id')
      .notNull()
      .unique()
      .references(() => cohortApplications.id, { onDelete: 'cascade' }),
    decidedBy: text('decided_by').notNull(),
    decision: text('decision').notNull(),
    decisionNote: text('decision_note'),
    acceptedUntil: timestamp('accepted_until', { withTimezone: true }),
    decidedAt: timestamp('decided_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      'cohort_admissions_decision_check',
      sql`${table.decision} IN ('accepted','waitlisted','declined')`,
    ),
  ],
);

export const cohortEnrollments = pgTable(
  'cohort_enrollments',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    applicationId: uuid('application_id')
      .notNull()
      .unique()
      .references(() => cohortApplications.id, { onDelete: 'cascade' }),
    cohortSlug: text('cohort_slug').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    stripeSessionId: text('stripe_session_id').notNull().unique(),
    stripePaymentIntentId: text('stripe_payment_intent_id').notNull(),
    amountCents: integer('amount_cents').notNull(),
    currency: text('currency').notNull().default('usd'),
    paidAt: timestamp('paid_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index('cohort_enrollments_user_idx').on(table.userId)],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;
export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;
export type Purchase = typeof purchases.$inferSelect;
export type NewPurchase = typeof purchases.$inferInsert;
export type CohortWaitlistRow = typeof cohortWaitlist.$inferSelect;
export type NewCohortWaitlistRow = typeof cohortWaitlist.$inferInsert;
export type CohortApplicationRow = typeof cohortApplications.$inferSelect;
export type NewCohortApplicationRow = typeof cohortApplications.$inferInsert;
export type CohortAdmissionRow = typeof cohortAdmissions.$inferSelect;
export type NewCohortAdmissionRow = typeof cohortAdmissions.$inferInsert;
export type CohortEnrollmentRow = typeof cohortEnrollments.$inferSelect;
export type NewCohortEnrollmentRow = typeof cohortEnrollments.$inferInsert;
