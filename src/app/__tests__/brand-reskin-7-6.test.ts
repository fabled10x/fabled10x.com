import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// styling-overhaul-7.6 — source-scan regression guard.
//
// The 5 about/auth/error pages must migrate off the placeholder palette
// (text-muted / border-mist / hover:border-accent / hover:text-accent /
// font-display) and onto the editorial brand surface (Marble). These legacy
// utilities are NOT caught by the global forbidden-patterns sentinel
// (which targets gradients / shadows / pure-hex / numbered-tailwind), so a
// section-local source scan locks the migration.

const __dirname_compat = dirname(fileURLToPath(import.meta.url));
// src/app/__tests__ → ../../.. = repo root
const ROOT = join(__dirname_compat, '..', '..', '..');

const PAGES = [
  'src/app/about/page.tsx',
  'src/app/login/page.tsx',
  'src/app/login/verify/page.tsx',
  'src/app/not-found.tsx',
  'src/app/error.tsx',
];

const LEGACY_CLASS_PATTERNS: RegExp[] = [
  /\btext-muted\b/,
  /\bborder-mist\b/,
  /\bhover:border-accent\b/,
  /\bhover:text-accent\b/,
  /\bfont-display\b/,
];

function read(file: string): string {
  return readFileSync(join(ROOT, file), 'utf8');
}

describe('brand reskin 7.6 — page source scan', () => {
  describe('data_pages_no_legacy_palette_classes', () => {
    for (const page of PAGES) {
      it(`${page} contains no legacy placeholder palette classes`, () => {
        const content = read(page);
        const hits = LEGACY_CLASS_PATTERNS.filter((re) => re.test(content)).map(
          (re) => re.source,
        );
        expect(hits).toEqual([]);
      });
    }
  });

  describe('data_pages_use_marble_surface', () => {
    for (const page of PAGES) {
      it(`${page} uses the Marble brand surface`, () => {
        const content = read(page);
        expect(content).toMatch(/\bMarble\b/);
      });
    }
  });
});
