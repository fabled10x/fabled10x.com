import { vi } from 'vitest';

vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
}));

vi.mock('@/lib/content/cohorts', () => ({
  getAllCohorts: vi.fn(),
  getCohortBySlug: vi.fn(),
}));

vi.mock('@/components/cohorts/CohortDetailHero', () => ({
  CohortDetailHero: ({ cohort }: { cohort: { title: string } }) => (
    <div data-testid="cohort-detail-hero">{cohort.title}</div>
  ),
}));

vi.mock('@/components/cohorts/WaitlistForm', () => ({
  WaitlistForm: ({
    cohortSlug,
    sourceTag,
  }: {
    cohortSlug: string;
    sourceTag?: string;
  }) => (
    <div
      data-testid="waitlist-form"
      data-cohort-slug={cohortSlug}
      data-source-tag={sourceTag ?? ''}
    >
      WaitlistForm
    </div>
  ),
}));

import { render, screen } from '@testing-library/react';
import { notFound } from 'next/navigation';
import { getAllCohorts, getCohortBySlug } from '@/lib/content/cohorts';
import CohortDetailPage, {
  dynamicParams,
  generateStaticParams,
  generateMetadata,
} from '../page';

const mockGetCohortBySlug = vi.mocked(getCohortBySlug);
const mockGetAllCohorts = vi.mocked(getAllCohorts);
const mockNotFound = vi.mocked(notFound);

const MOCK_MDX = () => <div data-testid="mdx-body">Cohort MDX content</div>;

const MOCK_COHORT_ANNOUNCED = {
  meta: {
    id: 'cohort-001',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Intensive',
    series: 'AI Delivery',
    tagline: 'Ship real AI projects in 6 weeks.',
    summary: 'An intensive cohort for solo consultants.',
    status: 'announced' as const,
    pillar: 'delivery' as const,
    startDate: '2026-07-06',
    endDate: '2026-08-14',
    durationWeeks: 6,
    capacity: 12,
    priceCents: 249900,
    currency: 'usd',
    stripePriceId: 'price_REPLACEMEBEFORESHIPPING_ai_delivery',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-01',
  },
  slug: 'ai-delivery-2026-q3',
  Component: MOCK_MDX,
};

const MOCK_COHORT_OPEN = {
  meta: {
    ...MOCK_COHORT_ANNOUNCED.meta,
    id: 'cohort-002',
    slug: 'workflow-mastery-2026-q4',
    title: 'Workflow Mastery',
    series: 'Workflow Mastery',
    tagline: 'Master AI-driven delivery workflows.',
    summary: 'A cohort focused on workflow optimization.',
    status: 'open' as const,
    pillar: 'workflow' as const,
    startDate: '2026-10-05',
    endDate: '2026-11-27',
    durationWeeks: 8,
    capacity: 10,
    priceCents: 349900,
    commitmentHoursPerWeek: 12,
  },
  slug: 'workflow-mastery-2026-q4',
  Component: MOCK_MDX,
};

function makeParams(slug: string) {
  return { params: Promise.resolve({ slug }) };
}

async function renderDetail(slug = 'ai-delivery-2026-q3') {
  const jsx = await CohortDetailPage(makeParams(slug));
  return render(jsx);
}

describe('CohortDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_ANNOUNCED);
    mockGetAllCohorts.mockResolvedValue([MOCK_COHORT_ANNOUNCED, MOCK_COHORT_OPEN]);
  });

  // --- Unit ---

  it('unit_detail_hero', async () => {
    await renderDetail();
    expect(screen.getByTestId('cohort-detail-hero')).toBeInTheDocument();
  });

  it('unit_detail_mdx_body', async () => {
    await renderDetail();
    expect(screen.getByTestId('mdx-body')).toBeInTheDocument();
    expect(screen.getByText('Cohort MDX content')).toBeInTheDocument();
  });

  it('unit_detail_next_step_heading', async () => {
    await renderDetail();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Next step' }),
    ).toBeInTheDocument();
  });

  it('unit_detail_cta_announced', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_ANNOUNCED);
    await renderDetail();
    expect(screen.getByTestId('waitlist-form')).toBeInTheDocument();
  });

  it('integration_detail_page_renders_form_for_announced', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_ANNOUNCED);
    await renderDetail();
    const form = screen.getByTestId('waitlist-form');
    expect(form.getAttribute('data-cohort-slug')).toBe('ai-delivery-2026-q3');
    expect(form.getAttribute('data-source-tag')).toBe('cohort-detail');
  });

  it('unit_detail_cta_open', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_OPEN);
    await renderDetail('workflow-mastery-2026-q4');
    // ce-3.2 replaces the placeholder with an Apply CTA Link.
    const link = screen.getByRole('link', { name: /apply to this cohort/i });
    expect(link).toBeInTheDocument();
    expect(link.getAttribute('href')).toBe(
      '/cohorts/workflow-mastery-2026-q4/apply',
    );
  });

  it('integration_apply_cta_replaces_open_placeholder_on_cohort_detail', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_OPEN);
    await renderDetail('workflow-mastery-2026-q4');
    // The old placeholder copy must NOT appear anywhere on the page.
    expect(
      screen.queryByText(/Application form coming online/i),
    ).not.toBeInTheDocument();
    // The new Apply CTA Link must be present with the correct href.
    const link = screen.getByRole('link', { name: /apply to this cohort/i });
    expect(link.getAttribute('href')).toBe(
      '/cohorts/workflow-mastery-2026-q4/apply',
    );
  });

  it('unit_detail_cta_closed', async () => {
    const closed = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, status: 'closed' as const },
    };
    mockGetCohortBySlug.mockResolvedValue(closed);
    await renderDetail();
    expect(screen.getByText(/Applications are closed/i)).toBeInTheDocument();
  });

  it('unit_detail_cta_enrolled', async () => {
    const enrolled = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, status: 'enrolled' as const },
    };
    mockGetCohortBySlug.mockResolvedValue(enrolled);
    await renderDetail();
    expect(screen.getByText(/This cohort is full/i)).toBeInTheDocument();
  });

  it('unit_detail_cta_shipped', async () => {
    const shipped = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, status: 'shipped' as const },
    };
    mockGetCohortBySlug.mockResolvedValue(shipped);
    await renderDetail();
    expect(screen.getByText(/This cohort has shipped/i)).toBeInTheDocument();
  });

  // --- Integration ---

  it('int_detail_calls_getCohortBySlug', async () => {
    await renderDetail();
    expect(mockGetCohortBySlug).toHaveBeenCalledWith('ai-delivery-2026-q3');
  });

  it('int_detail_uses_container', async () => {
    const { container } = await renderDetail();
    const wrapper = container.querySelector('.mx-auto.max-w-5xl');
    expect(wrapper).toBeInTheDocument();
  });

  // --- Edge ---

  it('edge_detail_unknown_slug', async () => {
    mockGetCohortBySlug.mockResolvedValue(null);
    const jsx = await CohortDetailPage(makeParams('nonexistent'));
    expect(mockNotFound).toHaveBeenCalled();
    expect(jsx).toBeUndefined();
  });

  it('edge_detail_metadata_unknown', async () => {
    mockGetCohortBySlug.mockResolvedValue(null);
    const meta = await generateMetadata(makeParams('nonexistent'));
    expect(meta.title).toBe('Cohort not found');
  });

  // --- Data Integrity ---

  it('data_detail_static_params_count', async () => {
    const params = await generateStaticParams();
    expect(params).toHaveLength(2);
    expect(params).toEqual([
      { slug: 'ai-delivery-2026-q3' },
      { slug: 'workflow-mastery-2026-q4' },
    ]);
  });

  // --- Accessibility ---

  it('a11y_detail_heading_hierarchy', async () => {
    await renderDetail();
    const h2s = screen.getAllByRole('heading', { level: 2 });
    expect(h2s.length).toBeGreaterThanOrEqual(1);
  });

  it('a11y_detail_main_landmark', async () => {
    const { container } = await renderDetail();
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  // --- Infrastructure ---

  it('infra_detail_dynamic_params', () => {
    expect(dynamicParams).toBe(false);
  });

  it('infra_detail_generate_static_params', async () => {
    const params = await generateStaticParams();
    expect(params).toEqual(
      expect.arrayContaining([
        { slug: 'ai-delivery-2026-q3' },
        { slug: 'workflow-mastery-2026-q4' },
      ]),
    );
  });

  it('infra_detail_generate_metadata', async () => {
    const meta = await generateMetadata(makeParams('ai-delivery-2026-q3'));
    expect(meta.title).toBe('AI Delivery Intensive');
    expect(meta.description).toBe('An intensive cohort for solo consultants.');
  });

  it('infra_detail_generate_metadata_og', async () => {
    const meta = await generateMetadata(makeParams('ai-delivery-2026-q3'));
    const og = meta.openGraph as {
      type?: string;
      title?: string;
      description?: string;
    } | undefined;
    expect(og).toBeDefined();
    expect(og?.title).toBe('AI Delivery Intensive');
    expect(og?.description).toBe('An intensive cohort for solo consultants.');
    expect(og?.type).toBe('website');
  });

  // --- cohort-enrollment-4.3: Course + Offer JSON-LD ---

  function findJsonLd(container: HTMLElement): Record<string, unknown> | null {
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    if (!script || !script.textContent) return null;
    return JSON.parse(script.textContent) as Record<string, unknown>;
  }

  it('unit_cohort_detail_jsonld_present', async () => {
    const { container } = await renderDetail();
    const script = container.querySelector(
      'script[type="application/ld+json"]',
    );
    expect(script).toBeInTheDocument();
  });

  it('unit_cohort_detail_jsonld_type_course', async () => {
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('Course');
  });

  it('unit_cohort_detail_jsonld_provider_fabled10x', async () => {
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const provider = ld.provider as Record<string, unknown>;
    expect(provider['@type']).toBe('Organization');
    expect(provider.name).toBe('Fabled10X');
    expect(provider.url).toBe('https://fabled10x.com');
  });

  it('unit_cohort_detail_jsonld_offer_price_currency', async () => {
    // priceCents 249900 → '2499.00'; currency 'usd' → 'USD'
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers['@type']).toBe('Offer');
    expect(offers.price).toBe('2499.00');
    expect(offers.priceCurrency).toBe('USD');
  });

  it('unit_cohort_detail_jsonld_availability_open', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_OPEN);
    const { container } = await renderDetail('workflow-mastery-2026-q4');
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/InStock');
  });

  it('unit_cohort_detail_jsonld_availability_announced', async () => {
    mockGetCohortBySlug.mockResolvedValue(MOCK_COHORT_ANNOUNCED);
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/PreOrder');
  });

  it('unit_cohort_detail_jsonld_availability_soldout', async () => {
    for (const status of ['closed', 'enrolled', 'shipped'] as const) {
      mockGetCohortBySlug.mockResolvedValue({
        ...MOCK_COHORT_ANNOUNCED,
        meta: { ...MOCK_COHORT_ANNOUNCED.meta, status },
      });
      const { container, unmount } = await renderDetail();
      const ld = findJsonLd(container)!;
      const offers = ld.offers as Record<string, unknown>;
      expect(offers.availability).toBe('https://schema.org/SoldOut');
      unmount();
    }
  });

  it('unit_cohort_detail_jsonld_course_instance_workload', async () => {
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const ci = ld.hasCourseInstance as Record<string, unknown>;
    expect(ci['@type']).toBe('CourseInstance');
    expect(ci.courseMode).toBe('Online');
    expect(ci.courseWorkload).toBe('PT10H');
    expect(ci.startDate).toBe('2026-07-06');
    expect(ci.endDate).toBe('2026-08-14');
  });

  it('sec_tampering_jsonld_no_injection', async () => {
    // Cohort with a </script> sequence in title — JSON.stringify must escape
    // the forward slash so the surrounding <script> tag isn't broken out of.
    const malicious = {
      ...MOCK_COHORT_ANNOUNCED,
      meta: {
        ...MOCK_COHORT_ANNOUNCED.meta,
        title: 'Title with </script><script>alert(1)</script>',
        summary: 'Quote " in description',
      },
    };
    mockGetCohortBySlug.mockResolvedValue(malicious);
    const { container } = await renderDetail();
    const script = container.querySelector('script[type="application/ld+json"]')!;
    const ld = JSON.parse(script.textContent ?? '{}');
    // The malicious title round-trips through JSON parse — no injection.
    expect(ld.name).toBe('Title with </script><script>alert(1)</script>');
    expect(ld.description).toBe('Quote " in description');
  });

  it('edge_jsonld_zero_price', async () => {
    mockGetCohortBySlug.mockResolvedValue({
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, priceCents: 0 },
    });
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.price).toBe('0.00');
  });

  it('edge_jsonld_status_unknown', async () => {
    mockGetCohortBySlug.mockResolvedValue({
      ...MOCK_COHORT_ANNOUNCED,
      meta: {
        ...MOCK_COHORT_ANNOUNCED.meta,
        status: 'some-future-status' as unknown as 'announced',
      },
    });
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.availability).toBe('https://schema.org/SoldOut');
  });

  it('data_jsonld_price_precision', async () => {
    mockGetCohortBySlug.mockResolvedValue({
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, priceCents: 12345 },
    });
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.price).toBe('123.45');
    // Exactly 2 decimals
    expect(/^\d+\.\d{2}$/.test(offers.price as string)).toBe(true);
  });

  it('data_jsonld_currency_uppercased', async () => {
    mockGetCohortBySlug.mockResolvedValue({
      ...MOCK_COHORT_ANNOUNCED,
      meta: { ...MOCK_COHORT_ANNOUNCED.meta, currency: 'usd' },
    });
    const { container } = await renderDetail();
    const ld = findJsonLd(container)!;
    const offers = ld.offers as Record<string, unknown>;
    expect(offers.priceCurrency).toBe('USD');
  });

  it('perm_anonymous_cohort_detail_allow', async () => {
    // anonymous access to public cohort detail page renders JSON-LD
    const { container } = await renderDetail();
    expect(
      container.querySelector('script[type="application/ld+json"]'),
    ).toBeInTheDocument();
  });
});
