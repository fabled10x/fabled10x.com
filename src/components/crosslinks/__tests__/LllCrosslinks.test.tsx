import { render, screen } from '@testing-library/react';
import { LllCrosslinks } from '../LllCrosslinks';

const MOCK_URLS = [
  'https://largelanguagelibrary.ai/entries/discovery-process',
  'https://largelanguagelibrary.ai/entries/agent-workflow',
];

describe('LllCrosslinks', () => {
  // --- Unit ---

  it('unit_renders_heading', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    expect(
      screen.getByRole('heading', { name: /Large Language Library/i }),
    ).toBeInTheDocument();
  });

  it('unit_renders_links', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);
  });

  it('unit_link_hrefs', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const links = screen.getAllByRole('link');
    expect(links[0]).toHaveAttribute('href', MOCK_URLS[0]);
    expect(links[1]).toHaveAttribute('href', MOCK_URLS[1]);
  });

  // --- Edge ---

  it('edge_empty_urls', () => {
    const { container } = render(<LllCrosslinks urls={[]} />);
    expect(container.innerHTML).toBe('');
  });

  // --- Accessibility ---

  it('a11y_links_have_text', () => {
    render(<LllCrosslinks urls={MOCK_URLS} />);
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });
});
