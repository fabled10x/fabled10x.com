import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'node:path';
import type { ComponentType } from 'react';
import type { LoadedEntry } from '../loader';
import type { Cohort } from '@/content/schemas';

// --- Mock loader (unit-test default; integration tests use vi.importActual) ---

vi.mock('../loader', async () => {
  const actual = await vi.importActual<typeof import('../loader')>('../loader');
  return {
    ...actual,
    loadContent: vi.fn(),
  };
});

import { loadContent } from '../loader';
const mockLoadContent = vi.mocked(loadContent);

// --- Fixtures ---

const mockComponent: ComponentType = () => null;

const cohortAnnouncedEarly: LoadedEntry<Cohort> = {
  meta: {
    id: 'cohort-ai-delivery-2026-q3',
    slug: 'ai-delivery-2026-q3',
    title: 'AI Delivery Cohort — Fall 2026',
    series: 'AI Delivery Cohort',
    tagline: 'Ship a real client project with an agent team in six weeks.',
    summary: 'Six-week intensive for solo consultants and small agencies.',
    status: 'announced',
    pillar: 'delivery',
    startDate: '2026-09-14',
    endDate: '2026-10-26',
    durationWeeks: 6,
    capacity: 20,
    priceCents: 299900,
    currency: 'usd',
    stripePriceId: 'price_REPLACE_ME_ai_delivery_2026_q3',
    commitmentHoursPerWeek: 10,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: ['party-masters'],
    publishedAt: '2026-04-15T00:00:00Z',
  },
  slug: 'ai-delivery-2026-q3',
  Component: mockComponent,
};

const cohortOpenLater: LoadedEntry<Cohort> = {
  meta: {
    id: 'cohort-workflow-mastery-2026-q4',
    slug: 'workflow-mastery-2026-q4',
    title: 'Workflow Mastery Cohort — Winter 2026',
    series: 'Workflow Mastery Cohort',
    tagline: 'Rebuild your development workflow around an agent team.',
    summary: 'Four-week program focused on the meta-workflow of AI-driven engineering.',
    status: 'open',
    pillar: 'workflow',
    startDate: '2026-11-02',
    endDate: '2026-11-30',
    durationWeeks: 4,
    capacity: 15,
    priceCents: 249900,
    currency: 'usd',
    stripePriceId: 'price_REPLACE_ME_workflow_mastery_2026_q4',
    commitmentHoursPerWeek: 8,
    lllEntryUrls: [],
    relatedEpisodeIds: [],
    relatedCaseIds: [],
    publishedAt: '2026-04-15T00:00:00Z',
  },
  slug: 'workflow-mastery-2026-q4',
  Component: mockComponent,
};

const cohortClosed: LoadedEntry<Cohort> = {
  meta: {
    ...cohortOpenLater.meta,
    id: 'cohort-closed',
    slug: 'closed-cohort',
    title: 'Closed Cohort',
    status: 'closed',
    startDate: '2027-01-01',
    endDate: '2027-02-01',
  },
  slug: 'closed-cohort',
  Component: mockComponent,
};

const cohortEnrolled: LoadedEntry<Cohort> = {
  meta: {
    ...cohortOpenLater.meta,
    id: 'cohort-enrolled',
    slug: 'enrolled-cohort',
    title: 'Enrolled Cohort',
    status: 'enrolled',
    startDate: '2026-06-01',
    endDate: '2026-07-01',
  },
  slug: 'enrolled-cohort',
  Component: mockComponent,
};

const cohortShipped: LoadedEntry<Cohort> = {
  meta: {
    ...cohortOpenLater.meta,
    id: 'cohort-shipped',
    slug: 'shipped-cohort',
    title: 'Shipped Cohort',
    status: 'shipped',
    startDate: '2025-09-01',
    endDate: '2025-10-01',
  },
  slug: 'shipped-cohort',
  Component: mockComponent,
};

beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('cohorts loader (unit, mocked loadContent)', () => {
  async function importCohorts() {
    return import('../cohorts');
  }

  it('unit_cohorts_get_all_sorted_startdate_asc: returns LoadedEntry<Cohort>[] sorted by startDate ASCENDING', async () => {
    // Provide later-first to ensure the loader sorts (not just passthrough).
    mockLoadContent.mockResolvedValue([cohortOpenLater, cohortAnnouncedEarly]);
    const { getAllCohorts } = await importCohorts();

    const result = await getAllCohorts();

    expect(result).toHaveLength(2);
    // 2026-09-14 (announced) comes before 2026-11-02 (open) — ascending
    expect(result[0].slug).toBe('ai-delivery-2026-q3');
    expect(result[1].slug).toBe('workflow-mastery-2026-q4');
  });

  it('unit_cohorts_by_slug_found: getCohortBySlug returns matching LoadedEntry with meta + Component', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly, cohortOpenLater]);
    const { getCohortBySlug } = await importCohorts();

    const result = await getCohortBySlug('workflow-mastery-2026-q4');

    expect(result).not.toBeNull();
    expect(result!.meta.id).toBe('cohort-workflow-mastery-2026-q4');
    expect(result!.slug).toBe('workflow-mastery-2026-q4');
    expect(result!.Component).toBe(mockComponent);
  });

  it('unit_cohorts_by_slug_not_found: returns null for unknown slug', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly]);
    const { getCohortBySlug } = await importCohorts();

    const result = await getCohortBySlug('nonexistent-slug');

    expect(result).toBeNull();
  });

  it('unit_cohorts_get_all_empty: returns [] when manifest is empty', async () => {
    mockLoadContent.mockResolvedValue([]);
    const { getAllCohorts } = await importCohorts();

    const result = await getAllCohorts();

    expect(result).toEqual([]);
    expect(Array.isArray(result)).toBe(true);
  });

  it('unit_cohort_buckets_partitions_announced_open_closed_vs_enrolled_shipped: splits status groups into upcoming/archived', async () => {
    mockLoadContent.mockResolvedValue([
      cohortAnnouncedEarly, // announced
      cohortOpenLater,      // open
      cohortClosed,         // closed
      cohortEnrolled,       // enrolled
      cohortShipped,        // shipped
    ]);
    const { getCohortBuckets } = await importCohorts();

    const result = await getCohortBuckets();

    expect(result.upcoming).toHaveLength(3);
    expect(result.archived).toHaveLength(2);
    expect(result.upcoming.map((c) => c.meta.status).sort()).toEqual(
      ['announced', 'closed', 'open'],
    );
    expect(result.archived.map((c) => c.meta.status).sort()).toEqual(
      ['enrolled', 'shipped'],
    );
  });

  it('unit_cohort_buckets_all_upcoming: returns upcoming of length N and archived of length 0 when all seeds are announced/open/closed', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly, cohortOpenLater]);
    const { getCohortBuckets } = await importCohorts();

    const result = await getCohortBuckets();

    expect(result.upcoming).toHaveLength(2);
    expect(result.archived).toHaveLength(0);
  });

  it('unit_cohort_buckets_boundary_closed_upcoming: classifies status="closed" as UPCOMING (not archived)', async () => {
    mockLoadContent.mockResolvedValue([cohortClosed]);
    const { getCohortBuckets } = await importCohorts();

    const result = await getCohortBuckets();

    expect(result.upcoming).toHaveLength(1);
    expect(result.upcoming[0].meta.status).toBe('closed');
    expect(result.archived).toHaveLength(0);
  });
});

describe('cohorts loader (infrastructure)', () => {
  async function importCohorts() {
    return import('../cohorts');
  }

  it('infra_cohort_loader_caches: second call uses cached result (loadContent invoked once)', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly]);
    const { getAllCohorts } = await importCohorts();

    await getAllCohorts();
    await getAllCohorts();
    await getAllCohorts();

    expect(mockLoadContent).toHaveBeenCalledTimes(1);
  });

  it('infra_cohort_cache_frozen: returned array is Object.frozen (paid-forward pattern from bpd-1.2 / sa-1.1)', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly, cohortOpenLater]);
    const { getAllCohorts } = await importCohorts();

    const result = await getAllCohorts();

    expect(Object.isFrozen(result)).toBe(true);
  });

  it('infra_cohort_buckets_do_not_mutate_source: repeated bucket calls return stable results; underlying cache stays frozen', async () => {
    mockLoadContent.mockResolvedValue([
      cohortAnnouncedEarly,
      cohortOpenLater,
      cohortShipped,
    ]);
    const { getAllCohorts, getCohortBuckets } = await importCohorts();

    const first = await getCohortBuckets();
    const second = await getCohortBuckets();
    const all = await getAllCohorts();

    expect(first.upcoming).toHaveLength(2);
    expect(first.archived).toHaveLength(1);
    expect(second.upcoming).toHaveLength(2);
    expect(second.archived).toHaveLength(1);
    expect(Object.isFrozen(all)).toBe(true);
    expect(all).toHaveLength(3);
  });
});

describe('cohorts loader (contract)', () => {
  async function importCohorts() {
    return import('../cohorts');
  }

  it('contract_loader_loaded_entry_shape: each entry has shape { meta, slug, Component }', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly]);
    const { getAllCohorts } = await importCohorts();

    const result = await getAllCohorts();

    expect(result[0]).toHaveProperty('meta');
    expect(result[0]).toHaveProperty('slug');
    expect(result[0]).toHaveProperty('Component');
    expect(typeof result[0].slug).toBe('string');
    expect(typeof result[0].Component).toBe('function');
    // meta carries the full Cohort shape
    expect(result[0].meta).toHaveProperty('id');
    expect(result[0].meta).toHaveProperty('startDate');
    expect(result[0].meta).toHaveProperty('status');
    expect(result[0].meta).toHaveProperty('stripePriceId');
  });

  it('contract_get_by_slug_nullable_shape: getCohortBySlug return type is LoadedEntry<Cohort> | null (never undefined, never throws on missing)', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly]);
    const { getCohortBySlug } = await importCohorts();

    const found = await getCohortBySlug('ai-delivery-2026-q3');
    expect(found).not.toBeNull();
    expect(found).not.toBeUndefined();

    const missing = await getCohortBySlug('nonexistent');
    expect(missing).toBeNull();
    expect(missing).not.toBeUndefined();
  });

  it('contract_buckets_return_shape: getCohortBuckets returns { upcoming, archived } — both keys always present even when empty', async () => {
    mockLoadContent.mockResolvedValue([]);
    const { getCohortBuckets } = await importCohorts();

    const result = await getCohortBuckets();

    expect(result).toHaveProperty('upcoming');
    expect(result).toHaveProperty('archived');
    expect(Array.isArray(result.upcoming)).toBe(true);
    expect(Array.isArray(result.archived)).toBe(true);
    expect(result.upcoming).toHaveLength(0);
    expect(result.archived).toHaveLength(0);
  });
});

describe('cohorts loader (edge cases)', () => {
  async function importCohorts() {
    return import('../cohorts');
  }

  it('edge_state_loader_empty_manifest: getAllCohorts returns [] when loadContent resolves with empty array', async () => {
    mockLoadContent.mockResolvedValue([]);
    const { getAllCohorts } = await importCohorts();

    const result = await getAllCohorts();

    expect(result).toEqual([]);
    expect(result).not.toBeNull();
    expect(result).not.toBeUndefined();
  });

  it('edge_state_buckets_empty_manifest: getCohortBuckets returns { upcoming: [], archived: [] } when manifest is empty', async () => {
    mockLoadContent.mockResolvedValue([]);
    const { getCohortBuckets } = await importCohorts();

    const result = await getCohortBuckets();

    expect(result.upcoming).toEqual([]);
    expect(result.archived).toEqual([]);
  });

  it('edge_state_single_entry_all_in_one_bucket: single shipped cohort goes entirely to archived; upcoming is empty', async () => {
    mockLoadContent.mockResolvedValue([cohortShipped]);
    const { getCohortBuckets } = await importCohorts();

    const result = await getCohortBuckets();

    expect(result.upcoming).toEqual([]);
    expect(result.archived).toHaveLength(1);
    expect(result.archived[0].meta.status).toBe('shipped');
  });

  it('edge_input_unknown_slug_returns_null: getCohortBySlug returns explicit null (not undefined, not throw)', async () => {
    mockLoadContent.mockResolvedValue([cohortAnnouncedEarly, cohortOpenLater]);
    const { getCohortBySlug } = await importCohorts();

    const result = await getCohortBySlug('completely-nonexistent-slug');

    expect(result).toBeNull();
    expect(result).not.toBeUndefined();
  });
});

describe('cohorts loader (error recovery)', () => {
  async function importCohorts() {
    return import('../cohorts');
  }

  it('err_loader_malformed_meta: throws contextful Error if loadContent rejects on Zod failure', async () => {
    const malformedError = new Error(
      'Invalid metadata in ai-delivery-2026-q3.mdx: priceCents must be positive',
    );
    mockLoadContent.mockRejectedValue(malformedError);
    const { getAllCohorts } = await importCohorts();

    await expect(getAllCohorts()).rejects.toThrow(/Invalid metadata/);
  });

  it('err_loader_missing_default_export: throws Error referencing missing default export when loadContent surfaces it', async () => {
    const missingDefault = new Error(
      'Missing default export in ai-delivery-2026-q3.mdx: MDX files must export a default component',
    );
    mockLoadContent.mockRejectedValue(missingDefault);
    const { getAllCohorts } = await importCohorts();

    await expect(getAllCohorts()).rejects.toThrow(/Missing default export/);
  });

  it('err_loader_missing_meta_export: throws Error referencing missing meta export when loadContent surfaces it', async () => {
    const missingMeta = new Error(
      'Missing meta export in ai-delivery-2026-q3.mdx: MDX files must export a meta object',
    );
    mockLoadContent.mockRejectedValue(missingMeta);
    const { getAllCohorts } = await importCohorts();

    await expect(getAllCohorts()).rejects.toThrow(/Missing meta export/);
  });

  it('err_loader_unknown_manifest_file: loader importFn throws "Unknown cohort file" when filename is not in manifest', async () => {
    // Simulate the defensive branch inside the importFn by having loadContent
    // reject with the specific error shape cohorts.ts will throw.
    const unknownFileError = new Error(
      'Unknown cohort file: rogue-entry.mdx',
    );
    mockLoadContent.mockRejectedValue(unknownFileError);
    const { getAllCohorts } = await importCohorts();

    await expect(getAllCohorts()).rejects.toThrow(/Unknown cohort file/);
  });
});

describe('cohorts loader (data integrity)', () => {
  async function importCohorts() {
    return import('../cohorts');
  }

  it('data_consistency_loader_sort_order_ascending: result[i].meta.startDate <= result[i+1].meta.startDate (ASC invariant)', async () => {
    mockLoadContent.mockResolvedValue([
      cohortOpenLater,       // 2026-11-02
      cohortEnrolled,        // 2026-06-01
      cohortAnnouncedEarly,  // 2026-09-14
      cohortShipped,         // 2025-09-01
    ]);
    const { getAllCohorts } = await importCohorts();

    const result = await getAllCohorts();

    for (let i = 0; i < result.length - 1; i++) {
      expect(
        result[i].meta.startDate.localeCompare(result[i + 1].meta.startDate),
      ).toBeLessThanOrEqual(0);
    }
  });
});

// ── Integration: real seed MDX + real schema (loader still mocked for these) ─

describe('cohorts integration (real seeds + real CohortSchema)', () => {
  it('integration_cohort_manifest_contains_seeds: cohortManifest exports both seeds with default + meta', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/cohorts/manifest')>(
      '@/content/cohorts/manifest',
    );
    const { cohortManifest } = manifestModule;

    expect(Object.keys(cohortManifest)).toContain('ai-delivery-2026-q3.mdx');
    expect(Object.keys(cohortManifest)).toContain('workflow-mastery-2026-q4.mdx');
    expect(Object.keys(cohortManifest).length).toBeGreaterThanOrEqual(2);

    for (const filename of Object.keys(cohortManifest)) {
      const mod = cohortManifest[filename];
      expect(mod).toHaveProperty('default');
      expect(mod).toHaveProperty('meta');
    }
  });

  it('integration_cohort_seeds_pass_validator: every seed meta passes CohortSchema.safeParse', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/cohorts/manifest')>(
      '@/content/cohorts/manifest',
    );
    const schemaModule = await vi.importActual<typeof import('@/content/schemas')>(
      '@/content/schemas',
    );
    const { cohortManifest } = manifestModule;
    const { CohortSchema } = schemaModule;

    for (const [filename, mod] of Object.entries(cohortManifest)) {
      const result = CohortSchema.safeParse(mod.meta);
      if (!result.success) {
        throw new Error(
          `Seed ${filename} failed CohortSchema: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
      expect(result.success).toBe(true);
    }
  });

  it('data_consistency_seed_slug_matches_filename: each seed meta.slug === filename without .mdx extension', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/cohorts/manifest')>(
      '@/content/cohorts/manifest',
    );
    const { cohortManifest } = manifestModule;

    for (const [filename, mod] of Object.entries(cohortManifest)) {
      const expectedSlug = filename.replace(/\.mdx$/, '');
      const meta = mod.meta as { slug?: string };
      expect(meta.slug).toBe(expectedSlug);
    }
  });

  it('data_consistency_stripe_price_placeholder_accepted: both seed stripePriceId values match "price_REPLACE_ME_*" placeholder pattern and pass CohortSchema', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/cohorts/manifest')>(
      '@/content/cohorts/manifest',
    );
    const schemaModule = await vi.importActual<typeof import('@/content/schemas')>(
      '@/content/schemas',
    );
    const { cohortManifest } = manifestModule;
    const { CohortSchema } = schemaModule;

    for (const [filename, mod] of Object.entries(cohortManifest)) {
      const meta = mod.meta as { stripePriceId?: string };
      expect(meta.stripePriceId).toMatch(/^price_REPLACE_ME_/);
      const result = CohortSchema.safeParse(mod.meta);
      if (!result.success) {
        throw new Error(
          `Seed ${filename} with placeholder stripePriceId failed CohortSchema: ${JSON.stringify(result.error.issues, null, 2)}`,
        );
      }
    }
  });

  it('integration_cohort_loader_returns_two_seeds: real loadContent + real manifest returns 2 entries with expected slugs', async () => {
    const loaderModule = await vi.importActual<typeof import('../loader')>('../loader');
    const manifestModule = await vi.importActual<typeof import('@/content/cohorts/manifest')>(
      '@/content/cohorts/manifest',
    );
    const schemaModule = await vi.importActual<typeof import('@/content/schemas')>(
      '@/content/schemas',
    );
    const { loadContent: realLoadContent } = loaderModule;
    const { cohortManifest } = manifestModule;
    const { CohortSchema } = schemaModule;

    const entries = await realLoadContent<Cohort>({
      directory: 'src/content/cohorts',
      schema: CohortSchema,
      readdirFn: async () => Object.keys(cohortManifest),
      importFn: async (filePath: string) => {
        const filename = path.basename(filePath);
        const mod = cohortManifest[filename];
        if (!mod) throw new Error(`Unknown cohort file: ${filename}`);
        return mod;
      },
    });

    expect(entries).toHaveLength(2);
    const slugs = entries.map((e) => e.slug).sort();
    expect(slugs).toEqual(['ai-delivery-2026-q3', 'workflow-mastery-2026-q4']);
  });

  it('integration_cohort_seeds_represent_announced_and_open: seed manifest includes exactly one announced cohort and one open cohort', async () => {
    const manifestModule = await vi.importActual<typeof import('@/content/cohorts/manifest')>(
      '@/content/cohorts/manifest',
    );
    const { cohortManifest } = manifestModule;

    const statuses = Object.values(cohortManifest).map((mod) => {
      const meta = mod.meta as { status?: string };
      return meta.status;
    });

    expect(statuses.filter((s) => s === 'announced')).toHaveLength(1);
    expect(statuses.filter((s) => s === 'open')).toHaveLength(1);
  });
});
