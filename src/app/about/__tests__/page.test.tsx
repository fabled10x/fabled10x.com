import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import About, { metadata } from '../page';

describe('About', () => {
  // --- Unit ---

  it('unit_h1_about', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { level: 1, name: 'About' }),
    ).toBeInTheDocument();
  });

  it('unit_premise_paragraph_one', () => {
    render(<About />);
    // "Fabled10X" appears in both premise and LLL card — use getAllByText
    const fabledMatches = screen.getAllByText(/Fabled10X/);
    expect(fabledMatches.length).toBeGreaterThan(0);
    expect(screen.getByText(/one person/i)).toBeInTheDocument();
  });

  it('unit_premise_paragraph_two', () => {
    render(<About />);
    expect(screen.getByText(/agent workflow/i)).toBeInTheDocument();
  });

  it('unit_lll_card_heading', () => {
    render(<About />);
    expect(
      screen.getByRole('heading', { level: 2, name: 'The Large Language Library' }),
    ).toBeInTheDocument();
  });

  it('unit_lll_outbound_link_present', () => {
    render(<About />);
    const link = screen.getByRole('link', {
      name: 'The Large Language Library',
    });
    expect(link).toBeInTheDocument();
  });

  it('unit_lll_outbound_link_href', () => {
    render(<About />);
    const link = screen.getByRole('link', {
      name: 'The Large Language Library',
    });
    expect(link).toHaveAttribute('href', 'https://largelanguagelibrary.ai');
  });

  it('unit_lll_copy_sister_project_language', () => {
    render(<About />);
    expect(screen.getByText(/Fabled10X built/)).toBeInTheDocument();
  });

  // --- Integration ---

  it('int_uses_container_wrapper', () => {
    const { container } = render(<About />);
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('int_two_sections_rendered', () => {
    const { container } = render(<About />);
    const sections = container.querySelectorAll('section');
    expect(sections).toHaveLength(2);
  });

  it('int_static_sync_component', () => {
    // Synchronous render should complete without awaiting. If About becomes
    // async, render would return a thenable rather than a RenderResult.
    const result = render(<About />);
    expect(result.container).toBeInstanceOf(HTMLElement);
  });

  // --- Accessibility ---

  it('a11y_exactly_one_h1', () => {
    render(<About />);
    const h1s = screen.getAllByRole('heading', { level: 1 });
    expect(h1s).toHaveLength(1);
  });

  it('a11y_heading_hierarchy_no_skip', () => {
    const { container } = render(<About />);
    const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map((h) =>
      Number(h.tagName.substring(1)),
    );
    expect(levels).toContain(1);
    expect(levels).toContain(2);
    // No h3+ on this page — premise + LLL card only.
    expect(levels.every((lv) => lv <= 2)).toBe(true);
  });

  it('a11y_article_landmark', () => {
    const { container } = render(<About />);
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
  });

  it('a11y_lll_link_accessible_name', () => {
    render(<About />);
    const link = screen.getByRole('link', {
      name: 'The Large Language Library',
    });
    expect(link.textContent!.trim().length).toBeGreaterThan(0);
  });

  // --- Infrastructure (metadata) ---

  it('infra_metadata_export_title', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('About');
  });

  it('infra_metadata_export_description', () => {
    expect(metadata.description).toBeDefined();
    expect(typeof metadata.description).toBe('string');
    const desc = metadata.description as string;
    expect(desc.length).toBeGreaterThan(0);
    expect(desc).toMatch(/Large Language Library|sister/i);
  });

  // --- Edge case ---

  it('edge_outbound_link_is_absolute_https', () => {
    render(<About />);
    const link = screen.getByRole('link', {
      name: 'The Large Language Library',
    });
    const href = link.getAttribute('href');
    expect(href).toMatch(/^https:\/\//);
    expect(href).toContain('largelanguagelibrary.ai');
  });

  it('edge_max_w_3xl_class_applied', () => {
    const { container } = render(<About />);
    const article = container.querySelector('article');
    expect(article).toBeInTheDocument();
    expect(article!.className).toContain('max-w-3xl');
  });

  // --- Data integrity ---

  it('data_metadata_shape_consistency', () => {
    expect(typeof metadata).toBe('object');
    expect(metadata).not.toBeNull();
    expect(typeof metadata.title).toBe('string');
    expect(typeof metadata.description).toBe('string');
  });
});
