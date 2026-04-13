import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const MIGRATION_PATH = path.resolve(
  __dirname,
  '..',
  'migrations',
  '0000_init.sql',
);

describe('db migration 0000_init', () => {
  it('infra_migration_0000_has_pgcrypto_extension: CREATE EXTENSION "pgcrypto" is present', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true);
    const sql = readFileSync(MIGRATION_PATH, 'utf8');
    expect(sql).toMatch(/CREATE\s+EXTENSION\s+IF\s+NOT\s+EXISTS\s+"?pgcrypto"?/i);
  });

  it('infra_migration_0000_creates_all_four_tables: CREATE TABLE statements exist for users, sessions, verification_tokens, purchases', () => {
    expect(existsSync(MIGRATION_PATH)).toBe(true);
    const sql = readFileSync(MIGRATION_PATH, 'utf8');
    expect(sql).toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?users"?/i);
    expect(sql).toMatch(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?sessions"?/i);
    expect(sql).toMatch(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?verification_tokens"?/i,
    );
    expect(sql).toMatch(
      /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?"?purchases"?/i,
    );
  });
});
