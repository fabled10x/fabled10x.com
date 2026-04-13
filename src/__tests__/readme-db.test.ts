import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const README_PATH = path.resolve(__dirname, '..', '..', 'README.md');

describe('root README.md local database section', () => {
  it('infra_readme_has_local_db_section: heading + docker compose + db:migrate + .env.local steps documented', () => {
    expect(existsSync(README_PATH)).toBe(true);
    const text = readFileSync(README_PATH, 'utf8');

    expect(text).toMatch(/^#{1,3}\s+.*(?:local\s+database|database|postgres|db\s+setup)/im);
    expect(text).toMatch(/docker\s+compose\s+up/i);
    expect(text).toMatch(/db:migrate|drizzle-kit\s+migrate|npm\s+run\s+db:migrate/i);
    expect(text).toMatch(/\.env\.(?:local|example)/);
  });
});
