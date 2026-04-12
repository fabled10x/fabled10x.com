import { vi } from 'vitest';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/lib/content/cases', () => ({
  getAllCases: vi.fn(),
}));

import { render, screen } from '@testing-library/react';
import { getAllCases } from '@/lib/content/cases';
import CasesIndex, { metadata } from '../page';

const mockGetAllCases = vi.mocked(getAllCases);

const MOCK_CASES = [
  {
    meta: {
      id: 'case-001',
      slug: 'first-case',
      title: 'First Case Title',
      client: 'Client Alpha',
      status: 'active' as const,
      summary: 'First case summary.',
      problem: 'First problem.',
      marketResearch: '',
      discoveryProcess: '',
      technicalDecisions: '',
      deliverables: ['Deliverable A'],
      outcome: 'First outcome.',
      relatedEpisodeIds: [],
      lllEntryUrls: [],
    },
    slug: 'first-case',
    Component: () => null,
  },
  {
    meta: {
      id: 'case-002',
      slug: 'second-case',
      title: 'Second Case Title',
      client: 'Client Beta',
      status: 'shipped' as const,
      summary: 'Second case summary.',
      problem: 'Second problem.',
      marketResearch: '',
      discoveryProcess: '',
      technicalDecisions: '',
      deliverables: [],
      outcome: 'Second outcome.',
      relatedEpisodeIds: [],
      lllEntryUrls: [],
    },
    slug: 'second-case',
    Component: () => null,
  },
];

async function renderCasesIndex() {
  const jsx = await CasesIndex();
  return render(jsx);
}

describe('CasesIndex', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetAllCases.mockResolvedValue(MOCK_CASES);
  });

  // --- Unit ---

  it('unit_index_heading', async () => {
    await renderCasesIndex();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Case Studies' }),
    ).toBeInTheDocument();
  });

  it('unit_index_subtitle', async () => {
    await renderCasesIndex();
    expect(
      screen.getByText(/Real projects, real clients, real outcomes/i),
    ).toBeInTheDocument();
  });

  it('unit_index_card_title', async () => {
    await renderCasesIndex();
    expect(screen.getByText('First Case Title')).toBeInTheDocument();
    expect(screen.getByText('Second Case Title')).toBeInTheDocument();
  });

  it('unit_index_card_status_label', async () => {
    await renderCasesIndex();
    expect(screen.getByText('Active Engagement')).toBeInTheDocument();
    expect(screen.getByText('Shipped & In Production')).toBeInTheDocument();
  });

  it('unit_index_card_client', async () => {
    await renderCasesIndex();
    expect(screen.getByText('Client Alpha')).toBeInTheDocument();
    expect(screen.getByText('Client Beta')).toBeInTheDocument();
  });

  it('unit_index_card_summary', async () => {
    await renderCasesIndex();
    expect(screen.getByText('First case summary.')).toBeInTheDocument();
    expect(screen.getByText('Second case summary.')).toBeInTheDocument();
  });

  it('unit_index_card_link', async () => {
    await renderCasesIndex();
    const links = screen.getAllByRole('link');
    const hrefs = links.map((l) => l.getAttribute('href'));
    expect(hrefs).toContain('/cases/first-case');
    expect(hrefs).toContain('/cases/second-case');
  });

  // --- Integration ---

  it('int_index_calls_getAllCases', async () => {
    await renderCasesIndex();
    expect(mockGetAllCases).toHaveBeenCalledOnce();
  });

  it('int_index_uses_container', async () => {
    const { container } = await renderCasesIndex();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  it('int_index_grid_layout', async () => {
    const { container } = await renderCasesIndex();
    const grid = container.querySelector('.md\\:grid-cols-2');
    expect(grid).toBeInTheDocument();
  });

  // --- Edge ---

  it('edge_index_empty_cases', async () => {
    mockGetAllCases.mockResolvedValue([]);
    await renderCasesIndex();
    expect(
      screen.getByRole('heading', { level: 1, name: 'Case Studies' }),
    ).toBeInTheDocument();
    const list = screen.queryByRole('list');
    if (list) {
      expect(list.querySelectorAll('li')).toHaveLength(0);
    }
  });

  it('edge_index_single_case', async () => {
    mockGetAllCases.mockResolvedValue([MOCK_CASES[0]]);
    const { container } = await renderCasesIndex();
    const cards = container.querySelectorAll('li');
    expect(cards).toHaveLength(1);
  });

  // --- Accessibility ---

  it('a11y_index_heading_hierarchy', async () => {
    await renderCasesIndex();
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s).toHaveLength(MOCK_CASES.length);
  });

  it('a11y_index_links_text', async () => {
    await renderCasesIndex();
    const links = screen.getAllByRole('link');
    links.forEach((link) => {
      expect(link.textContent!.trim().length).toBeGreaterThan(0);
    });
  });

  // --- Infrastructure ---

  it('infra_index_metadata_export', () => {
    expect(metadata).toBeDefined();
    expect(metadata.title).toBe('Case Studies');
  });
});
