import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LllCrosslinks } from '../LllCrosslinks';

const MOCK_URLS = [
  'https://largelanguagelibrary.ai/entries/discovery-process',
  'https://largelanguagelibrary.ai/entries/agent-workflow',
];

describe('LllCrosslinks', () => {
  // --- Unit ---

  it('unit_crosslinks_null_on_empty', () => {
    const { container } = render(<LllCrosslinks urls={[]} />);
    expect(container.innerHTML).toBe('');
  });

  it('unit_crosslinks_renders_urls', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const links = screen.getAllByRole('link');
    // MOCK_URLS + one inline link to largelanguagelibrary.ai in the intro paragraph
    const entryLinks = links.filter((a) =>
      MOCK_URLS.includes(a.getAttribute('href') ?? ''),
    );
    expect(entryLinks).toHaveLength(MOCK_URLS.length);
  });

  it('unit_crosslinks_extract_slug_last_segment', () => {
    render(<LllCrosslinks urls={['https://largelanguagelibrary.ai/entries/discovery-process']} />);
    // The label should be derived from the last path segment
    expect(screen.getByText(/discovery process/i)).toBeInTheDocument();
  });

  it('unit_crosslinks_dashes_to_spaces', () => {
    render(<LllCrosslinks urls={['https://largelanguagelibrary.ai/entries/multi-word-entry-slug']} />);
    expect(screen.getByText(/multi word entry slug/i)).toBeInTheDocument();
    expect(screen.queryByText(/multi-word-entry-slug/i)).not.toBeInTheDocument();
  });

  it('unit_crosslinks_target_blank', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const entryLinks = screen
      .getAllByRole('link')
      .filter((a) => MOCK_URLS.includes(a.getAttribute('href') ?? ''));
    entryLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
    });
  });

  it('unit_crosslinks_rel_noopener', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const entryLinks = screen
      .getAllByRole('link')
      .filter((a) => MOCK_URLS.includes(a.getAttribute('href') ?? ''));
    entryLinks.forEach((link) => {
      expect(link.getAttribute('rel')).toMatch(/noopener/);
    });
  });

  it('unit_crosslinks_intro_mentions_lll', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    expect(screen.getByText(/large language library/i)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /largelanguagelibrary\.ai/i }),
    ).toBeInTheDocument();
  });

  it('unit_crosslinks_applies_classname', () => {
    const { container } = render(
      <LllCrosslinks urls={MOCK_URLS} className="my-custom-class" />,
    );
    const section = container.querySelector('section');
    expect(section).toBeInTheDocument();
    expect(section?.className).toContain('my-custom-class');
  });

  // --- Edge ---

  it('edge_crosslinks_malformed_url', () => {
    render(<LllCrosslinks urls={['not a url']} />);
    // Should not throw; should render the raw string as fallback label
    expect(screen.getByText('not a url')).toBeInTheDocument();
  });

  it('edge_crosslinks_root_url', () => {
    render(<LllCrosslinks urls={['https://largelanguagelibrary.ai/']} />);
    // No trailing path segment → label falls back to hostname
    const entryLinks = screen
      .getAllByRole('link')
      .filter((a) => a.getAttribute('href') === 'https://largelanguagelibrary.ai/');
    expect(entryLinks).toHaveLength(1);
    expect(entryLinks[0].textContent).toMatch(/largelanguagelibrary\.ai/);
  });

  // --- Accessibility ---

  it('a11y_crosslinks_external_indication', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const entryLinks = screen
      .getAllByRole('link')
      .filter((a) => MOCK_URLS.includes(a.getAttribute('href') ?? ''));
    entryLinks.forEach((link) => {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link.getAttribute('rel')).toMatch(/noopener/);
    });
  });
});
