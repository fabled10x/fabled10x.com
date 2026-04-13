import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const CONFIG_PATH = path.resolve(__dirname, '..', '..', 'drizzle.config.ts');

describe('drizzle.config.ts', () => {
  it('infra_drizzle_config_dialect_postgresql: declares dialect postgresql, schema path, out path, DATABASE_URL', () => {
    expect(existsSync(CONFIG_PATH)).toBe(true);
    const src = readFileSync(CONFIG_PATH, 'utf8');

    expect(src).toMatch(/dialect:\s*['"]postgresql['"]/);
    expect(src).toMatch(/schema:\s*['"]\.?\/?src\/db\/schema\.ts['"]/);
    expect(src).toMatch(/out:\s*['"]\.?\/?src\/db\/migrations['"]/);
    expect(src).toMatch(/process\.env\.DATABASE_URL/);
    expect(src).toMatch(/satisfies\s+Config/);
  });
});
