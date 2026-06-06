import * as childProcess from 'node:child_process';
import path from 'node:path';

let cached: string | null = null;
let warned = false;

function gitCommonDir(): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'git',
      ['rev-parse', '--git-common-dir'],
      { cwd: process.cwd(), timeout: 2000 },
      (err, stdout) => {
        if (err) reject(err);
        else resolve(String(stdout));
      },
    );
  });
}

export async function getRepoRoot(): Promise<string> {
  if (cached) return cached;
  try {
    const gitDir = (await gitCommonDir()).trim();
    const abs = path.isAbsolute(gitDir)
      ? gitDir
      : path.resolve(process.cwd(), gitDir);
    cached = path.dirname(abs);
    return cached;
  } catch (err) {
    if (!warned) {
      warned = true;
      console.warn(
        '[build-log] getRepoRoot fell back to process.cwd():',
        (err as Error).message,
      );
    }
    cached = process.cwd();
    return cached;
  }
}

export function __resetRepoRootCacheForTests(): void {
  cached = null;
  warned = false;
}
