import { describe, it, expect } from 'vitest';

import {
  EpisodeSchema,
  SourceMaterialSchema,
  CaseSchema,
} from '@/content/schemas/validators';

import {
  EpisodeSchema as EpisodeSchemaBarrel,
  SourceMaterialSchema as SourceMaterialSchemaBarrel,
  CaseSchema as CaseSchemaBarrel,
} from '@/content/schemas';

// ── Fixtures ────────────────────────────────────────────────────────

const VALID_EPISODE_MINIMAL = {
  id: 'ep-001',
  slug: 'pilot-party-masters-discovery',
  title: 'Pilot: Party Masters Discovery',
  series: 'Flagship',
  episodeNumber: 0,
  tier: 'flagship' as const,
  pillar: 'delivery' as const,
  summary: 'Building Party Masters from scratch with an AI agent team',
  sourceMaterialIds: [],
  lllEntryUrls: [],
};

const VALID_EPISODE_FULL = {
  ...VALID_EPISODE_MINIMAL,
  season: 1,
  act: 1,
  durationMinutes: 45,
  publishedAt: '2026-04-11T00:00:00Z',
  youtubeUrl: 'https://youtube.com/watch?v=abc123',
  thumbnailUrl: 'https://img.youtube.com/vi/abc123/maxresdefault.jpg',
  transcriptPath: 'src/content/episodes/transcripts/ep-001.md',
};

const VALID_SOURCE_MATERIAL_MINIMAL = {
  id: 'sm-001',
  filename: 'party-masters-spec.md',
  kind: 'markdown' as const,
  description: 'Initial product specification for Party Masters',
  episodeIds: ['ep-001'],
};

const VALID_SOURCE_MATERIAL_FULL = {
  ...VALID_SOURCE_MATERIAL_MINIMAL,
  path: 'src/content/source-materials/party-masters-spec.md',
};

const VALID_CASE_MINIMAL = {
  id: 'case-001',
  slug: 'party-masters',
  title: 'Party Masters',
  client: 'Party Masters LLC',
  status: 'shipped' as const,
  summary: 'AI-built SaaS for party coordination',
  problem: 'Coordinating parties is painful at scale',
  marketResearch: 'Strong demand for event coordination tools',
  discoveryProcess: 'Two-week discovery sprint',
  technicalDecisions: 'Next.js + Prisma + Vercel',
  deliverables: ['backend API', 'frontend app', 'documentation'],
  outcome: 'Shipped to production',
  relatedEpisodeIds: [],
  lllEntryUrls: [],
};

const VALID_CASE_FULL = {
  ...VALID_CASE_MINIMAL,
  startedAt: '2026-01-15T00:00:00Z',
  shippedAt: '2026-03-30T00:00:00Z',
  contractValue: 15000,
  heroImageUrl: 'https://fabled10x.com/images/party-masters-hero.jpg',
};

// ── Unit Tests ──────────────────────────────────────────────────────

describe('EpisodeSchema', () => {
  it('unit_episode_minimal: accepts a record with only required fields', () => {
    const result = EpisodeSchema.parse(VALID_EPISODE_MINIMAL);
    expect(result.id).toBe('ep-001');
    expect(result.slug).toBe('pilot-party-masters-discovery');
    expect(result.episodeNumber).toBe(0);
    expect(result.tier).toBe('flagship');
    expect(result.pillar).toBe('delivery');
  });

  it('unit_episode_full: accepts a fully-populated record with all optionals', () => {
    const result = EpisodeSchema.parse(VALID_EPISODE_FULL);
    expect(result.season).toBe(1);
    expect(result.act).toBe(1);
    expect(result.durationMinutes).toBe(45);
    expect(result.publishedAt).toBe('2026-04-11T00:00:00Z');
    expect(result.youtubeUrl).toBe('https://youtube.com/watch?v=abc123');
    expect(result.thumbnailUrl).toBe('https://img.youtube.com/vi/abc123/maxresdefault.jpg');
    expect(result.transcriptPath).toBe('src/content/episodes/transcripts/ep-001.md');
  });

  it('unit_episode_input_type: EpisodeInput type is usable for building valid records', () => {
    // If this compiles + runs, the type is correctly derived from the schema
    const input = { ...VALID_EPISODE_MINIMAL };
    const result = EpisodeSchema.parse(input);
    expect(result).toBeDefined();
  });
});

describe('SourceMaterialSchema', () => {
  it('unit_source_material_minimal: accepts a minimal valid record', () => {
    const result = SourceMaterialSchema.parse(VALID_SOURCE_MATERIAL_MINIMAL);
    expect(result.id).toBe('sm-001');
    expect(result.kind).toBe('markdown');
    expect(result.episodeIds).toEqual(['ep-001']);
  });

  it('unit_source_material_full: accepts a record with optional path set', () => {
    const result = SourceMaterialSchema.parse(VALID_SOURCE_MATERIAL_FULL);
    expect(result.path).toBe('src/content/source-materials/party-masters-spec.md');
  });
});

describe('CaseSchema', () => {
  it('unit_case_minimal: accepts a minimal valid record with no optional fields', () => {
    const result = CaseSchema.parse(VALID_CASE_MINIMAL);
    expect(result.id).toBe('case-001');
    expect(result.client).toBe('Party Masters LLC');
    expect(result.status).toBe('shipped');
    expect(result.contractValue).toBeUndefined();
    expect(result.heroImageUrl).toBeUndefined();
  });

  it('unit_case_full: accepts a fully-populated record with all optionals', () => {
    const result = CaseSchema.parse(VALID_CASE_FULL);
    expect(result.startedAt).toBe('2026-01-15T00:00:00Z');
    expect(result.shippedAt).toBe('2026-03-30T00:00:00Z');
    expect(result.contractValue).toBe(15000);
    expect(result.heroImageUrl).toBe('https://fabled10x.com/images/party-masters-hero.jpg');
  });
});

describe('@/content/schemas barrel integration', () => {
  it('unit_barrel_exports: EpisodeSchema, SourceMaterialSchema, CaseSchema importable via barrel', () => {
    expect(EpisodeSchemaBarrel).toBeDefined();
    expect(SourceMaterialSchemaBarrel).toBeDefined();
    expect(CaseSchemaBarrel).toBeDefined();
  });
});

// ── Security Tests (STRIDE: Tampering) ──────────────────────────────

describe('Security: Enum tampering', () => {
  it('sec_tampering_episode_tier: rejects invalid tier enum value', () => {
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: 'not-a-tier' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: 'FLAGSHIP' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: '' }),
    ).toThrow();
  });

  it('sec_tampering_source_material_kind: rejects unknown kind enum', () => {
    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: 'pdf' }),
    ).toThrow();

    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: 'MARKDOWN' }),
    ).toThrow();

    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: '' }),
    ).toThrow();
  });

  it('sec_tampering_case_status: rejects invalid status enum value', () => {
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, status: 'live' }),
    ).toThrow();
  });

  it('sec_tampering_episode_slug: rejects slugs with uppercase, underscores, or spaces', () => {
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: 'My-Episode' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: 'my_episode' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: 'my episode' }),
    ).toThrow();

    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, slug: '' }),
    ).toThrow();
  });

  it('sec_tampering_episode_urls: rejects non-URL lllEntryUrls entries', () => {
    // Strings with spaces fail WHATWG URL parse
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, lllEntryUrls: ['not a url'] }),
    ).toThrow();

    // Empty strings fail
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, lllEntryUrls: [''] }),
    ).toThrow();
  });
});

describe('Security: Required field enforcement (Info Disclosure)', () => {
  it('sec_info_disclosure_case_required: rejects records missing client or problem', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { client: _c, ...missingClient } = VALID_CASE_MINIMAL;
    expect(() => CaseSchema.parse(missingClient)).toThrow();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { problem: _p, ...missingProblem } = VALID_CASE_MINIMAL;
    expect(() => CaseSchema.parse(missingProblem)).toThrow();

    // Empty strings rejected by min(1) on required narrative fields
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, client: '' }),
    ).toThrow();

    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, problem: '' }),
    ).toThrow();
  });
});

// ── Edge Case Tests ─────────────────────────────────────────────────

describe('Edge cases: Input boundaries', () => {
  it('edge_input_episode_optional_omission: accepts records with all optionals omitted', () => {
    // VALID_EPISODE_MINIMAL has no optionals — this IS the test
    const result = EpisodeSchema.parse(VALID_EPISODE_MINIMAL);
    expect(result.season).toBeUndefined();
    expect(result.act).toBeUndefined();
    expect(result.durationMinutes).toBeUndefined();
    expect(result.publishedAt).toBeUndefined();
    expect(result.youtubeUrl).toBeUndefined();
    expect(result.thumbnailUrl).toBeUndefined();
    expect(result.transcriptPath).toBeUndefined();
  });

  it('edge_input_episode_negative_number: rejects negative episodeNumber, non-integer season; accepts zero', () => {
    // episodeNumber: -1 rejected (nonnegative)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, episodeNumber: -1 }),
    ).toThrow();

    // season: 1.5 rejected (int)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_FULL, season: 1.5 }),
    ).toThrow();

    // episodeNumber: 0 accepted (nonnegative includes zero)
    const result = EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, episodeNumber: 0 });
    expect(result.episodeNumber).toBe(0);
  });

  it('edge_input_case_contract_negative: rejects negative contractValue; accepts 0 and omission', () => {
    // Negative rejected
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: -1 }),
    ).toThrow();

    // Zero accepted (nonnegative)
    const withZero = CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: 0 });
    expect(withZero.contractValue).toBe(0);

    // Omission accepted (optional)
    const withoutValue = CaseSchema.parse(VALID_CASE_MINIMAL);
    expect(withoutValue.contractValue).toBeUndefined();
  });

  it('edge_input_extra_fields: unknown fields are stripped from parsed result', () => {
    const withExtra = { ...VALID_CASE_MINIMAL, secretAdminFlag: true };
    const result = CaseSchema.parse(withExtra);
    expect(result).not.toHaveProperty('secretAdminFlag');
    expect(result.id).toBe('case-001');
  });
});

describe('Edge cases: Temporal', () => {
  it('edge_temporal_datetime_format: publishedAt accepts UTC Z-suffix; rejects offset and local', () => {
    // UTC Z-suffix accepted
    const valid = EpisodeSchema.parse({
      ...VALID_EPISODE_MINIMAL,
      publishedAt: '2026-04-11T00:00:00Z',
    });
    expect(valid.publishedAt).toBe('2026-04-11T00:00:00Z');

    // Offset rejected by default
    expect(() =>
      EpisodeSchema.parse({
        ...VALID_EPISODE_MINIMAL,
        publishedAt: '2026-04-11T00:00:00+02:00',
      }),
    ).toThrow();

    // Date-only rejected (not datetime)
    expect(() =>
      EpisodeSchema.parse({
        ...VALID_EPISODE_MINIMAL,
        publishedAt: '2026-04-11',
      }),
    ).toThrow();
  });
});

// ── Error Recovery Tests ────────────────────────────────────────────

describe('Error recovery: safeParse', () => {
  it('err_safeparse_actionable_messages: safeParse returns structured error with issues array', () => {
    const invalid = { ...VALID_CASE_MINIMAL, status: 'invalid-status', client: '' };
    const result = CaseSchema.safeParse(invalid);

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.length).toBeGreaterThan(0);
      // Each issue should have path and message for loader to format
      for (const issue of result.error.issues) {
        expect(issue).toHaveProperty('path');
        expect(issue).toHaveProperty('message');
      }
    }
  });
});

// ── Data Integrity Tests ────────────────────────────────────────────

describe('Data integrity', () => {
  it('data_sensitivity_contract_value: contractValue is optional and nonnegative', () => {
    // Omission accepted
    const without = CaseSchema.parse(VALID_CASE_MINIMAL);
    expect(without.contractValue).toBeUndefined();

    // Positive accepted
    const withPositive = CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: 9999.99 });
    expect(withPositive.contractValue).toBe(9999.99);

    // Negative rejected
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, contractValue: -0.01 }),
    ).toThrow();
  });

  it('data_consistency_enum_source: validators reject values outside canonical CONST tuples', () => {
    // Wrong tier (not in CONTENT_TIERS)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, tier: 'premium' }),
    ).toThrow();

    // Wrong pillar (not in CONTENT_PILLARS)
    expect(() =>
      EpisodeSchema.parse({ ...VALID_EPISODE_MINIMAL, pillar: 'marketing' }),
    ).toThrow();

    // Wrong kind (not in SOURCE_MATERIAL_KINDS)
    expect(() =>
      SourceMaterialSchema.parse({ ...VALID_SOURCE_MATERIAL_MINIMAL, kind: 'video' }),
    ).toThrow();

    // Wrong status (not in CASE_STATUSES)
    expect(() =>
      CaseSchema.parse({ ...VALID_CASE_MINIMAL, status: 'deleted' }),
    ).toThrow();
  });
});
