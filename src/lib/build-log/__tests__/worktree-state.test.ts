import { describe, it, expect, vi, beforeEach } from 'vitest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execFile: execFileMock };
});

vi.mock('../repo-root', () => ({
  getRepoRoot: async () => '/tmp/repo',
}));

type ExecFileCb = (
  err: Error | null,
  stdout: string,
  stderr: string,
) => void;

function whenWorktreeListReturns(stdout: string) {
  execFileMock.mockImplementation(
    (
      _cmd: string,
      _args: readonly string[],
      _opts: unknown,
      cb: ExecFileCb,
    ) => {
      cb(null, stdout, '');
    },
  );
}

function whenWorktreeListFailsWith(code: string) {
  execFileMock.mockImplementation(
    (
      _cmd: string,
      _args: readonly string[],
      _opts: unknown,
      cb: ExecFileCb,
    ) => {
      const err = Object.assign(new Error(`spawn git ${code}`), { code });
      cb(err, '', '');
    },
  );
}

function mockFileSystem(files: Record<string, string>) {
  vi.spyOn(fs, 'readFile').mockImplementation(async (p) => {
    const key = String(p);
    if (key in files) return files[key] as never;
    const err = Object.assign(new Error(`ENOENT ${key}`), { code: 'ENOENT' });
    throw err;
  });
}

const MAIN_RECORD = `worktree /tmp/repo
HEAD aaaa
branch refs/heads/main`;

function sectionRecord(slot: string, sectionId: string): string {
  return `worktree ${slot}
HEAD bbbb
branch refs/heads/section/${sectionId}`;
}

const SLOT_STYLE = '/tmp/worktrees/section-styling-overhaul-3.1';
const SLOT_COHORT = '/tmp/worktrees/section-cohort-enrollment-4.1';

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
  execFileMock.mockReset();
});

describe('worktree-state: getLiveSectionIds', () => {
  it('returns empty set when git binary is missing', async () => {
    whenWorktreeListFailsWith('ENOENT');
    mockFileSystem({});
    const { getLiveSectionIds } = await import('../worktree-state');
    const set = await getLiveSectionIds();
    expect([...set]).toEqual([]);
  });

  it('returns empty set when only main worktree exists', async () => {
    whenWorktreeListReturns(MAIN_RECORD + '\n');
    mockFileSystem({});
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()]).toEqual([]);
  });

  it('returns section ID when worktree exists, regardless of pidfile state', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({
      [path.join(SLOT_STYLE, '.pipeline.pid')]: `${process.pid}\n`,
    });
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()]).toEqual(['styling-overhaul-3.1']);
  });

  it('includes worktree even when pidfile is missing (claim-in-progress)', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({});
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()]).toEqual(['styling-overhaul-3.1']);
  });

  it('includes worktree even when pid is dead', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({
      [path.join(SLOT_STYLE, '.pipeline.pid')]: '999999999\n',
    });
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()]).toEqual(['styling-overhaul-3.1']);
  });

  it('ignores detached-HEAD records (no branch line)', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD +
        '\n\nworktree /tmp/worktrees/detached\nHEAD cccc\ndetached\n',
    );
    mockFileSystem({});
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()]).toEqual([]);
  });

  it('ignores non-section branches', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD +
        '\n\nworktree /tmp/worktrees/foo\nHEAD dddd\nbranch refs/heads/feature/foo\n',
    );
    mockFileSystem({});
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()]).toEqual([]);
  });

  it('returns every section worktree present in git, regardless of liveness', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD +
        '\n\n' +
        sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1') +
        '\n\n' +
        sectionRecord(SLOT_COHORT, 'cohort-enrollment-4.1'),
    );
    mockFileSystem({
      [path.join(SLOT_STYLE, '.pipeline.pid')]: `${process.pid}\n`,
    });
    const { getLiveSectionIds } = await import('../worktree-state');
    expect([...await getLiveSectionIds()].sort()).toEqual([
      'cohort-enrollment-4.1',
      'styling-overhaul-3.1',
    ]);
  });
});

describe('worktree-state: getLiveWorktrees', () => {
  it('includes slotPath, branch, pid for each worktree with a pidfile', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({
      [path.join(SLOT_STYLE, '.pipeline.pid')]: `${process.pid}\n`,
    });
    const { getLiveWorktrees } = await import('../worktree-state');
    const list = await getLiveWorktrees();
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      sectionId: 'styling-overhaul-3.1',
      slotPath: SLOT_STYLE,
      branch: 'refs/heads/section/styling-overhaul-3.1',
      pid: process.pid,
    });
  });

  it('includes worktree even when pidfile is missing (pid undefined)', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({});
    const { getLiveWorktrees } = await import('../worktree-state');
    const list = await getLiveWorktrees();
    expect(list).toHaveLength(1);
    expect(list[0].sectionId).toBe('styling-overhaul-3.1');
    expect(list[0].pid).toBeUndefined();
  });

  it('reads current_phase from beats.yaml when present', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({
      [path.join(SLOT_STYLE, '.pipeline.pid')]: `${process.pid}\n`,
      [path.join(
        SLOT_STYLE,
        'pipeline',
        'active',
        'styling-overhaul-3.1',
        'beats.yaml',
      )]: 'current_phase: red\nother: ignored\n',
    });
    const { getLiveWorktrees } = await import('../worktree-state');
    const list = await getLiveWorktrees();
    expect(list[0].currentPhase).toBe('red');
  });

  it('returns currentPhase undefined when beats.yaml is missing', async () => {
    whenWorktreeListReturns(
      MAIN_RECORD + '\n\n' + sectionRecord(SLOT_STYLE, 'styling-overhaul-3.1'),
    );
    mockFileSystem({
      [path.join(SLOT_STYLE, '.pipeline.pid')]: `${process.pid}\n`,
    });
    const { getLiveWorktrees } = await import('../worktree-state');
    const list = await getLiveWorktrees();
    expect(list[0].currentPhase).toBeUndefined();
  });

  it('returns frozen array', async () => {
    whenWorktreeListReturns(MAIN_RECORD + '\n');
    mockFileSystem({});
    const { getLiveWorktrees } = await import('../worktree-state');
    const list = await getLiveWorktrees();
    expect(Object.isFrozen(list)).toBe(true);
  });
});
