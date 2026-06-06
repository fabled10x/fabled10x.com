import { describe, expect, it } from 'vitest';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const MIGRATIONS_DIR = path.resolve(__dirname, '..', 'migrations');
const META_DIR = path.join(MIGRATIONS_DIR, 'meta');

const findCohortMigration = (): { sqlPath: string; tag: string } | null => {
  if (!existsSync(MIGRATIONS_DIR)) return null;
  const sqlFiles = readdirSync(MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'));
  // Look for a migration whose SQL contains the cohort table names.
  // drizzle-kit may assign the file any number depending on concurrent jobs;
  // also the suggested filename "0002_cohort_enrollment.sql" is opportunistic.
  for (const file of sqlFiles) {
    const content = readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8');
    if (/cohort_waitlist/i.test(content) && /cohort_applications/i.test(content)) {
      const tag = file.replace(/\.sql$/, '');
      return { sqlPath: path.join(MIGRATIONS_DIR, file), tag };
    }
  }
  return null;
};

describe('cohort migration file', () => {
  it('infra_migration_cohort_file_exists: a migration SQL file containing the cohort tables exists', () => {
    const found = findCohortMigration();
    expect(found).not.toBeNull();
  });

  it('infra_migration_cohort_snapshot_exists: matching meta/<idx>_snapshot.json exists alongside the migration SQL', () => {
    const found = findCohortMigration();
    expect(found).not.toBeNull();
    // drizzle-kit names snapshots by the leading numeric prefix only:
    // tag "0002_cohort_enrollment" → "0002_snapshot.json"
    const idx = found!.tag.split('_')[0];
    const snapshot = path.join(META_DIR, `${idx}_snapshot.json`);
    expect(existsSync(snapshot)).toBe(true);
  });

  it('infra_migration_journal_updated: meta/_journal.json entries reference the cohort migration tag', () => {
    const journalPath = path.join(META_DIR, '_journal.json');
    expect(existsSync(journalPath)).toBe(true);
    const journal = JSON.parse(readFileSync(journalPath, 'utf8'));
    const entries: { tag?: string }[] = journal.entries ?? [];
    const found = findCohortMigration();
    expect(found).not.toBeNull();
    const match = entries.find((e) => e.tag === found!.tag);
    expect(match).toBeDefined();
  });

  it('infra_migration_creates_all_four_tables: CREATE TABLE statements for cohort_waitlist, cohort_applications, cohort_admissions, cohort_enrollments', () => {
    const found = findCohortMigration();
    expect(found).not.toBeNull();
    const sql = readFileSync(found!.sqlPath, 'utf8');
    expect(sql).toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?cohort_waitlist"?/i);
    expect(sql).toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?cohort_applications"?/i);
    expect(sql).toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?cohort_admissions"?/i);
    expect(sql).toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?cohort_enrollments"?/i);
  });

  it('infra_migration_contains_check_constraints: CHECK clauses for commitment_level, pillar_interest, application decision, admission decision', () => {
    const found = findCohortMigration();
    expect(found).not.toBeNull();
    const sql = readFileSync(found!.sqlPath, 'utf8');
    // CHECK over commitment_level values
    expect(sql).toMatch(/CHECK[^;]*commitment_level[^;]*\bIN\b[^;]*\blight\b/i);
    expect(sql).toMatch(/CHECK[^;]*commitment_level[^;]*\bIN\b[^;]*\bstandard\b/i);
    expect(sql).toMatch(/CHECK[^;]*commitment_level[^;]*\bIN\b[^;]*\bintense\b/i);
    // CHECK over pillar_interest values
    expect(sql).toMatch(/CHECK[^;]*pillar_interest[^;]*\bIN\b[^;]*\bdelivery\b/i);
    expect(sql).toMatch(/CHECK[^;]*pillar_interest[^;]*\bIN\b[^;]*\bworkflow\b/i);
    expect(sql).toMatch(/CHECK[^;]*pillar_interest[^;]*\bIN\b[^;]*\bbusiness\b/i);
    expect(sql).toMatch(/CHECK[^;]*pillar_interest[^;]*\bIN\b[^;]*\bfuture\b/i);
    // CHECK for application-level decision (includes 'pending')
    expect(sql).toMatch(/CHECK[^;]*\bdecision\b[^;]*\bpending\b/i);
    // CHECK for admission-level decision (excludes 'pending'); look for 'accepted','waitlisted','declined'
    expect(sql).toMatch(/CHECK[^;]*\bdecision\b[^;]*\baccepted\b[^;]*\bwaitlisted\b[^;]*\bdeclined\b/i);
  });

  it('infra_migration_contains_fk_clauses: FOREIGN KEY clauses with expected onDelete behavior', () => {
    const found = findCohortMigration();
    expect(found).not.toBeNull();
    const sql = readFileSync(found!.sqlPath, 'utf8');
    // cohort_waitlist.user_id → users.id ON DELETE SET NULL
    expect(sql).toMatch(/cohort_waitlist[\s\S]*?REFERENCES[\s\S]*?users[\s\S]*?ON\s+DELETE\s+SET\s+NULL/i);
    // cohort_applications.user_id → users.id ON DELETE CASCADE
    expect(sql).toMatch(/cohort_applications[\s\S]*?REFERENCES[\s\S]*?users[\s\S]*?ON\s+DELETE\s+CASCADE/i);
    // cohort_applications.waitlist_id → cohort_waitlist.id ON DELETE SET NULL
    expect(sql).toMatch(/cohort_applications[\s\S]*?waitlist_id[\s\S]*?REFERENCES[\s\S]*?cohort_waitlist[\s\S]*?ON\s+DELETE\s+SET\s+NULL/i);
    // cohort_admissions.application_id → cohort_applications.id ON DELETE CASCADE
    expect(sql).toMatch(/cohort_admissions[\s\S]*?REFERENCES[\s\S]*?cohort_applications[\s\S]*?ON\s+DELETE\s+CASCADE/i);
    // cohort_enrollments.application_id → cohort_applications.id ON DELETE CASCADE
    // cohort_enrollments.user_id → users.id ON DELETE CASCADE
    expect(sql).toMatch(/cohort_enrollments[\s\S]*?application_id[\s\S]*?REFERENCES[\s\S]*?cohort_applications[\s\S]*?ON\s+DELETE\s+CASCADE/i);
    expect(sql).toMatch(/cohort_enrollments[\s\S]*?user_id[\s\S]*?REFERENCES[\s\S]*?users[\s\S]*?ON\s+DELETE\s+CASCADE/i);
  });
});
