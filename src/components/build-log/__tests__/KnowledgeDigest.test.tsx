import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { KnowledgeDigest } from '../KnowledgeDigest';
import * as buildLogBarrel from '..';
import type { KnowledgeFile } from '@/content/schemas';

// Resolve repo root from this file (NOT process.cwd()) so source-regex
// assertions pass inside worktree slots. Matches PipelineExplainer.test.tsx.
const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const KNOWLEDGE_DIGEST_SOURCE = 'src/components/build-log/KnowledgeDigest.tsx';

// KnowledgeFile (build-log.ts) declares patterns?/openQuestions? but not
// deferredFollowups — fixtures use arbitrary shapes the loader yields in the
// wild, cast to the prop type. Component coerces defensively at runtime.
const kf = (obj: Record<string, unknown>): KnowledgeFile =>
  obj as unknown as KnowledgeFile;

describe('KnowledgeDigest', () => {
  // ── Unit ──────────────────────────────────────────────────────────────
  it('unit_renders_patterns_name_and_summary: pattern name + summary text render', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({
          patterns: [{ name: 'brand-token-system', summary: 'inline @theme blocks' }],
        })}
      />,
    );
    expect(screen.getByText('brand-token-system')).toBeInTheDocument();
    expect(screen.getByText('inline @theme blocks')).toBeInTheDocument();
  });

  it('unit_renders_deferred_followups: deferredFollowups item name renders', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({
          deferredFollowups: [{ name: 'polymorphic-primitive-factory' }],
        })}
      />,
    );
    expect(
      screen.getByText('polymorphic-primitive-factory'),
    ).toBeInTheDocument();
  });

  it('unit_summary_shows_counts: <summary> reads "{n} patterns · {m} deferred follow-ups"', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({
          patterns: [{ name: 'p1' }, { name: 'p2' }],
          deferredFollowups: [{ name: 'f1' }],
        })}
      />,
    );
    expect(screen.getByText(/2 patterns · 1 deferred/i)).toBeInTheDocument();
  });

  it('unit_patterns_heading_present_when_patterns: "Patterns" sub-heading renders', () => {
    render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    expect(
      screen.getByRole('heading', { name: 'Patterns' }),
    ).toBeInTheDocument();
  });

  it('unit_followups_heading_present_when_followups: "Deferred follow-ups" sub-heading renders', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({ deferredFollowups: [{ name: 'f1' }] })}
      />,
    );
    expect(
      screen.getByRole('heading', { name: 'Deferred follow-ups' }),
    ).toBeInTheDocument();
  });

  it('unit_section_heading_text: section h2 reads "Patterns the agents have learned"', () => {
    render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    expect(
      screen.getByRole('heading', { name: 'Patterns the agents have learned' }),
    ).toBeInTheDocument();
  });

  it('unit_code_ref_to_knowledge_yaml: intro prose contains a <code> ref to knowledge.yaml', () => {
    const { container } = render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    const codes = Array.from(container.querySelectorAll('code'));
    expect(
      codes.some((c) => c.textContent?.includes('pipeline/active/knowledge.yaml')),
    ).toBe(true);
  });

  // ── Integration (extractItems coercion paths) ──────────────────────────
  it('int_renders_patterns_and_followups_together: both columns + combined count', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({
          patterns: [{ name: 'p1', summary: 's1' }],
          deferredFollowups: [{ name: 'f1', summary: 'sf1' }],
        })}
      />,
    );
    expect(screen.getByText('p1')).toBeInTheDocument();
    expect(screen.getByText('f1')).toBeInTheDocument();
    expect(screen.getByText(/1 patterns · 1 deferred/i)).toBeInTheDocument();
  });

  it('int_title_description_fallback_fields: items using title/description render via fallback', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({ patterns: [{ title: 't1', description: 'd1' }] })}
      />,
    );
    expect(screen.getByText('t1')).toBeInTheDocument();
    expect(screen.getByText('d1')).toBeInTheDocument();
  });

  it('int_untitled_fallback_when_no_name_or_title: item with neither renders "(untitled)"', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({ patterns: [{ summary: 'only summary' }] })}
      />,
    );
    expect(screen.getByText('(untitled)')).toBeInTheDocument();
    expect(screen.getByText('only summary')).toBeInTheDocument();
  });

  // ── Security ───────────────────────────────────────────────────────────
  it('sec_xss_text_rendering: <script> in a name renders as inert escaped text', () => {
    const { container } = render(
      <KnowledgeDigest
        knowledge={kf({
          patterns: [{ name: '<script>alert(1)</script>', summary: 'safe' }],
        })}
      />,
    );
    // No actual <script> element created — it is a text node, not markup.
    expect(container.querySelector('script')).toBeNull();
    expect(
      screen.getByText('<script>alert(1)</script>'),
    ).toBeInTheDocument();
  });

  it('sec_malformed_items_no_throw: non-object entries are dropped, no exception', () => {
    expect(() =>
      render(
        <KnowledgeDigest
          knowledge={kf({
            patterns: ['a string', 123, null, { name: 'valid' }],
          })}
        />,
      ),
    ).not.toThrow();
    expect(screen.getByText('valid')).toBeInTheDocument();
    expect(screen.getByText(/1 patterns · 0 deferred/i)).toBeInTheDocument();
  });

  // ── Accessibility ──────────────────────────────────────────────────────
  it('a11y_section_labelled_by_heading: section aria-labelledby points at the h2', () => {
    const { container } = render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    const section = container.querySelector('section');
    expect(section).toHaveAttribute('aria-labelledby', 'knowledge-heading');
    expect(container.querySelector('#knowledge-heading')).toBeInTheDocument();
  });

  it('a11y_native_disclosure_summary: <details> wraps a native <summary>', () => {
    const { container } = render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    const summary = container.querySelector('details > summary');
    expect(summary).toBeInTheDocument();
    expect(summary?.tagName).toBe('SUMMARY');
  });

  it('a11y_lists_use_ul_li: pattern/follow-up entries are listitems', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({
          patterns: [{ name: 'p1' }],
          deferredFollowups: [{ name: 'f1' }],
        })}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  // ── Infrastructure ─────────────────────────────────────────────────────
  it('infra_barrel_reexports_knowledgedigest: importable via build-log barrel', () => {
    expect(buildLogBarrel).toHaveProperty('KnowledgeDigest');
    expect(
      typeof (buildLogBarrel as Record<string, unknown>).KnowledgeDigest,
    ).toBe('function');
  });

  it('infra_server_component_no_client_directive: no use client / useState / useEffect', () => {
    const src = readFileSync(join(REPO_ROOT, KNOWLEDGE_DIGEST_SOURCE), 'utf8');
    expect(src).not.toMatch(/['"]use client['"]/);
    expect(src).not.toMatch(/\buseState\b/);
    expect(src).not.toMatch(/\buseEffect\b/);
  });

  // ── Edge cases ─────────────────────────────────────────────────────────
  it('edge_state_null_knowledge_returns_null: knowledge=null renders nothing', () => {
    const { container } = render(<KnowledgeDigest knowledge={null} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('edge_state_both_arrays_empty_returns_null: empty patterns + followups render nothing', () => {
    const { container } = render(
      <KnowledgeDigest
        knowledge={kf({ patterns: [], deferredFollowups: [] })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('edge_state_only_patterns_no_followups_column: patterns only ⇒ no follow-ups heading', () => {
    render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    expect(
      screen.getByRole('heading', { name: 'Patterns' }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Deferred follow-ups' }),
    ).toBeNull();
    expect(screen.getByText(/1 patterns · 0 deferred/i)).toBeInTheDocument();
  });

  it('edge_input_openquestions_not_surfaced: openQuestions alone ⇒ still null', () => {
    const { container } = render(
      <KnowledgeDigest
        knowledge={kf({ openQuestions: [{ name: 'q1' }], patterns: [] })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
    expect(screen.queryByText('q1')).toBeNull();
  });

  // ── Error recovery ─────────────────────────────────────────────────────
  it('err_non_array_patterns_no_throw: non-array patterns ⇒ treated empty, returns null', () => {
    const { container } = render(
      <KnowledgeDigest
        knowledge={kf({ patterns: { not: 'an array' } })}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('err_missing_deferredfollowups_key: absent deferredFollowups ⇒ patterns still render', () => {
    render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    expect(screen.getByText('p1')).toBeInTheDocument();
    expect(screen.getByText(/1 patterns · 0 deferred/i)).toBeInTheDocument();
  });

  // ── Data integrity ─────────────────────────────────────────────────────
  it('data_collapsed_by_default: <details> has no open attribute', () => {
    const { container } = render(
      <KnowledgeDigest knowledge={kf({ patterns: [{ name: 'p1' }] })} />,
    );
    expect(container.querySelector('details')).not.toHaveAttribute('open');
  });

  it('data_summary_pattern_then_followup_order: Patterns column precedes Deferred follow-ups', () => {
    render(
      <KnowledgeDigest
        knowledge={kf({
          patterns: [{ name: 'p1' }],
          deferredFollowups: [{ name: 'f1' }],
        })}
      />,
    );
    const patternsH = screen.getByRole('heading', { name: 'Patterns' });
    const followupsH = screen.getByRole('heading', {
      name: 'Deferred follow-ups',
    });
    expect(
      patternsH.compareDocumentPosition(followupsH) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
