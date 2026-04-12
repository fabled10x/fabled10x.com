import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

describe('public/llms.txt', () => {
  it('infra_llmstxt_has_sitemap', () => {
    const content = readFileSync(join(process.cwd(), 'public/llms.txt'), 'utf8');
    expect(content).toMatch(/Sitemap:\s+https:\/\/fabled10x\.com\/sitemap\.xml/);
  });
});
