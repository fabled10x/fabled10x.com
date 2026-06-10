import { describe, it, expect, vi, beforeEach } from 'vitest';
import { isValidElement, type ReactNode } from 'react';

vi.mock('next/og', () => ({
  ImageResponse: vi
    .fn()
    .mockImplementation((element: ReactNode, options: Record<string, unknown>) => ({
      __element: element,
      __options: options,
    })),
}));
vi.mock('@/lib/content/cases', () => ({
  getCaseBySlug: vi.fn(),
}));

import { ImageResponse } from 'next/og';
import { getCaseBySlug } from '@/lib/content/cases';
import Image, { size, contentType } from '../opengraph-image';

const MockImageResponse = vi.mocked(ImageResponse);
const mockGetCaseBySlug = vi.mocked(getCaseBySlug);

const OXBLOOD = '#6B2020';

const MOCK_CASE = {
  meta: {
    id: 'case-001',
    slug: 'rebuilt-the-stack',
    title: 'Rebuilt The Stack',
    client: 'Acme Corp',
    status: 'shipped' as const,
    summary: 'x',
    problem: 'CONFIDENTIAL_PROBLEM_TEXT',
    marketResearch: '',
    discoveryProcess: '',
    technicalDecisions: '',
    deliverables: [],
    outcome: 'CONFIDENTIAL_OUTCOME',
    contractValue: 250000,
    relatedEpisodeIds: [],
    lllEntryUrls: [],
  },
  slug: 'rebuilt-the-stack',
  Component: () => null,
};

type CaseEntry = Awaited<ReturnType<typeof getCaseBySlug>>;

function collectText(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string') return node;
  if (typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(collectText).join('');
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode };
    return collectText(props.children);
  }
  return '';
}
interface Span {
  style: Record<string, unknown>;
  text: string;
}
function collectSpans(node: ReactNode, acc: Span[] = []): Span[] {
  if (Array.isArray(node)) {
    node.forEach((n) => collectSpans(n, acc));
    return acc;
  }
  if (isValidElement(node)) {
    const props = node.props as { children?: ReactNode; style?: Record<string, unknown> };
    if (props.style) acc.push({ style: props.style, text: collectText(props.children) });
    collectSpans(props.children, acc);
  }
  return acc;
}
function accentGlyph(element: ReactNode): string | undefined {
  const oxbloodSpans = collectSpans(element).filter(
    (s) => s.style.color === OXBLOOD && typeof s.style.fontSize === 'number',
  );
  if (oxbloodSpans.length === 0) return undefined;
  oxbloodSpans.sort((a, b) => (b.style.fontSize as number) - (a.style.fontSize as number));
  return oxbloodSpans[0].text;
}

interface Captured {
  __element: ReactNode;
  __options: { width?: number; height?: number; fonts?: unknown[] };
}

describe('case opengraph-image (styling-overhaul-8.2)', () => {
  beforeEach(() => {
    MockImageResponse.mockClear();
    mockGetCaseBySlug.mockReset();
  });

  it('unit_case_config_exports', () => {
    expect(size).toEqual({ width: 1200, height: 630 });
    expect(contentType).toBe('image/png');
  });

  it('int_case_calls_loader_and_constructs', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE as unknown as CaseEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'rebuilt-the-stack' }) })) as unknown as Captured;
    expect(mockGetCaseBySlug).toHaveBeenCalledWith('rebuilt-the-stack');
    expect(MockImageResponse).toHaveBeenCalledTimes(1);
    expect(res.__options.fonts).toHaveLength(3);
    const text = collectText(res.__element);
    expect(text).toContain('Rebuilt The Stack');
    expect(text).toContain('Case · Acme Corp');
  });

  it('sec_info_disclosure_case_no_contract_value', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE as unknown as CaseEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'rebuilt-the-stack' }) })) as unknown as Captured;
    const text = collectText(res.__element);
    expect(text).not.toContain('250000');
    expect(text).not.toContain('CONFIDENTIAL_PROBLEM_TEXT');
    expect(text).not.toContain('CONFIDENTIAL_OUTCOME');
    expect(text).toContain('Rebuilt The Stack'); // public title present
    expect(text).toContain('Acme Corp'); // public client present
  });

  it('edge_state_case_status_not_rendered', async () => {
    const archived = { ...MOCK_CASE, meta: { ...MOCK_CASE.meta, status: 'archived' as const } };
    mockGetCaseBySlug.mockResolvedValue(archived as unknown as CaseEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'rebuilt-the-stack' }) })) as unknown as Captured;
    const text = collectText(res.__element);
    expect(text).toContain('Case · Acme Corp'); // tag unaffected by status
    expect(text).not.toContain('archived');
  });

  it('err_case_null_entry_fallback', async () => {
    mockGetCaseBySlug.mockResolvedValue(null);
    const res = (await Image({ params: Promise.resolve({ slug: 'missing' }) })) as unknown as Captured;
    expect(res).toBeDefined();
    expect(res.__options.width).toBe(1200);
    expect(res.__options.height).toBe(630);
  });

  it('data_consistency_accent_vocabulary', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE as unknown as CaseEntry);
    const res = (await Image({ params: Promise.resolve({ slug: 'rebuilt-the-stack' }) })) as unknown as Captured;
    expect(accentGlyph(res.__element)).toBe('.'); // cases close
  });

  it('perm_anonymous_case_og_allow', async () => {
    mockGetCaseBySlug.mockResolvedValue(MOCK_CASE as unknown as CaseEntry);
    const res = await Image({ params: Promise.resolve({ slug: 'rebuilt-the-stack' }) });
    expect(res).toBeDefined();
  });
});
