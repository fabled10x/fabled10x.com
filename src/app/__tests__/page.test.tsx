import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/content/episodes', () => ({
  getLatestEpisode: vi.fn(),
}));

vi.mock('@/components/capture/EmailCapture', () => ({
  EmailCapture: ({ source }: { source: string }) => (
    <div data-testid="email-capture" data-source={source} />
  ),
}));

import { render, screen } from '@testing-library/react';
import { getLatestEpisode } from '@/lib/content/episodes';
import Home from '../page';

const mockGetLatestEpisode = vi.mocked(getLatestEpisode);

const MOCK_EPISODE = {
  meta: {
    id: 'ep-001',
    slug: 'test-episode',
    title: 'Test Episode Title',
    series: 'Test Series',
    season: 1,
    act: 1,
    episodeNumber: 1,
    tier: 'flagship' as const,
    pillar: 'delivery' as const,
    summary: 'A test episode summary.',
    sourceMaterialIds: [],
    lllEntryUrls: [],
  },
  slug: 'test-episode',
  Component: () => null,
};

async function renderHome() {
  const jsx = await Home();
  return render(jsx);
}

describe('Homepage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLatestEpisode.mockResolvedValue(MOCK_EPISODE);
  });

  // --- Unit: Hero section ---

  it('unit_hero_heading', async () => {
    await renderHome();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toHaveTextContent('One person.');
  });

  it('unit_hero_tagline', async () => {
    await renderHome();
    expect(screen.getByText('The Fabled 10X Developer')).toBeInTheDocument();
  });

  it('unit_hero_summary', async () => {
    await renderHome();
    expect(
      screen.getByText(/documented real-world case study/),
    ).toBeInTheDocument();
  });

  it('unit_hero_email_capture', async () => {
    await renderHome();
    const capture = screen.getByTestId('email-capture');
    expect(capture).toHaveAttribute('data-source', 'homepage-hero');
  });

  // --- Unit: Latest episode ---

  it('unit_latest_episode_title', async () => {
    await renderHome();
    expect(
      screen.getByRole('link', { name: 'Test Episode Title' }),
    ).toBeInTheDocument();
  });

  it('unit_latest_episode_summary', async () => {
    await renderHome();
    expect(screen.getByText('A test episode summary.')).toBeInTheDocument();
  });

  it('unit_latest_episode_link', async () => {
    await renderHome();
    const link = screen.getByRole('link', { name: 'Test Episode Title' });
    expect(link).toHaveAttribute('href', '/episodes/test-episode');
  });

  // --- Unit: Section grid ---

  it('unit_sections_constant_count', async () => {
    await renderHome();
    const heading = screen.getByText('Where to next');
    const grid = heading.closest('section')!;
    const cards = grid.querySelectorAll('li');
    expect(cards).toHaveLength(3);
  });

  it('unit_sections_constant_hrefs', async () => {
    await renderHome();
    const heading = screen.getByText('Where to next');
    const grid = heading.closest('section')!;
    const links = grid.querySelectorAll('a');
    const hrefs = Array.from(links).map((a) => a.getAttribute('href'));
    expect(hrefs).toContain('/episodes');
    expect(hrefs).toContain('/cases');
    expect(hrefs).toContain('/about');
  });

  it('unit_sections_constant_titles', async () => {
    await renderHome();
    expect(screen.getByText('Episodes')).toBeInTheDocument();
    expect(screen.getByText('Case Studies')).toBeInTheDocument();
    expect(screen.getByText('About')).toBeInTheDocument();
  });

  it('unit_grid_card_count', async () => {
    await renderHome();
    const heading = screen.getByText('Where to next');
    const grid = heading.closest('section')!;
    const cards = grid.querySelectorAll('li');
    expect(cards).toHaveLength(3);
  });

  it('unit_grid_card_links', async () => {
    await renderHome();
    expect(screen.getByRole('link', { name: /Episodes/ })).toHaveAttribute(
      'href',
      '/episodes',
    );
    expect(screen.getByRole('link', { name: /Case Studies/ })).toHaveAttribute(
      'href',
      '/cases',
    );
    expect(screen.getByRole('link', { name: /About/ })).toHaveAttribute(
      'href',
      '/about',
    );
  });

  // --- Integration ---

  it('int_calls_getLatestEpisode', async () => {
    await renderHome();
    expect(mockGetLatestEpisode).toHaveBeenCalledOnce();
  });

  it('int_uses_container', async () => {
    const { container } = await renderHome();
    const wrappers = container.querySelectorAll('.mx-auto.max-w-5xl');
    expect(wrappers.length).toBeGreaterThanOrEqual(1);
  });

  it('int_three_sections', async () => {
    const { container } = await renderHome();
    const sections = container.querySelectorAll('section');
    // After bpd 3.1: hero + latest + Where to next + Inside the build = 4
    expect(sections).toHaveLength(4);
  });

  // --- Edge cases ---

  it('edge_no_latest_episode', async () => {
    mockGetLatestEpisode.mockResolvedValue(null);
    const { container } = await renderHome();
    expect(screen.queryByText('Latest episode')).not.toBeInTheDocument();
    const sections = container.querySelectorAll('section');
    // After bpd 3.1: hero + Where to next + Inside the build = 3 (latest omitted)
    expect(sections).toHaveLength(3);
  });

  it('edge_no_episode_grid_renders', async () => {
    mockGetLatestEpisode.mockResolvedValue(null);
    await renderHome();
    expect(screen.getByText('Where to next')).toBeInTheDocument();
  });

  // --- Data integrity ---

  it('data_sections_descriptions', async () => {
    await renderHome();
    const heading = screen.getByText('Where to next');
    const grid = heading.closest('section')!;
    const descriptions = grid.querySelectorAll('li p:last-child');
    descriptions.forEach((desc) => {
      expect(desc.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it('data_sections_complete', async () => {
    await renderHome();
    const heading = screen.getByText('Where to next');
    const grid = heading.closest('section')!;
    const cards = grid.querySelectorAll('li');
    cards.forEach((card) => {
      const link = card.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link!.getAttribute('href')).toBeTruthy();
      const texts = card.querySelectorAll('p');
      expect(texts.length).toBeGreaterThanOrEqual(2);
    });
  });

  // --- Accessibility ---

  it('a11y_heading_hierarchy', async () => {
    await renderHome();
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('a11y_links_have_text', async () => {
    await renderHome();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  it('a11y_sections_structure', async () => {
    const { container } = await renderHome();
    const sections = container.querySelectorAll('section');
    expect(sections.length).toBeGreaterThanOrEqual(3);
  });

  // --- Phase 3.1: Inside the build callout ---

  it('unit_homepage_inside_the_build_heading', async () => {
    await renderHome();
    expect(screen.getByRole('heading', { level: 2, name: /Inside the build/i })).toBeInTheDocument();
  });

  it('unit_homepage_inside_the_build_link', async () => {
    await renderHome();
    const link = screen.getByRole('link', { name: /Read the build log/i });
    expect(link).toHaveAttribute('href', '/build-log');
  });

  it('a11y_homepage_inside_the_build_h2', async () => {
    await renderHome();
    const heading = screen.getByRole('heading', { level: 2, name: /Inside the build/i });
    expect(heading.tagName).toBe('H2');
  });
});
