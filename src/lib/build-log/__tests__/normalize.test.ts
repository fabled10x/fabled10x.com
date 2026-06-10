// normalize lib (build-log-overhaul-2.3) — pure shape-normalizers over the raw
// SessionStatus.completedSections union. extractSectionId() is preserved from the
// inline helper that lived in src/app/build-log/status/page.tsx; toEntry() collapses
// the string | snake_case-object raw shapes into the 1.4 discriminated
// CompletedSectionEntry union (kind tag, camelCase keys, String()-coerced commit_hash).
// Consumed by status/page.tsx (now) and RecentActivity (3.3). No React, no DOM, no IO.

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { extractSectionId, toEntry } from '../normalize';
import type { SessionStatus } from '@/content/schemas';

type RawEntry = SessionStatus['completedSections'][number];

describe('normalize (build-log-overhaul-2.3)', () => {
  // ───────────────────────────────────────────────────────────────
  // Unit — extractSectionId
  // ───────────────────────────────────────────────────────────────

  it('unit_extractSectionId_string: returns the raw string for string entries', () => {
    expect(extractSectionId('section-1.1')).toBe('section-1.1');
  });

  it('unit_extractSectionId_object: returns entry.section for object entries', () => {
    expect(extractSectionId({ section: 'section-1.2' })).toBe('section-1.2');
  });

  // ───────────────────────────────────────────────────────────────
  // Unit — toEntry
  // ───────────────────────────────────────────────────────────────

  it("unit_toEntry_minimal_from_string: returns { kind:'minimal', id } for string input", () => {
    expect(toEntry('section-1.1')).toEqual({ kind: 'minimal', id: 'section-1.1' });
  });

  it('unit_toEntry_detailed_camelcase: camel-cases all snake_case fields into the detailed variant', () => {
    const out = toEntry({
      section: 'section-1.2',
      completedAt: '2026-06-07T00:00:00Z',
      commit_hash: 'abc1234',
      commit_message: 'shipped',
      tests: 42,
      files_new: 3,
      files_modified: 5,
      pushed: true,
      notes: 'all green',
      name: 'Section 1.2',
    });
    expect(out).toEqual({
      kind: 'detailed',
      id: 'section-1.2',
      name: 'Section 1.2',
      completedAt: '2026-06-07T00:00:00Z',
      commitHash: 'abc1234',
      commitMessage: 'shipped',
      tests: 42,
      filesNew: 3,
      filesModified: 5,
      pushed: true,
      notes: 'all green',
    });
  });

  it("unit_toEntry_kind_tag: kind is 'detailed' for object input and 'minimal' for string input", () => {
    expect(toEntry({ section: 'section-2.0' }).kind).toBe('detailed');
    expect(toEntry('section-2.0').kind).toBe('minimal');
  });

  // ───────────────────────────────────────────────────────────────
  // Integration — full array normalization + source wiring
  // ───────────────────────────────────────────────────────────────

  it('int_toEntry_mixed_completedSections_array: maps a mixed string + legacy + detailed array to a uniform CompletedSectionEntry[]', () => {
    const raw: RawEntry[] = [
      'section-1.1',
      { section: 'section-1.2', completedAt: '2026-06-07T00:00:00Z' },
      { section: 'section-1.3', commit_hash: 'deadbee', tests: 7, files_new: 1, files_modified: 0, pushed: false },
    ];
    const normalized = raw.map(toEntry);
    expect(normalized).toEqual([
      { kind: 'minimal', id: 'section-1.1' },
      { kind: 'detailed', id: 'section-1.2', completedAt: '2026-06-07T00:00:00Z' },
      { kind: 'detailed', id: 'section-1.3', commitHash: 'deadbee', tests: 7, filesNew: 1, filesModified: 0, pushed: false },
    ]);
    // every entry carries a discriminant the UI can switch on with no typeof guard
    expect(normalized.every((e) => e.kind === 'minimal' || e.kind === 'detailed')).toBe(true);
  });

  it('int_status_page_imports_from_normalize: status/page.tsx imports extractSectionId from the normalize lib and no longer defines it inline', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(repoRoot, 'src/app/build-log/status/page.tsx');
    const source = readFileSync(sourcePath, 'utf-8');
    // imports the shared helper
    expect(source).toMatch(
      /import\s*\{[^}]*\bextractSectionId\b[^}]*\}\s*from\s*['"]@\/lib\/build-log\/normalize['"]/,
    );
    // no longer declares it locally
    expect(source).not.toMatch(/function\s+extractSectionId\b/);
  });

  // ───────────────────────────────────────────────────────────────
  // Infrastructure — purity + no React/DOM imports
  // ───────────────────────────────────────────────────────────────

  it('infra_normalize_no_react_or_dom_import: normalize.ts exists and imports only types — no react / next / DOM runtime deps', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(repoRoot, 'src/lib/build-log/normalize.ts');
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, 'utf-8');
    expect(source).toMatch(/export\s+function\s+extractSectionId\b/);
    expect(source).toMatch(/export\s+function\s+toEntry\b/);
    expect(source).not.toMatch(/from\s+['"]react['"]/);
    expect(source).not.toMatch(/from\s+['"]next\//);
    expect(source).not.toMatch(/document\.|window\./);
    expect(source).not.toMatch(/Date\.now\s*\(/);
  });

  it('infra_normalize_pure_no_side_effects: calling each function twice with the same input returns deep-equal output', () => {
    expect(extractSectionId('section-x')).toEqual(extractSectionId('section-x'));
    const raw: RawEntry = { section: 'section-y', commit_hash: 'cafe', tests: 1 };
    expect(toEntry(raw)).toEqual(toEntry(raw));
  });

  // ───────────────────────────────────────────────────────────────
  // Edge cases — input boundaries
  // ───────────────────────────────────────────────────────────────

  it("edge_input_toEntry_object_only_section: { section } with no optionals → { kind:'detailed', id } only", () => {
    expect(toEntry({ section: 'section-1.3' })).toEqual({ kind: 'detailed', id: 'section-1.3' });
  });

  it('edge_input_toEntry_numeric_commit_hash_coerced: YAML-numeric commit_hash is String()-coerced so commitHash stays a string', () => {
    const out = toEntry({ section: 'section-9.9', commit_hash: 1234567 });
    expect(out).toEqual({ kind: 'detailed', id: 'section-9.9', commitHash: '1234567' });
    if (out.kind === 'detailed') {
      expect(typeof out.commitHash).toBe('string');
    }
  });

  it('edge_input_extractSectionId_empty_string: empty string passes through without throwing', () => {
    expect(extractSectionId('')).toBe('');
  });

  // ───────────────────────────────────────────────────────────────
  // Error recovery — sparse / backfilled entries
  // ───────────────────────────────────────────────────────────────

  it('err_toEntry_minimal_object_no_throw: sparse object ({ section } only) does not throw and yields a well-formed entry', () => {
    expect(() => toEntry({ section: 'section-historic' })).not.toThrow();
    expect(toEntry({ section: 'section-historic' })).toEqual({
      kind: 'detailed',
      id: 'section-historic',
    });
  });

  // ───────────────────────────────────────────────────────────────
  // Data integrity — key-mapping fidelity + passthrough preservation
  // ───────────────────────────────────────────────────────────────

  it('data_serialization_snakecase_to_camelcase_fidelity: every snake_case key maps to exactly the right camelCase target', () => {
    const out = toEntry({
      section: 'section-z',
      commit_hash: 'h',
      commit_message: 'm',
      files_new: 11,
      files_modified: 22,
    });
    expect(out).toMatchObject({
      commitHash: 'h',
      commitMessage: 'm',
      filesNew: 11,
      filesModified: 22,
    });
    // no snake_case key leaks through
    expect(out).not.toHaveProperty('commit_hash');
    expect(out).not.toHaveProperty('commit_message');
    expect(out).not.toHaveProperty('files_new');
    expect(out).not.toHaveProperty('files_modified');
    expect(out).not.toHaveProperty('section');
  });

  it('data_consistency_passthrough_fields_preserved: already-camelCase fields retain exact values + types', () => {
    const out = toEntry({
      section: 'section-pass',
      name: 'Pass Section',
      completedAt: '2026-01-02T03:04:05Z',
      tests: 99,
      pushed: true,
      notes: 'kept verbatim',
    });
    expect(out).toMatchObject({
      kind: 'detailed',
      id: 'section-pass',
      name: 'Pass Section',
      completedAt: '2026-01-02T03:04:05Z',
      tests: 99,
      pushed: true,
      notes: 'kept verbatim',
    });
  });
});
