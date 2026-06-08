import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const FUTURE_JOBS_PATH = path.resolve(__dirname, '..', '..', 'docs', 'future-jobs.md');
const doc = readFileSync(FUTURE_JOBS_PATH, 'utf8');

const section4 = (() => {
  const match = doc.match(/##\s+4\.\s+`email-funnel`[\s\S]*?(?=\n##\s+\d+\.\s|\n##\s+Things\s|$)/);
  return match ? match[0] : '';
})();

const orderingTableRow4 = (() => {
  const line = doc
    .split('\n')
    .find((l) => /^\|\s*4\s*\|\s*`email-funnel`/.test(l));
  return line ?? '';
})();

describe('docs/future-jobs.md §4 — email-funnel (Substack embed swap)', () => {
  it('unit_future_jobs_section4_subtitle_substack_embed_swap: §4 heading subtitle reflects Substack embed swap', () => {
    expect(section4).toMatch(/##\s+4\.\s+`email-funnel`.*Substack embed swap/);
  });

  it('unit_future_jobs_section4_body_mentions_substack_iframe: §4 mentions Substack embed iframe', () => {
    expect(section4).toMatch(/Substack/);
    expect(section4).toMatch(/iframe|embed/i);
  });

  it('unit_future_jobs_section4_drops_old_resend_funnel_scope: §4 no longer describes the self-hosted Resend nurture funnel', () => {
    expect(section4).not.toMatch(/nurture sequence/i);
    expect(section4).not.toMatch(/welcome email template/i);
    expect(section4).not.toMatch(/product-pitch emails/i);
    expect(section4).not.toMatch(/audience tagging/i);
    expect(section4).not.toMatch(/Resend nurture sequences/i);
  });

  it('unit_future_jobs_section4_mentions_utm_source_dimension: §4 mentions UTM as the surviving source taxonomy', () => {
    expect(section4).toMatch(/UTM/);
    expect(section4).toMatch(/source/i);
  });

  it('edge_future_jobs_section4_body_shrinks: §4 body collapses materially after the rewrite (< 35 non-blank lines)', () => {
    const nonBlankLines = section4.split('\n').filter((l) => l.trim().length > 0);
    expect(nonBlankLines.length).toBeLessThan(35);
    // Sanity: §4 must still have at least a heading + a few body lines.
    expect(nonBlankLines.length).toBeGreaterThan(3);
  });
});

describe('docs/future-jobs.md — Ordering & dependencies table row 4', () => {
  it('infra_future_jobs_sizing_table_row4_size_and_ordering: row 4 lists size `S` and "any time after `wf`"', () => {
    expect(orderingTableRow4).not.toBe('');
    const cells = orderingTableRow4.split('|').map((c) => c.trim());
    // Cells (pipe-split): ['', '4', '`email-funnel`', alias, size, prereqs, ordering, '']
    const sizeCell = cells[4] ?? '';
    const orderingCell = cells[6] ?? '';
    expect(sizeCell).toBe('S');
    expect(orderingCell).toMatch(/any time after\s+`wf`/);
  });

  it('infra_future_jobs_sizing_table_row4_alias_ef: row 4 alias column contains `ef`', () => {
    expect(orderingTableRow4).not.toBe('');
    const cells = orderingTableRow4.split('|').map((c) => c.trim());
    const aliasCell = cells[3] ?? '';
    expect(aliasCell).toBe('`ef`');
  });
});
