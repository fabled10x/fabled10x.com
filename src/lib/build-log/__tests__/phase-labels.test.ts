// phase-labels helper (build-log-overhaul-1.1) — canonical phase ordering,
// layperson labels, and narrowing helpers for the build-log overhaul. Imported
// by derive-live-status (1.3), PhaseStepper (2.1), Hero (3.1),
// PipelineExplainer (3.2), and LiveWorktreesPanel (3.4).

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import {
  PHASE_ORDER,
  PHASE_LABELS,
  phaseLabel,
  isPhaseName,
  type PhaseName,
} from '../phase-labels';

describe('phase-labels (build-log-overhaul-1.1)', () => {
  // ───────────────────────────────────────────────────────────────
  // Unit — tuple shape + label coverage
  // ───────────────────────────────────────────────────────────────

  it('unit_order_label_keys_match: PHASE_ORDER and PHASE_LABELS cover the same keys exactly', () => {
    const labelKeys = Object.keys(PHASE_LABELS).sort();
    const orderKeys = [...PHASE_ORDER].sort();
    expect(labelKeys).toEqual(orderKeys);
  });

  it('unit_order_has_seven_entries: PHASE_ORDER lists the seven canonical phases left-to-right', () => {
    expect(PHASE_ORDER.length).toBe(7);
    expect([...PHASE_ORDER]).toEqual([
      'preflight',
      'discovery',
      'red',
      'green',
      'refactor',
      'finish',
      'release',
    ]);
  });

  it.each([...PHASE_ORDER])(
    'unit_phaseLabel_known_table_driven: phaseLabel(%s) returns the mapped label',
    (name) => {
      expect(phaseLabel(name)).toBe(PHASE_LABELS[name]);
    },
  );

  it('unit_phaseLabel_label_copy_matches_spec: PHASE_LABELS values match the planning-doc copy exactly', () => {
    expect(PHASE_LABELS).toEqual({
      preflight: 'Running safety checks',
      discovery: 'Researching the change',
      red: 'Writing the tests',
      green: 'Making the tests pass',
      refactor: 'Polishing the code',
      finish: 'Shipping it',
      release: 'Merging to main',
    });
  });

  it.each([...PHASE_ORDER])(
    'unit_isPhaseName_narrows_true: isPhaseName(%s) returns true',
    (name) => {
      expect(isPhaseName(name)).toBe(true);
    },
  );

  it('unit_isPhaseName_narrows_false_for_bogus_string: rejects strings that are not in PHASE_ORDER', () => {
    expect(isPhaseName('bogus')).toBe(false);
    expect(isPhaseName('Discovery')).toBe(false); // case-sensitive
    expect(isPhaseName('hypothetical-future-phase')).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────
  // Edge — input handling (null/undefined/empty/unknown)
  // ───────────────────────────────────────────────────────────────

  it('edge_input_phaseLabel_unknown_passes_through: unknown phase names pass through unchanged (forward-compat)', () => {
    expect(phaseLabel('hypothetical-future-phase')).toBe(
      'hypothetical-future-phase',
    );
  });

  it('edge_input_phaseLabel_null_returns_empty: phaseLabel(null) returns empty string', () => {
    expect(phaseLabel(null)).toBe('');
  });

  it('edge_input_phaseLabel_undefined_returns_empty: phaseLabel(undefined) returns empty string', () => {
    expect(phaseLabel(undefined)).toBe('');
  });

  it("edge_input_phaseLabel_empty_string_returns_empty: phaseLabel('') returns empty string", () => {
    expect(phaseLabel('')).toBe('');
  });

  it('edge_input_isPhaseName_nullish_returns_false: isPhaseName(null|undefined) returns false', () => {
    expect(isPhaseName(null)).toBe(false);
    expect(isPhaseName(undefined)).toBe(false);
    expect(isPhaseName('')).toBe(false);
  });

  // ───────────────────────────────────────────────────────────────
  // Data integrity — runtime immutability + tuple shape
  // ───────────────────────────────────────────────────────────────

  it('data_phase_labels_object_frozen: PHASE_LABELS is frozen and cannot be mutated at runtime', () => {
    expect(Object.isFrozen(PHASE_LABELS)).toBe(true);
  });

  it('data_phase_order_tuple_readonly: PHASE_ORDER is an array of exactly seven strings (runtime check; tsc gate enforces `as const`)', () => {
    expect(Array.isArray(PHASE_ORDER)).toBe(true);
    expect(PHASE_ORDER.length).toBe(7);
    for (const name of PHASE_ORDER) {
      expect(typeof name).toBe('string');
    }
    // Branded-type compile-time check via PhaseName assignment — value flows
    // through the union; a type-level regression would surface as a tsc error.
    const sample: PhaseName = PHASE_ORDER[0];
    expect(sample).toBe('preflight');
  });

  // ───────────────────────────────────────────────────────────────
  // Infrastructure — file structure sentinels
  // ───────────────────────────────────────────────────────────────

  it('infra_phase_labels_file_exists: src/lib/build-log/phase-labels.ts re-exports the five canonical names', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const sourcePath = path.join(
      repoRoot,
      'src/lib/build-log/phase-labels.ts',
    );
    expect(existsSync(sourcePath)).toBe(true);
    const source = readFileSync(sourcePath, 'utf-8');
    expect(source).toMatch(/export\s+const\s+PHASE_ORDER\b/);
    expect(source).toMatch(/export\s+const\s+PHASE_LABELS\b/);
    expect(source).toMatch(/export\s+function\s+phaseLabel\b/);
    expect(source).toMatch(/export\s+function\s+isPhaseName\b/);
    expect(source).toMatch(/export\s+type\s+PhaseName\b/);
  });

  it('infra_no_barrel_re_export: src/lib/build-log/index.ts does NOT exist (per planning doc design decision)', () => {
    const repoRoot = path.resolve(__dirname, '../../../..');
    const barrelPath = path.join(repoRoot, 'src/lib/build-log/index.ts');
    expect(existsSync(barrelPath)).toBe(false);
  });
});
