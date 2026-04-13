import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { MarkdownDocument } from '../MarkdownDocument';

const WORKSPACE_ROOT = process.cwd();

describe('MarkdownDocument', () => {
  // ---------------------------------------------------------------------------
  // Unit tests (11)
  // ---------------------------------------------------------------------------

  it('unit_renders_paragraph_with_bold', () => {
    const { container } = render(<MarkdownDocument body="Hello **world**." />);
    const p = container.querySelector('p');
    expect(p).toBeInTheDocument();
    const strong = p?.querySelector('strong');
    expect(strong).toBeInTheDocument();
    expect(strong?.textContent).toBe('world');
  });

  it('unit_renders_gfm_table_wrapped', () => {
    const md = '| col1 | col2 |\n|---|---|\n| a | b |';
    const { container } = render(<MarkdownDocument body={md} />);
    const wrapper = container.querySelector('.build-log-table-wrapper');
    expect(wrapper).toBeInTheDocument();
    const table = wrapper?.querySelector('table');
    expect(table).toBeInTheDocument();
    expect(table?.textContent).toContain('a');
    expect(table?.textContent).toContain('b');
  });

  it('unit_renders_fenced_code_block_with_language', () => {
    const { container } = render(
      <MarkdownDocument body={'```ts\nconst x = 1;\n```'} />
    );
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    const code = pre?.querySelector('code');
    expect(code).toBeInTheDocument();
    expect(code?.className).toMatch(/hljs/);
    expect(code?.className).toMatch(/language-ts/);
    // rehype-highlight injects child spans with hljs-* token classes
    const hljsTokens = code?.querySelectorAll('[class*="hljs-"]');
    expect(hljsTokens && hljsTokens.length).toBeGreaterThan(0);
  });

  it('unit_renders_inline_code_span', () => {
    const { container } = render(
      <MarkdownDocument body="use `foo` here" />
    );
    // Inline code = a <code> NOT inside a <pre>
    const codes = Array.from(container.querySelectorAll('code'));
    const inlineCode = codes.find(
      (c) => c.closest('pre') === null
    );
    expect(inlineCode).toBeTruthy();
    expect(inlineCode?.textContent).toBe('foo');
  });

  it('unit_renders_heading_with_autolink', () => {
    const { container } = render(<MarkdownDocument body="## Context" />);
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2?.getAttribute('id')).toBe('context');
    const anchor = h2?.querySelector('a.build-log-anchor');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', '#context');
    expect(anchor).toHaveAttribute('aria-label', 'Permalink');
  });

  it('unit_demotes_h1_to_h2', () => {
    const { container } = render(<MarkdownDocument body="# Title" />);
    expect(container.querySelector('h1')).toBeNull();
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    expect(h2?.textContent).toContain('Title');
  });

  it('unit_renders_markdown_link', () => {
    const { container } = render(
      <MarkdownDocument body="[example](https://example.com)" />
    );
    const a = container.querySelector('a[href="https://example.com"]');
    expect(a).toBeInTheDocument();
    expect(a?.textContent).toBe('example');
  });

  it('unit_jsx_in_code_block_rendered_as_text', () => {
    const { container } = render(
      <MarkdownDocument body={'```tsx\n<Foo bar="baz" />\n```'} />
    );
    const pre = container.querySelector('pre');
    expect(pre).toBeInTheDocument();
    expect(pre?.textContent).toContain('<Foo');
    expect(pre?.textContent).toContain('bar="baz"');
    // No real <Foo> rendered anywhere
    expect(container.querySelector('Foo')).toBeNull();
  });

  it('unit_renders_strikethrough', () => {
    const { container } = render(<MarkdownDocument body="~~deleted~~" />);
    const del = container.querySelector('del');
    expect(del).toBeInTheDocument();
    expect(del?.textContent).toBe('deleted');
  });

  it('unit_renders_task_list_checkboxes', () => {
    const { container } = render(
      <MarkdownDocument body={'- [x] done\n- [ ] todo'} />
    );
    const checkboxes = container.querySelectorAll(
      'input[type="checkbox"]'
    );
    expect(checkboxes.length).toBe(2);
    checkboxes.forEach((cb) => {
      expect(cb).toHaveAttribute('disabled');
    });
    expect((checkboxes[0] as HTMLInputElement).checked).toBe(true);
    expect((checkboxes[1] as HTMLInputElement).checked).toBe(false);
  });

  it('unit_wrapper_class_includes_build_log_prose_plus_custom', () => {
    const { container } = render(
      <MarkdownDocument body="hello" className="my-extra" />
    );
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    const classes = article?.className ?? '';
    expect(classes).toMatch(/\bbuild-log-prose\b/);
    expect(classes).toMatch(/\bmy-extra\b/);
  });

  // ---------------------------------------------------------------------------
  // Integration tests (2) — render real planning-doc content
  // ---------------------------------------------------------------------------

  it('i_real_phase_md_renders_without_crash', () => {
    const body = readFileSync(
      path.join(
        WORKSPACE_ROOT,
        'currentwork',
        'build-in-public-docs',
        'phase-1-foundation.md'
      ),
      'utf8'
    );
    const { container } = render(<MarkdownDocument body={body} />);
    const article = container.querySelector('article.build-log-prose');
    expect(article).toBeInTheDocument();
    // phase-1-foundation.md contains tables and fenced code blocks
    expect(container.querySelectorAll('table').length).toBeGreaterThan(0);
    expect(container.querySelectorAll('pre').length).toBeGreaterThan(0);
  });

  it('i_real_readme_md_renders_feature_table', () => {
    const body = readFileSync(
      path.join(WORKSPACE_ROOT, 'currentwork', 'website-foundation', 'README.md'),
      'utf8'
    );
    const { container } = render(<MarkdownDocument body={body} />);
    // Feature Overview table is GFM — should render as real <table> wrapped in overflow div
    expect(container.querySelectorAll('table').length).toBeGreaterThan(0);
    expect(
      container.querySelectorAll('.build-log-table-wrapper').length
    ).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Security tests (2) — residual XSS surface (rehype-raw NOT enabled)
  // ---------------------------------------------------------------------------

  it('sec_info_disclosure_script_tag_escaped', () => {
    const md = 'Hello <script>alert(1)</script> world';
    const { container } = render(<MarkdownDocument body={md} />);
    // No live <script> element in rendered output — raw HTML must be escaped, not executed
    expect(container.querySelectorAll('script').length).toBe(0);
  });

  it('sec_tampering_rehype_raw_not_enabled', () => {
    const md = '<div class="evil">hijacked</div>';
    const { container } = render(<MarkdownDocument body={md} />);
    // Raw HTML must not produce a live DOM node with the hostile class
    expect(container.querySelectorAll('.evil').length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Accessibility tests (3)
  // ---------------------------------------------------------------------------

  it('a11y_article_landmark_present', () => {
    render(<MarkdownDocument body="content" />);
    expect(screen.getByRole('article')).toBeInTheDocument();
  });

  it('a11y_anchor_has_aria_label', () => {
    const { container } = render(
      <MarkdownDocument body="## My Heading" />
    );
    const anchor = container.querySelector('a.build-log-anchor');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('aria-label', 'Permalink');
  });

  it('a11y_no_h1_rendered_by_markdown', () => {
    const { container } = render(<MarkdownDocument body="# Only H1" />);
    expect(container.querySelectorAll('h1').length).toBe(0);
  });

  // ---------------------------------------------------------------------------
  // Edge case tests (3)
  // ---------------------------------------------------------------------------

  it('edge_input_empty_body', () => {
    const { container } = render(<MarkdownDocument body="" />);
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article?.className).toMatch(/\bbuild-log-prose\b/);
  });

  it('edge_input_only_whitespace', () => {
    expect(() =>
      render(<MarkdownDocument body="   \n\n   " />)
    ).not.toThrow();
  });

  it('edge_state_very_long_body', () => {
    const section = '## Section\n\nParagraph text with **bold** and a `code` snippet.\n\n';
    const body = section.repeat(200); // ~12KB, 200 headings
    const { container } = render(<MarkdownDocument body={body} />);
    const h2s = container.querySelectorAll('h2');
    expect(h2s.length).toBe(200);
  });

  // ---------------------------------------------------------------------------
  // Error recovery tests (1)
  // ---------------------------------------------------------------------------

  it('err_partial_failure_malformed_gfm_table', () => {
    // Missing separator row — remark-gfm should NOT throw; fallback to paragraph rendering
    const md = '| a | b |\n| c | d |';
    expect(() => {
      const { container } = render(<MarkdownDocument body={md} />);
      expect(container.querySelector('article')).toBeInTheDocument();
    }).not.toThrow();
  });

  // ---------------------------------------------------------------------------
  // Data integrity tests (1)
  // ---------------------------------------------------------------------------

  it('data_sensitivity_heading_anchor_slug_matches', () => {
    const { container } = render(
      <MarkdownDocument body="## My Section Name" />
    );
    const h2 = container.querySelector('h2');
    expect(h2).toBeInTheDocument();
    const id = h2?.getAttribute('id');
    expect(id).toBe('my-section-name');
    const anchor = h2?.querySelector('a.build-log-anchor');
    expect(anchor).toBeInTheDocument();
    expect(anchor).toHaveAttribute('href', `#${id}`);
  });

  // ---------------------------------------------------------------------------
  // Infrastructure tests (1)
  // ---------------------------------------------------------------------------

  it('infra_headers_no_use_client_directive', () => {
    const source = readFileSync(
      path.join(
        WORKSPACE_ROOT,
        'src',
        'components',
        'build-log',
        'MarkdownDocument.tsx'
      ),
      'utf8'
    );
    // Server Component must not be client-ified
    expect(source).not.toMatch(/['"]use client['"]/);
  });
});
