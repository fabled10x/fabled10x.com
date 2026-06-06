CREATE TABLE "cohort_admissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"decided_by" text NOT NULL,
	"decision" text NOT NULL,
	"decision_note" text,
	"accepted_until" timestamp with time zone,
	"decided_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_admissions_application_id_unique" UNIQUE("application_id"),
	CONSTRAINT "cohort_admissions_decision_check" CHECK ("cohort_admissions"."decision" IN ('accepted','waitlisted','declined'))
);
--> statement-breakpoint
CREATE TABLE "cohort_applications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cohort_slug" text NOT NULL,
	"user_id" uuid NOT NULL,
	"background" text NOT NULL,
	"goals" text NOT NULL,
	"commitment_level" text NOT NULL,
	"commitment_hours" integer NOT NULL,
	"timezone" text NOT NULL,
	"pillar_interest" text NOT NULL,
	"referral_source" text,
	"waitlist_id" uuid,
	"decision" text DEFAULT 'pending' NOT NULL,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_applications_commitment_level_check" CHECK (commitment_level IN ('light', 'standard', 'intense')),
	CONSTRAINT "cohort_applications_pillar_interest_check" CHECK (pillar_interest IN ('delivery', 'workflow', 'business', 'future')),
	CONSTRAINT "cohort_applications_decision_check" CHECK ("cohort_applications"."decision" IN ('pending','accepted','waitlisted','declined'))
);
--> statement-breakpoint
CREATE TABLE "cohort_enrollments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"cohort_slug" text NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_session_id" text NOT NULL,
	"stripe_payment_intent_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'usd' NOT NULL,
	"paid_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "cohort_enrollments_application_id_unique" UNIQUE("application_id"),
	CONSTRAINT "cohort_enrollments_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "cohort_waitlist" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"cohort_slug" text NOT NULL,
	"source_tag" text,
	"user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cohort_admissions" ADD CONSTRAINT "cohort_admissions_application_id_cohort_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."cohort_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_applications" ADD CONSTRAINT "cohort_applications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_applications" ADD CONSTRAINT "cohort_applications_waitlist_id_cohort_waitlist_id_fk" FOREIGN KEY ("waitlist_id") REFERENCES "public"."cohort_waitlist"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_enrollments" ADD CONSTRAINT "cohort_enrollments_application_id_cohort_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."cohort_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_enrollments" ADD CONSTRAINT "cohort_enrollments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cohort_waitlist" ADD CONSTRAINT "cohort_waitlist_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "cohort_applications_cohort_user_idx" ON "cohort_applications" USING btree ("cohort_slug","user_id");--> statement-breakpoint
CREATE INDEX "cohort_applications_cohort_decision_idx" ON "cohort_applications" USING btree ("cohort_slug","decision");--> statement-breakpoint
CREATE INDEX "cohort_applications_user_idx" ON "cohort_applications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "cohort_enrollments_user_idx" ON "cohort_enrollments" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "cohort_waitlist_email_cohort_idx" ON "cohort_waitlist" USING btree ("email","cohort_slug");--> statement-breakpoint
CREATE INDEX "cohort_waitlist_cohort_slug_idx" ON "cohort_waitlist" USING btree ("cohort_slug");