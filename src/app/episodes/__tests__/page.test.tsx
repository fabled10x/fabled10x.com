import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/content/episodes', () => ({
  getAllEpisodes: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { getAllEpisodes } from '@/lib/content/episodes';
import EpisodesIndex, { metadata } from '../page';

const mockGetAllEpisodes = vi.mocked(getAllEpisodes);

const MOCK_EPISODES = [
  {
    meta: {
      id: 'ep-001',
      slug: 'first-episode',
      title: 'First Episode Title',
      series: 'Test Series',
      season: 1,
      act: 1,
      episodeNumber: 1,
      tier: 'flagship' as const,
      pillar: 'delivery' as const,
      summary: 'First episode summary.',
      sourceMaterialIds: [],
      lllEntryUrls: [],
    },
    slug: 'first-episode',
    Component: () => null,
  },
  {
    meta: {
      id: 'ep-002',
      slug: 'second-episode',
      title: 'Second Episode Title',
      series: 'Test Series',
      season: 1,
      act: 1,
      episodeNumber: 2,
      tier: 'playbook' as const,
      pillar: 'workflow' as const,
      summary: 'Second episode summary.',
      sourceMaterialIds: [],
      lllEntryUrls: [],
    },
    slug: 'second-episode',
    Component: () => null,
  },
];

async function renderEpisodesIndex() {
  const jsx = await EpisodesIndex();
  return render(jsx);
}

describe('EpisodesIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllEpisodes.mockResolvedValue(MOCK_EPISODES);
  });

  // --- Unit ---

  it('unit_heading', async () => {
    await renderEpisodesIndex();
    expect(screen.getByRole('heading', { level: 1, name: 'Episodes' })).toBeInTheDocument();
  });

  it('unit_subtitle', async () => {
    await renderEpisodesIndex();
    expect(screen.getByText(/Every episode from the channel/i)).toBeInTheDocument();
  });

  it('unit_card_title', async () => {
    await renderEpisodesIndex();
    expect(screen.getByText('First Episode Title')).toBeInTheDocument();
    expect(screen.getByText('Second Episode Title')).toBeInTheDocument();
  });

  it('unit_card_tier_label', async () => {
    await renderEpisodesIndex();
    expect(screen.getByText('Flagship Series (Documentary)')).toBeInTheDocument();
    expect(screen.getByText('Playbook Series (Standalone)')).toBeInTheDocument();
  });

  it('unit_card_pillar', async () => {
    await renderEpisodesIndex();
    expect(screen.getByText(/What can an AI agent team actually deliver/i)).toBeInTheDocument();
    expect(screen.getByText(/How do you manage AI agents/i)).toBeInTheDocument();
  });

  it('unit_card_summary', async () => {
    await renderEpisodesIndex();
    expect(screen.getByText('First episode summary.')).toBeInTheDocument();
    expect(screen.getByText('Second episode summary.')).toBeInTheDocument();
  });

  it('unit_card_link', async () => {
    await renderEpisodesIndex();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/episodes/first-episode');
    expect(hrefs).toContain('/episodes/second-episode');
  });

  // --- Integration ---

  it('int_calls_getAllEpisodes', async () => {
    await renderEpisodesIndex();
    expect(mockGetAllEpisodes).toHaveBeenCalledOnce();
  });

  it('int_uses_container', async () => {
    const { container } = await renderEpisodesIndex();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('int_grid_layout', async () => {
    const { container } = await renderEpisodesIndex();
    const grid = container.querySelector('.md\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });

  // --- Edge ---

  it('edge_empty_episodes', async () => {
    mockGetAllEpisodes.mockResolvedValue([]);
    await renderEpisodesIndex();
    expect(screen.getByRole('heading', { level: 1, name: 'Episodes' })).toBeInTheDocument();
    const list = screen.queryByRole('list');
    if (list) {
      expect(list.querySelectorAll('li')).toHaveLength(0);
    }
  });

  it('edge_single_episode', async () => {
    mockGetAllEpisodes.mockResolvedValue([MOCK_EPISODES[0]]);
    const { container } = await renderEpisodesIndex();
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(1);
  });

  // --- Data integrity ---

  it('data_card_count', async () => {
    const { container } = await renderEpisodesIndex();
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(MOCK_EPISODES.length);
  });

  // --- Accessibility ---

  it('a11y_heading_hierarchy', async () => {
    await renderEpisodesIndex();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s).toHaveLength(MOCK_EPISODES.length);
  });

  it('a11y_links_text', async () => {
    await renderEpisodesIndex();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  // --- Infrastructure ---

  it('infra_metadata_export', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Episodes');
  });
});
