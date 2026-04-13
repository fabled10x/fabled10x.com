import { describe, it, expect } from 'vitest';
import { parsePhaseHeader } from '../parse-phase';

// ── Fixtures ────────────────────────────────────────────────────────

const FIXTURE_FULL_HEADER = `# Phase 1: Foundation

**Total Size: M + M + S**
**Prerequisites:** website-foundation shipped — brand tokens, site shell.
**New Types:** Job, JobPhase, SessionStatus
**New Files:** src/content/schemas/build-log.ts, src/lib/build-log/jobs.ts

Phase 1 is pure plumbing. After it ships, ...`;

const FIXTURE_NO_HEADER = `Just a body with no header block.

Some prose, no H1, no bold-key lines.`;

const FIXTURE_PARTIAL_HEADER = `# Phase 2: Pages

**Prerequisites:** Phase 1 complete

(no Total Size, New Types, or New Files lines)
`;

const FIXTURE_ONLY_H1 = `# Phase 3: Polish

(no bold-key lines at all)

body content here`;

// ── Unit Tests ──────────────────────────────────────────────────────

describe('parsePhaseHeader', () => {
  it('unit_parse_phase_full_header: extracts all 6 fields from complete header', () => {
    const result = parsePhaseHeader(FIXTURE_FULL_HEADER);
    expect(result.phaseNumber).toBe(1);
    expect(result.title).toBe('Foundation');
    expect(result.totalSize).toBe('M + M + S');
    expect(result.prerequisites).toBe(
      'website-foundation shipped — brand tokens, site shell.',
    );
    expect(result.newTypes).toBe('Job, JobPhase, SessionStatus');
    expect(result.newFiles).toBe(
      'src/content/schemas/build-log.ts, src/lib/build-log/jobs.ts',
    );
  });

  it('unit_parse_phase_no_header: returns all-undefined for body without header', () => {
    const result = parsePhaseHeader(FIXTURE_NO_HEADER);
    expect(result.phaseNumber).toBeUndefined();
    expect(result.title).toBeUndefined();
    expect(result.totalSize).toBeUndefined();
    expect(result.prerequisites).toBeUndefined();
    expect(result.newTypes).toBeUndefined();
    expect(result.newFiles).toBeUndefined();
  });

  it('unit_parse_phase_partial_header: returns present fields, undefined for absent', () => {
    const result = parsePhaseHeader(FIXTURE_PARTIAL_HEADER);
    expect(result.phaseNumber).toBe(2);
    expect(result.title).toBe('Pages');
    expect(result.prerequisites).toBe('Phase 1 complete');
    expect(result.totalSize).toBeUndefined();
    expect(result.newTypes).toBeUndefined();
    expect(result.newFiles).toBeUndefined();
  });

  it('unit_parse_phase_empty_input: empty string returns all-undefined, no throw', () => {
    expect(() => parsePhaseHeader('')).not.toThrow();
    const result = parsePhaseHeader('');
    expect(result.phaseNumber).toBeUndefined();
    expect(result.title).toBeUndefined();
    expect(result.totalSize).toBeUndefined();
    expect(result.prerequisites).toBeUndefined();
    expect(result.newTypes).toBeUndefined();
    expect(result.newFiles).toBeUndefined();
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────

describe('parsePhaseHeader: edge cases', () => {
  it('edge_input_parse_phase_only_h1: extracts phaseNumber+title, leaves bold-keys undefined', () => {
    const result = parsePhaseHeader(FIXTURE_ONLY_H1);
    expect(result.phaseNumber).toBe(3);
    expect(result.title).toBe('Polish');
    expect(result.totalSize).toBeUndefined();
    expect(result.prerequisites).toBeUndefined();
    expect(result.newTypes).toBeUndefined();
    expect(result.newFiles).toBeUndefined();
  });
});

// ── Error Recovery ──────────────────────────────────────────────────

describe('parsePhaseHeader: error recovery', () => {
  it('err_parse_phase_no_throw_on_empty: tolerant of empty input (no throw)', () => {
    expect(() => parsePhaseHeader('')).not.toThrow();
  });
});
