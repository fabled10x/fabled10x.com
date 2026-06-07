import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import type { Product } from '@/content/schemas';
import { ProductCard } from '../ProductCard';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const PRODUCT_CARD_SOURCE = 'src/components/products/ProductCard.tsx';
const GLOBALS_CSS = readSource('src/app/globals.css');
const FORBIDDEN_SENTINEL_SOURCE = readSource('src/__tests__/brand/forbidden-patterns.test.ts');

const BASE_PRODUCT: Product = {
  id: 'prod-wf',
  slug: 'workflow-templates',
  title: 'Workflow Templates Pro',
  tagline: 'Ship projects faster.',
  summary: 'Templates for discovery through delivery.',
  category: 'workflow-templates',
  licenseType: 'single-user',
  priceCents: 4900,
  currency: 'usd',
  stripePriceId: 'price_wf',
  assetFilename: 'workflow-templates.zip',
  lllEntryUrls: [],
  relatedCaseIds: [],
  publishedAt: '2026-04-12T00:00:00Z',
};

function findArticle(container: HTMLElement): HTMLElement {
  const article = container.querySelector('article');
  expect(article).not.toBeNull();
  return article as HTMLElement;
}

function findAnchor(container: HTMLElement): HTMLAnchorElement {
  const a = container.querySelector('a');
  expect(a).not.toBeNull();
  return a as HTMLAnchorElement;
}

describe('ProductCard (so-6.3 EditorialCard refactor)', () => {
  // ─── Unit ───────────────────────────────────────────────────────────────

  it('unit_card_category_label: renders PRODUCT_CATEGORY_LABELS[category]', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('Workflow Templates')).toBeInTheDocument();
  });

  it('unit_card_category_uses_span_label: category rendered inside <span class="label">', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const span = container.querySelector('span.label');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('Workflow Templates');
  });

  it('unit_card_title_h3: renders product.title as <h3>', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    const heading = screen.getByRole('heading', { level: 3 });
    expect(heading).toHaveTextContent('Workflow Templates Pro');
  });

  it('unit_card_title_uses_display3: title heading carries .display-3 utility', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const h3 = container.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.className).toMatch(/\bdisplay-3\b/);
  });

  it('unit_card_tagline: renders product.tagline', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('Ship projects faster.')).toBeInTheDocument();
  });

  it('unit_card_tagline_uses_body2: tagline carries .body-2 utility', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const tagline = Array.from(container.querySelectorAll('p')).find(
      (p) => p.textContent === 'Ship projects faster.',
    );
    expect(tagline).toBeDefined();
    expect(tagline!.className).toMatch(/\bbody-2\b/);
  });

  it('unit_card_price_format_default: renders formatted price ($49 USD, 0 fraction digits)', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  it('unit_card_price_uses_mono_utility: price element carries .mono utility (JetBrains family)', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    const price = screen.getByText('$49');
    expect(price.className).toMatch(/\bmono\b/);
  });

  it('unit_card_price_uses_text_ink: price element carries text-(--color-ink) token', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    const price = screen.getByText('$49');
    expect(price.className).toMatch(/text-\(--color-ink\)/);
  });

  it('unit_card_price_uses_text_base: price element carries text-base', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    const price = screen.getByText('$49');
    expect(price.className).toMatch(/\btext-base\b/);
  });

  it('unit_card_link_href: whole-card link points to /products/{slug}', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const anchor = findAnchor(container);
    expect(anchor.getAttribute('href')).toBe('/products/workflow-templates');
  });

  it('unit_card_link_wraps_article: exactly one anchor wraps exactly one <article>; no nested anchors', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const anchors = container.querySelectorAll('a');
    const articles = container.querySelectorAll('article');
    expect(anchors.length).toBe(1);
    expect(articles.length).toBe(1);
    expect(anchors[0].querySelectorAll('a').length).toBe(0);
  });

  it('unit_card_uses_editorial_card: source imports EditorialCard from @/components/brand/EditorialCard', () => {
    const src = readSource(PRODUCT_CARD_SOURCE);
    expect(src).toMatch(
      /import\s+\{\s*EditorialCard\s*\}\s+from\s+['"]@\/components\/brand\/EditorialCard['"]/,
    );
  });

  it('unit_format_price_usd_default: $49 rendered for 4900 cents usd', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  it('unit_format_price_zero_cents: $0 rendered for 0 cents', () => {
    render(<ProductCard product={{ ...BASE_PRODUCT, priceCents: 0 }} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  // ─── Integration ────────────────────────────────────────────────────────

  it('integration_card_composes_editorial_card: rendered shape matches EditorialCard (tag span + h3 + subtitle p + footer div under one article)', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const article = findArticle(container);
    expect(article.querySelector('span.label')).not.toBeNull();
    const h3 = article.querySelector('h3');
    expect(h3).not.toBeNull();
    expect(h3!.className).toMatch(/\bdisplay-3\b/);
    const tagline = Array.from(article.querySelectorAll('p')).find(
      (p) => p.textContent === 'Ship projects faster.',
    );
    expect(tagline).toBeDefined();
    const price = screen.getByText('$49');
    expect(price.tagName).toBe('SPAN');
    const footerDiv = price.parentElement;
    expect(footerDiv).not.toBeNull();
    expect(footerDiv!.tagName).toBe('DIV');
    expect(footerDiv!.className).toMatch(/\bflex\b/);
    expect(footerDiv!.className).toMatch(/items-center/);
  });

  // ─── Accessibility ──────────────────────────────────────────────────────

  it('a11y_card_h3_under_h1: card uses h3 (page h1 + card h3 — documented anti-skip exception)', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.queryByRole('heading', { level: 2 })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('a11y_card_link_focus_visible_outline: card link delegates focus-visible:outline-(--color-oxblood) to EditorialCard LINK_BASE', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const anchor = findAnchor(container);
    expect(anchor.className).toMatch(/focus-visible:outline-\(--color-oxblood\)/);
  });

  it('a11y_card_link_focus_offset: card link delegates focus-visible:outline-offset-2 to EditorialCard LINK_BASE', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const anchor = findAnchor(container);
    expect(anchor.className).toMatch(/focus-visible:outline-offset-2/);
  });

  it('a11y_card_link_descriptive_text: link contains category + title + tagline + price visible text', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const anchor = findAnchor(container);
    const text = anchor.textContent ?? '';
    expect(text).toContain('Workflow Templates');
    expect(text).toContain('Workflow Templates Pro');
    expect(text).toContain('Ship projects faster.');
    expect(text).toContain('$49');
  });

  // ─── Infrastructure (source-grep) ───────────────────────────────────────

  it('infra_no_placeholder_palette_classes: ProductCard.tsx contains no placeholder palette tokens', () => {
    const src = readSource(PRODUCT_CARD_SOURCE);
    expect(src).not.toMatch(/\bborder-mist\b/);
    expect(src).not.toMatch(/\bhover:border-accent\b/);
    expect(src).not.toMatch(/\bgroup-hover:text-accent\b/);
    expect(src).not.toMatch(/\btext-muted\b/);
    expect(src).not.toMatch(/\bfont-display\b/);
    expect(src).not.toMatch(/\brounded-lg\b/);
    expect(src).not.toMatch(/\btext-xs\s+uppercase\s+tracking-wide\b/);
  });

  it('infra_no_inline_hex_colors: ProductCard.tsx contains no #hex color literals', () => {
    const src = readSource(PRODUCT_CARD_SOURCE);
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
  });

  it('infra_imports_editorial_card_from_brand: exactly one EditorialCard import from @/components/brand/EditorialCard', () => {
    const src = readSource(PRODUCT_CARD_SOURCE);
    const matches = src.match(
      /import\s+\{[^}]*\bEditorialCard\b[^}]*\}\s+from\s+['"]@\/components\/brand\/EditorialCard['"]/g,
    );
    expect(matches).not.toBeNull();
    expect(matches!.length).toBe(1);
  });

  it('infra_no_direct_next_link_import: ProductCard.tsx does NOT import next/link (delegated to EditorialCard)', () => {
    const src = readSource(PRODUCT_CARD_SOURCE);
    expect(src).not.toMatch(/from\s+['"]next\/link['"]/);
  });

  it("infra_no_use_client_directive: ProductCard.tsx is RSC-pure (no 'use client')", () => {
    const src = readSource(PRODUCT_CARD_SOURCE);
    expect(src).not.toMatch(/^['"]use client['"]/m);
  });

  it('infra_mono_utility_resolves_in_globals_css: .mono utility declares font-family: var(--font-mono)', () => {
    expect(GLOBALS_CSS).toMatch(/\.mono\s*\{[^}]*font-family\s*:\s*var\(\s*--font-mono\s*\)/);
  });

  it('infra_color_ink_token_resolves: globals.css declares --color-ink', () => {
    expect(GLOBALS_CSS).toMatch(/--color-ink\s*:/);
  });

  it('infra_forbidden_pattern_sentinel_clean: ProductCard.tsx is NOT in forbidden-patterns SKIP_PATHS', () => {
    expect(FORBIDDEN_SENTINEL_SOURCE).not.toMatch(
      /['"]src\/components\/products\/ProductCard\.tsx['"]/,
    );
  });

  // ─── Edge Cases ─────────────────────────────────────────────────────────

  it('edge_input_zero_price: priceCents=0 renders $0', () => {
    render(<ProductCard product={{ ...BASE_PRODUCT, priceCents: 0 }} />);
    expect(screen.getByText('$0')).toBeInTheDocument();
  });

  it('edge_input_large_price: priceCents=9999900 renders $99,999 with thousands separator', () => {
    render(<ProductCard product={{ ...BASE_PRODUCT, priceCents: 9999900 }} />);
    expect(screen.getByText('$99,999')).toBeInTheDocument();
  });

  it('edge_input_long_title: 300-char title renders in full without truncation', () => {
    const longTitle = 'Word '.repeat(60).trim();
    render(<ProductCard product={{ ...BASE_PRODUCT, title: longTitle }} />);
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(longTitle);
  });

  it('edge_input_special_chars_in_title: HTML-like chars in title render escaped, never as raw HTML', () => {
    const hostile = '<script>X</script> & "quoted"';
    const { container } = render(
      <ProductCard product={{ ...BASE_PRODUCT, title: hostile }} />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(screen.getByRole('heading', { level: 3 }).textContent).toBe(hostile);
  });

  it('edge_input_eur_currency: currency=eur uses uppercase EUR (Intl.NumberFormat requirement)', () => {
    render(<ProductCard product={{ ...BASE_PRODUCT, currency: 'eur' }} />);
    const candidates = ['€49', 'EUR 49', '€49.00'];
    const found = candidates.some((s) => screen.queryByText(s) !== null);
    expect(found).toBe(true);
  });

  it('edge_state_slug_with_dashes: dashed slug builds /products/complete-playbook href correctly', () => {
    const { container } = render(
      <ProductCard
        product={{ ...BASE_PRODUCT, slug: 'complete-playbook', category: 'complete-playbook' }}
      />,
    );
    const anchor = findAnchor(container);
    expect(anchor.getAttribute('href')).toBe('/products/complete-playbook');
  });

  // ─── Error Recovery ─────────────────────────────────────────────────────

  it('err_render_no_throw: render with valid minimum Product never throws', () => {
    expect(() => render(<ProductCard product={BASE_PRODUCT} />)).not.toThrow();
  });

  // ─── Data Integrity ─────────────────────────────────────────────────────

  it('data_price_format_precision: no decimal digits rendered for 12900 cents', () => {
    render(<ProductCard product={{ ...BASE_PRODUCT, priceCents: 12900 }} />);
    expect(screen.getByText('$129')).toBeInTheDocument();
    expect(screen.queryByText('$129.00')).not.toBeInTheDocument();
  });

  it('data_price_currency_uppercased: lowercase currency from schema does not throw', () => {
    expect(() =>
      render(<ProductCard product={{ ...BASE_PRODUCT, currency: 'usd' }} />),
    ).not.toThrow();
    expect(screen.getByText('$49')).toBeInTheDocument();
  });

  it('data_category_label_lookup_not_raw_slug: tag text is human label, not enum slug', () => {
    render(<ProductCard product={BASE_PRODUCT} />);
    expect(screen.getByText('Workflow Templates')).toBeInTheDocument();
    expect(screen.queryByText('workflow-templates')).not.toBeInTheDocument();
  });

  it('data_link_href_exact_path: href is exactly /products/{slug} — no trailing slash, no query', () => {
    const { container } = render(<ProductCard product={BASE_PRODUCT} />);
    const anchor = findAnchor(container);
    const href = anchor.getAttribute('href');
    expect(href).toBe('/products/workflow-templates');
    expect(href).not.toMatch(/\?$|\/$/);
  });
});
