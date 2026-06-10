// /thumb-preview/index dev-only example-URL index — Red phase (styling-overhaul-8.3).
//
// Lists copy-pasteable /thumb-preview?... example URLs + an accent legend so the
// user has starting points. Same NODE_ENV dev-only gate as the composer page.

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { notFound } from 'next/navigation';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('next/link', () => ({
  default: ({ href, children, ...rest }: Record<string, unknown>) => (
    <a href={href as string} {...rest}>
      {children as React.ReactNode}
    </a>
  ),
}));

const ALLOWED = ['?', '.', '!', '→', '✕', '✓', '—'];

async function loadPage() {
  return (await import('../page')).default as () => Promise<React.ReactElement | undefined>;
}

async function renderDev() {
  vi.stubEnv('NODE_ENV', 'development');
  const Page = await loadPage();
  const ui = await Page();
  return render(ui as React.ReactElement);
}

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe('ThumbPreviewIndexPage', () => {
  /// Tests checklist items: 2
  it('unit_index_lists_example_urls: renders >=1 example /thumb-preview link', async () => {
    const { container } = await renderDev();
    const links = Array.from(container.querySelectorAll('a')).filter((a) =>
      (a.getAttribute('href') ?? '').includes('/thumb-preview'),
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links.some((a) => (a.getAttribute('href') ?? '').includes('accent='))).toBe(true);
  });

  /// Tests checklist items: 2
  it('int_index_links_target_thumb_preview: every example href targets /thumb-preview with valid accents', async () => {
    const { container } = await renderDev();
    const links = Array.from(container.querySelectorAll('a')).filter((a) =>
      (a.getAttribute('href') ?? '').includes('/thumb-preview'),
    );
    expect(links.length).toBeGreaterThanOrEqual(1);
    for (const a of links) {
      const href = a.getAttribute('href') ?? '';
      expect(href.startsWith('/thumb-preview')).toBe(true);
      const match = href.match(/[?&]accent=([^&]+)/);
      if (match) {
        const accent = decodeURIComponent(match[1]);
        expect(ALLOWED).toContain(accent);
      }
    }
  });

  /// Tests checklist items: 2
  it('sec_info_disclosure_prod_gate_index: production → notFound(), no render', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const Page = await loadPage();
    const result = await Page();
    expect(notFound).toHaveBeenCalled();
    expect(result).toBeUndefined();
  });
});
