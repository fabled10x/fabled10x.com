import { describe, it, expect, vi, beforeEach } from 'vitest';

const { execFileMock } = vi.hoisted(() => ({ execFileMock: vi.fn() }));

vi.mock('node:child_process', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:child_process')>();
  return { ...actual, execFile: execFileMock };
});

type ExecFileCb = (
  err: Error | null,
  stdout: string,
  stderr: string,
) => void;

function whenGitReturns(stdout: string) {
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

function whenGitFailsWith(code: string) {
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

beforeEach(() => {
  vi.resetModules();
  execFileMock.mockReset();
});

describe('repo-root: getRepoRoot', () => {
  it('returns dirname of absolute --git-common-dir output', async () => {
    whenGitReturns('/home/user/proj/.git\n');
    const { getRepoRoot } = await import('../repo-root');
    expect(await getRepoRoot()).toBe('/home/user/proj');
  });

  it('resolves relative --git-common-dir against process.cwd()', async () => {
    whenGitReturns('.git\n');
    const { getRepoRoot } = await import('../repo-root');
    expect(await getRepoRoot()).toBe(process.cwd());
  });

  it('memoizes — second call does not shell out', async () => {
    whenGitReturns('/a/b/.git\n');
    const { getRepoRoot } = await import('../repo-root');
    await getRepoRoot();
    await getRepoRoot();
    expect(execFileMock).toHaveBeenCalledTimes(1);
  });

  it('falls back to process.cwd() when git binary is missing', async () => {
    whenGitFailsWith('ENOENT');
    const { getRepoRoot } = await import('../repo-root');
    expect(await getRepoRoot()).toBe(process.cwd());
  });

  it('falls back to process.cwd() when not a git repo', async () => {
    whenGitFailsWith('NOT_A_REPO');
    const { getRepoRoot } = await import('../repo-root');
    expect(await getRepoRoot()).toBe(process.cwd());
  });
});
