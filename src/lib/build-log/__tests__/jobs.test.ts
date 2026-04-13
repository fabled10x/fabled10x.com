import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const CURRENTWORK_DIR = path.join(process.cwd(), 'currentwork');

// ── Virtual-filesystem helpers for mocked tests ─────────────────────

interface VirtualFs {
  /** Map of absolute path → file content string */
  files: Record<string, string>;
  /** Map of absolute path → array of entries (directory listing) */
  dirs: Record<string, string[]>;
}

function mountVfs(vfs: VirtualFs) {
  vi.spyOn(fs, 'readdir').mockImplementation(async (p) => {
    const key = String(p);
    if (key in vfs.dirs) return vfs.dirs[key] as never;
    const err = Object.assign(new Error(`ENOENT readdir ${key}`), {
      code: 'ENOENT',
    });
    throw err;
  });

  vi.spyOn(fs, 'stat').mockImplementation(async (p) => {
    const key = String(p);
    const isDir = key in vfs.dirs;
    const isFile = key in vfs.files;
    if (!isDir && !isFile) {
      const err = Object.assign(new Error(`ENOENT stat ${key}`), {
        code: 'ENOENT',
      });
      throw err;
    }
    return { isDirectory: () => isDir, isFile: () => isFile } as never;
  });

  vi.spyOn(fs, 'readFile').mockImplementation(async (p) => {
    const key = String(p);
    if (key in vfs.files) return vfs.files[key] as never;
    const err = Object.assign(new Error(`ENOENT readFile ${key}`), {
      code: 'ENOENT',
    });
    throw err;
  });
}

const README_BASIC = (slug: string) => `# ${slug} — Implementation Plan

**Alias:** \`${slug.slice(0, 2)}\` — invoke as \`/pipeline ${slug.slice(0, 2)} <section>\`.

## Context

Test job ${slug}.

## Feature Overview

| #   | Feature | Phase           | Size | Status  |
|-----|---------|-----------------|------|---------|
| 1.1 | First   | 1 - Foundation  | M    | Planned |
`;

const PHASE_BASIC = (n: number, slug: string) =>
  `# Phase ${n}: ${slug}\n\nbody for phase ${n}\n`;

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

// ── Unit Tests (mocked filesystem) ──────────────────────────────────

describe('jobs.ts: mocked filesystem', () => {
  it('unit_jobs_get_all_via_mock: returns frozen array of mocked jobs', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['alpha', 'zeta'],
        [path.join(CURRENTWORK_DIR, 'alpha')]: ['README.md'],
        [path.join(CURRENTWORK_DIR, 'zeta')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'alpha', 'README.md')]: README_BASIC('alpha'),
        [path.join(CURRENTWORK_DIR, 'zeta', 'README.md')]: README_BASIC('zeta'),
      },
    });

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();

    expect(result).toHaveLength(2);
    expect(result.map((j) => j.slug).sort()).toEqual(['alpha', 'zeta']);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('unit_jobs_by_slug_via_mock: returns matching job; undefined for unknown', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['foo'],
        [path.join(CURRENTWORK_DIR, 'foo')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'foo', 'README.md')]: README_BASIC('foo-bar'),
      },
    });

    const { getJobBySlug } = await import('../jobs');
    expect(await getJobBySlug('foo')).toBeDefined();
    expect(await getJobBySlug('bogus')).toBeUndefined();
  });

  it('unit_jobs_phase_via_mock: returns matching JobPhase; undefined for bogus phase', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['foo'],
        [path.join(CURRENTWORK_DIR, 'foo')]: ['README.md', 'phase-1-foundation.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'foo', 'README.md')]: README_BASIC('foo-bar'),
        [path.join(CURRENTWORK_DIR, 'foo', 'phase-1-foundation.md')]: PHASE_BASIC(
          1,
          'Foundation',
        ),
      },
    });

    const { getJobPhase } = await import('../jobs');
    const phase = await getJobPhase('foo', 'phase-1-foundation');
    expect(phase).toBeDefined();
    expect(phase!.slug).toBe('phase-1-foundation');
    expect(phase!.filename).toBe('phase-1-foundation.md');

    const bogus = await getJobPhase('foo', 'phase-99-bogus');
    expect(bogus).toBeUndefined();
  });

  it('unit_jobs_skip_no_readme: dirs without README.md are silently filtered out', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['has-readme', 'no-readme'],
        [path.join(CURRENTWORK_DIR, 'has-readme')]: ['README.md'],
        [path.join(CURRENTWORK_DIR, 'no-readme')]: ['notes.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'has-readme', 'README.md')]:
          README_BASIC('has-readme'),
        [path.join(CURRENTWORK_DIR, 'no-readme', 'notes.md')]: 'no readme here',
      },
    });

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(result.map((j) => j.slug)).toEqual(['has-readme']);
  });

  it('unit_jobs_sort_alphabetically: returned jobs sorted by slug ascending', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['zebra', 'apple', 'mango'],
        [path.join(CURRENTWORK_DIR, 'zebra')]: ['README.md'],
        [path.join(CURRENTWORK_DIR, 'apple')]: ['README.md'],
        [path.join(CURRENTWORK_DIR, 'mango')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'zebra', 'README.md')]: README_BASIC('zebra'),
        [path.join(CURRENTWORK_DIR, 'apple', 'README.md')]: README_BASIC('apple'),
        [path.join(CURRENTWORK_DIR, 'mango', 'README.md')]: README_BASIC('mango'),
      },
    });

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(result.map((j) => j.slug)).toEqual(['apple', 'mango', 'zebra']);
  });

  it('unit_jobs_sort_phases_numerically: phase-2 before phase-10 (NOT lex sort)', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['lots-of-phases'],
        [path.join(CURRENTWORK_DIR, 'lots-of-phases')]: [
          'README.md',
          'phase-10-final.md',
          'phase-2-middle.md',
          'phase-1-start.md',
        ],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'lots-of-phases', 'README.md')]:
          README_BASIC('lots-of-phases'),
        [path.join(CURRENTWORK_DIR, 'lots-of-phases', 'phase-1-start.md')]:
          PHASE_BASIC(1, 'Start'),
        [path.join(CURRENTWORK_DIR, 'lots-of-phases', 'phase-2-middle.md')]:
          PHASE_BASIC(2, 'Middle'),
        [path.join(CURRENTWORK_DIR, 'lots-of-phases', 'phase-10-final.md')]:
          PHASE_BASIC(10, 'Final'),
      },
    });

    const { getJobBySlug } = await import('../jobs');
    const job = await getJobBySlug('lots-of-phases');
    expect(job).toBeDefined();
    expect(job!.phases.map((p) => p.slug)).toEqual([
      'phase-1-start',
      'phase-2-middle',
      'phase-10-final',
    ]);
  });

  it('unit_jobs_skip_template_md: TEMPLATE.md (file, not dir) is skipped', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['real-job', 'TEMPLATE.md'],
        [path.join(CURRENTWORK_DIR, 'real-job')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'TEMPLATE.md')]: '# Template',
        [path.join(CURRENTWORK_DIR, 'real-job', 'README.md')]:
          README_BASIC('real-job'),
      },
    });

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(result.map((j) => j.slug)).toEqual(['real-job']);
  });
});

// ── Edge cases ──────────────────────────────────────────────────────

describe('jobs.ts: edge cases', () => {
  it('edge_state_jobs_cache_reuse: second getAllJobs() call returns same reference', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['cached'],
        [path.join(CURRENTWORK_DIR, 'cached')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'cached', 'README.md')]: README_BASIC('cached'),
      },
    });

    const { getAllJobs } = await import('../jobs');
    const first = await getAllJobs();
    const second = await getAllJobs();
    expect(second).toBe(first);
  });

  it('edge_state_jobs_empty_currentwork: readdir [] returns frozen []', async () => {
    mountVfs({
      dirs: { [CURRENTWORK_DIR]: [] },
      files: {},
    });

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('edge_state_jobs_currentwork_missing: ENOENT returns frozen []', async () => {
    vi.spyOn(fs, 'readdir').mockRejectedValueOnce(
      Object.assign(new Error('ENOENT'), { code: 'ENOENT' }),
    );

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });
});

// ── Error recovery ──────────────────────────────────────────────────

describe('jobs.ts: error recovery', () => {
  it('err_jobs_invalid_job_throws_loudly: malformed Job (title > 200 chars) → ZodError', async () => {
    const tooLongTitle = 'X'.repeat(201);
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['too-long'],
        [path.join(CURRENTWORK_DIR, 'too-long')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'too-long', 'README.md')]:
          `# ${tooLongTitle}\n\n## Context\nTest\n`,
      },
    });

    const { getAllJobs } = await import('../jobs');
    await expect(getAllJobs()).rejects.toThrow();
  });
});

// ── Data integrity ──────────────────────────────────────────────────

describe('jobs.ts: data integrity', () => {
  it('data_freeze_returned_arrays: getAllJobs() return value is frozen', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['a'],
        [path.join(CURRENTWORK_DIR, 'a')]: ['README.md'],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'a', 'README.md')]: README_BASIC('a'),
      },
    });

    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(Object.isFrozen(result)).toBe(true);
    expect(() => {
      'use strict';
      // @ts-expect-error - testing immutability
      result.push({ slug: 'mutant' });
    }).toThrow();
  });

  it('data_consistency_phase_filename_matches_slug: slug + .md === filename', async () => {
    mountVfs({
      dirs: {
        [CURRENTWORK_DIR]: ['p'],
        [path.join(CURRENTWORK_DIR, 'p')]: [
          'README.md',
          'phase-1-foo.md',
          'phase-2-bar-baz.md',
        ],
      },
      files: {
        [path.join(CURRENTWORK_DIR, 'p', 'README.md')]: README_BASIC('p'),
        [path.join(CURRENTWORK_DIR, 'p', 'phase-1-foo.md')]: PHASE_BASIC(1, 'Foo'),
        [path.join(CURRENTWORK_DIR, 'p', 'phase-2-bar-baz.md')]: PHASE_BASIC(
          2,
          'BarBaz',
        ),
      },
    });

    const { getJobBySlug } = await import('../jobs');
    const job = await getJobBySlug('p');
    for (const phase of job!.phases) {
      expect(`${phase.slug}.md`).toBe(phase.filename);
    }
  });
});

// ── Integration tests (against real currentwork/) ───────────────────

describe('jobs.ts: integration against real currentwork/', () => {
  it('integration_get_all_jobs_real_tree: returns >= 1 entry', async () => {
    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('integration_get_all_jobs_validates_each: every job has non-empty slug, title, readmeBody', async () => {
    const { getAllJobs } = await import('../jobs');
    const result = await getAllJobs();
    for (const job of result) {
      expect(job.slug.length).toBeGreaterThan(0);
      expect(job.title.length).toBeGreaterThan(0);
      expect(job.readmeBody.length).toBeGreaterThan(0);
    }
  });

  it('integration_get_job_community_showcase: alias cs, non-empty context, features >= 6', async () => {
    const { getJobBySlug } = await import('../jobs');
    const job = await getJobBySlug('community-showcase');
    expect(job).toBeDefined();
    expect(job!.alias).toBe('cs');
    expect(job!.context.length).toBeGreaterThan(0);
    expect(job!.features.length).toBeGreaterThanOrEqual(6);
  });

  it('integration_get_job_website_foundation: alias wf', async () => {
    const { getJobBySlug } = await import('../jobs');
    const job = await getJobBySlug('website-foundation');
    expect(job).toBeDefined();
    expect(job!.alias).toBe('wf');
  });

  it('integration_get_job_bpd: alias bpd, features >= 6 (post-condense)', async () => {
    const { getJobBySlug } = await import('../jobs');
    const job = await getJobBySlug('build-in-public-docs');
    expect(job).toBeDefined();
    expect(job!.alias).toBe('bpd');
    expect(job!.features.length).toBeGreaterThanOrEqual(6);
  });

  it('integration_get_phase_real_file: community-showcase phase-1-foundation parses', async () => {
    const { getJobPhase } = await import('../jobs');
    const phase = await getJobPhase('community-showcase', 'phase-1-foundation');
    expect(phase).toBeDefined();
    expect(phase!.header.phaseNumber).toBe(1);
    expect(phase!.body.length).toBeGreaterThan(0);
  });

  it('data_serialization_h1_parse_roundtrip: parseReadme(job.readmeBody).title === job.title', async () => {
    const { getAllJobs } = await import('../jobs');
    const { parseReadme } = await import('../parse-readme');
    const jobs = await getAllJobs();
    for (const job of jobs) {
      const reparsed = parseReadme(job.readmeBody);
      expect(reparsed.title).toBe(job.title);
    }
  });

  it('data_consistency_alias_regex_matches_existing: every real-job alias matches /^[a-z]{1,8}$/', async () => {
    const { getAllJobs } = await import('../jobs');
    const jobs = await getAllJobs();
    for (const job of jobs) {
      if (job.alias !== undefined) {
        expect(job.alias).toMatch(/^[a-z]{1,8}$/);
      }
    }
  });
});
