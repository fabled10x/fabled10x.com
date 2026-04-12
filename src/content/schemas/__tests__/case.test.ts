import { describe, it, expect } from 'vitest';

import {
  CASE_STATUSES as CASE_STATUSES_BARREL,
  CASE_STATUS_LABELS as CASE_STATUS_LABELS_BARREL,
  type Case,
  type CaseStatus,
} from '@/content/schemas';

import {
  CASE_STATUSES,
  CASE_STATUS_LABELS,
} from '@/content/schemas/case';

describe('CASE_STATUSES tuple', () => {
  it('u_case_statuses_exact_order: contains exactly [active, shipped, paused, archived] in declaration order', () => {
    expect(CASE_STATUSES).toEqual(['active', 'shipped', 'paused', 'archived']);
  });

  it('u_case_statuses_length: has length 4', () => {
    expect(CASE_STATUSES).toHaveLength(4);
  });
});

describe('CASE_STATUS_LABELS record', () => {
  it('u_case_status_labels_active: active label is "Active Engagement"', () => {
    const status: CaseStatus = 'active';
    expect(CASE_STATUS_LABELS[status]).toBe('Active Engagement');
  });

  it('u_case_status_labels_shipped: shipped label is "Shipped & In Production"', () => {
    const status: CaseStatus = 'shipped';
    expect(CASE_STATUS_LABELS[status]).toBe('Shipped & In Production');
  });

  it('u_case_status_labels_paused: paused label is "Paused"', () => {
    const status: CaseStatus = 'paused';
    expect(CASE_STATUS_LABELS[status]).toBe('Paused');
  });

  it('u_case_status_labels_archived: archived label is "Archived"', () => {
    const status: CaseStatus = 'archived';
    expect(CASE_STATUS_LABELS[status]).toBe('Archived');
  });
});

describe('Case interface', () => {
  it('u_case_interface_assignable_minimal: a minimal required-fields-only object literal is assignable to Case', () => {
    const minimal: Case = {
      id: 'party-masters',
      slug: 'party-masters',
      title: 'Party Masters',
      client: 'Party Masters LLC',
      status: 'shipped',
      summary: 'AI-built SaaS for party coordination',
      problem: 'Coordinating parties is painful at scale',
      marketResearch: 'Research heading',
      discoveryProcess: 'Discovery heading',
      technicalDecisions: 'Decisions heading',
      deliverables: ['backend', 'frontend', 'docs'],
      outcome: 'Shipped to production',
      relatedEpisodeIds: [],
      lllEntryUrls: [],
    };

    expect(minimal.id).toBe('party-masters');
    expect(minimal.slug).toBe('party-masters');
    expect(minimal.status).toBe('shipped');
    expect(minimal.deliverables).toHaveLength(3);
    expect(minimal.contractValue).toBeUndefined();
    expect(minimal.heroImageUrl).toBeUndefined();
  });
});

describe('@/content/schemas barrel integration', () => {
  it('i_case_barrel_reexport: CASE_STATUSES, CASE_STATUS_LABELS, Case, CaseStatus all importable via @/content/schemas', () => {
    expect(CASE_STATUSES_BARREL).toBeDefined();
    expect(CASE_STATUS_LABELS_BARREL).toBeDefined();
    expect(Array.isArray(CASE_STATUSES_BARREL)).toBe(true);
    expect(typeof CASE_STATUS_LABELS_BARREL).toBe('object');
  });

  it('i_case_direct_import: direct and barrel imports share object identity (no double instantiation)', () => {
    expect(CASE_STATUSES_BARREL).toBe(CASE_STATUSES);
    expect(CASE_STATUS_LABELS_BARREL).toBe(CASE_STATUS_LABELS);
  });
});

describe('CASE_STATUSES edge cases', () => {
  it('edge_case_statuses_no_duplicates: every value in CASE_STATUSES is unique', () => {
    expect(new Set(CASE_STATUSES).size).toBe(CASE_STATUSES.length);
  });

  it('edge_case_labels_no_extras: CASE_STATUS_LABELS has no keys outside CASE_STATUSES', () => {
    const labelKeys = Object.keys(CASE_STATUS_LABELS);
    const statusSet = new Set<string>(CASE_STATUSES);
    for (const key of labelKeys) {
      expect(statusSet.has(key)).toBe(true);
    }
  });
});

describe('CASE_STATUSES ↔ CASE_STATUS_LABELS data integrity', () => {
  it('data_labels_cover_all_statuses: every CASE_STATUSES entry has a non-empty label', () => {
    for (const status of CASE_STATUSES) {
      const label = CASE_STATUS_LABELS[status];
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it('data_labels_bidirectional_match: label keys equal CASE_STATUSES values as a set', () => {
    const statusSet = new Set<string>(CASE_STATUSES);
    const labelKeySet = new Set(Object.keys(CASE_STATUS_LABELS));
    expect(labelKeySet.size).toBe(statusSet.size);
    for (const s of statusSet) {
      expect(labelKeySet.has(s)).toBe(true);
    }
  });
});

describe('@/content/schemas/case module resolution', () => {
  it('infra_path_alias_resolves: @/content/schemas/case import resolves under vitest (guards against tsconfig/vitest.config.ts drift)', () => {
    expect(CASE_STATUSES).toBeDefined();
    expect(CASE_STATUS_LABELS).toBeDefined();
  });
});
