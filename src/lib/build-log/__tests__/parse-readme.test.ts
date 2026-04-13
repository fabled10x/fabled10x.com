import { describe, it, expect } from 'vitest';
import { parseReadme } from '../parse-readme';

// ── Fixtures ────────────────────────────────────────────────────────

const FIXTURE_FULL = `# community-showcase — Implementation Plan

**Alias:** \`cs\` — invoke as \`/pipeline cs <section>\`.

## Context

Some context prose here describing what the job does.
Multi-line context block.

## What Already Exists

other content

## Feature Overview

| #   | Feature              | Phase           | Size | Status  |
|-----|----------------------|-----------------|------|---------|
| 1.1 | First feature        | 1 - Foundation  | M    | Planned |
| 1.2 | Second feature       | 1 - Foundation  | S    | Planned |
| 2.1 | Third feature        | 2 - Pages       | L    | Planned |
| 2.2 | Fourth feature       | 2 - Pages       | M    | Planned |
| 2.3 | Fifth feature        | 2 - Pages       | S    | Planned |
| 3.1 | Sixth feature        | 3 - Polish      | M    | Planned |
| 3.2 | Seventh feature      | 3 - Polish      | S    | Planned |
| 3.3 | Eighth feature       | 3 - Polish      | XL   | Planned |
`;

const FIXTURE_NO_ALIAS = `# some-job — Implementation Plan

## Context

No alias line in this README.

## Feature Overview

| #   | Feature  | Phase  | Size | Status  |
|-----|----------|--------|------|---------|
| 1.1 | Solo     | 1 - F  | S    | Planned |
`;

const FIXTURE_NO_TABLE = `# bare-job — Implementation Plan

## Context

This README has no Feature Overview table.

## Notes

Just prose here.
`;

const FIXTURE_BACKTICKS_IN_CELLS = `# coded-job — Implementation Plan

## Feature Overview

| #   | Feature                | Phase           | Size | Status  |
|-----|------------------------|-----------------|------|---------|
| 1.1 | \`getAllJobs\` loader    | 1 - Foundation  | M    | Planned |
| 1.2 | \`parseReadme\` parser   | 1 - Foundation  | S    | Planned |
`;

const FIXTURE_WHITESPACE_CELLS = `# spaced-job

## Feature Overview

| # | Feature | Phase | Size | Status |
|---|---------|-------|------|--------|
|   1.1   |   Foo with spaces   |   1 - F   |   M   |   Planned   |
`;

const FIXTURE_NO_CONTEXT = `# bare-job — Implementation Plan

**Alias:** \`bj\` — invoke as ...

## Notes

No Context section here.
`;

// ── Unit Tests ──────────────────────────────────────────────────────

describe('parseReadme', () => {
  it('unit_parse_readme_alias_present: extracts alias from **Alias:** `cs` line', () => {
    const result = parseReadme(FIXTURE_FULL);
    expect(result.alias).toBe('cs');
  });

  it('unit_parse_readme_alias_absent: returns alias undefined when line missing', () => {
    const result = parseReadme(FIXTURE_NO_ALIAS);
    expect(result.alias).toBeUndefined();
  });

  it('unit_parse_readme_title: extracts title from first H1', () => {
    const result = parseReadme(FIXTURE_FULL);
    expect(result.title).toBe('community-showcase — Implementation Plan');
  });

  it('unit_parse_readme_context: extracts prose between ## Context and next ##', () => {
    const result = parseReadme(FIXTURE_FULL);
    expect(result.context).toContain('Some context prose here');
    expect(result.context).toContain('Multi-line context block.');
    // Should not include the next heading
    expect(result.context).not.toContain('What Already Exists');
    // Should not include the heading itself
    expect(result.context).not.toContain('## Context');
  });

  it('unit_parse_readme_features_table: extracts 8 JobFeature entries from table', () => {
    const result = parseReadme(FIXTURE_FULL);
    expect(result.features).toHaveLength(8);
    expect(result.features.map((f) => f.id)).toEqual([
      '1.1', '1.2', '2.1', '2.2', '2.3', '3.1', '3.2', '3.3',
    ]);
    expect(result.features[0]).toEqual({
      id: '1.1',
      name: 'First feature',
      phase: '1 - Foundation',
      size: 'M',
      status: 'Planned',
    });
  });

  it('unit_parse_readme_features_strip_backticks: strips backticks from cell contents', () => {
    const result = parseReadme(FIXTURE_BACKTICKS_IN_CELLS);
    expect(result.features).toHaveLength(2);
    expect(result.features[0].name).toBe('getAllJobs loader');
    expect(result.features[1].name).toBe('parseReadme parser');
  });

  it('unit_parse_readme_no_table: returns features [] when table absent', () => {
    const result = parseReadme(FIXTURE_NO_TABLE);
    expect(result.features).toEqual([]);
  });

  it('unit_parse_readme_separator_excluded: does NOT include |---|---| separator as feature', () => {
    const result = parseReadme(FIXTURE_FULL);
    // No feature row's id should look like "---" or contain dashes only
    for (const f of result.features) {
      expect(f.id).toMatch(/^\d+\.\d+$/);
    }
  });

  it('unit_parse_readme_no_context: returns context "" when no ## Context section', () => {
    const result = parseReadme(FIXTURE_NO_CONTEXT);
    expect(result.context).toBe('');
  });
});

// ── Edge Cases ──────────────────────────────────────────────────────

describe('parseReadme: edge cases', () => {
  it('edge_input_parse_readme_whitespace: trims whitespace inside table cells', () => {
    const result = parseReadme(FIXTURE_WHITESPACE_CELLS);
    expect(result.features).toHaveLength(1);
    expect(result.features[0]).toEqual({
      id: '1.1',
      name: 'Foo with spaces',
      phase: '1 - F',
      size: 'M',
      status: 'Planned',
    });
  });
});

// ── Error Recovery ──────────────────────────────────────────────────

describe('parseReadme: error recovery', () => {
  it('err_parse_readme_no_throw_on_empty: empty string returns empty-but-valid object', () => {
    expect(() => parseReadme('')).not.toThrow();
    const result = parseReadme('');
    expect(result.title).toBe('');
    expect(result.alias).toBeUndefined();
    expect(result.context).toBe('');
    expect(result.features).toEqual([]);
  });
});
