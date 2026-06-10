import * as childProcess from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { getRepoRoot } from './repo-root';

const BRANCH_PREFIX = 'refs/heads/section/';

export interface LiveWorktree {
  sectionId: string;
  slotPath: string;
  branch: string;
  pid?: number;
  currentPhase?: string;
  agentName?: string;
  startedAt?: string;
}

interface ParsedRecord {
  worktree?: string;
  branch?: string;
}

function gitWorktreeListPorcelain(cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    childProcess.execFile(
      'git',
      ['worktree', 'list', '--porcelain'],
      { cwd, timeout: 2000 },
      (err, stdout) => {
        if (err) reject(err);
        else resolve(String(stdout));
      },
    );
  });
}

function parsePorcelain(text: string): ParsedRecord[] {
  return text
    .split(/\n\n+/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => {
      const record: ParsedRecord = {};
      for (const line of block.split('\n')) {
        if (line.startsWith('worktree ')) {
          record.worktree = line.slice('worktree '.length).trim();
        } else if (line.startsWith('branch ')) {
          record.branch = line.slice('branch '.length).trim();
        }
      }
      return record;
    });
}

interface SectionCandidate {
  sectionId: string;
  slotPath: string;
  branch: string;
}

function extractSectionCandidates(
  records: readonly ParsedRecord[],
): SectionCandidate[] {
  const out: SectionCandidate[] = [];
  for (const r of records) {
    if (!r.worktree || !r.branch) continue;
    if (!r.branch.startsWith(BRANCH_PREFIX)) continue;
    const sectionId = r.branch.slice(BRANCH_PREFIX.length);
    if (!sectionId) continue;
    out.push({ sectionId, slotPath: r.worktree, branch: r.branch });
  }
  return out;
}

async function readPidIfPresent(slotPath: string): Promise<number | undefined> {
  let raw: string;
  try {
    raw = await fs.readFile(path.join(slotPath, '.pipeline.pid'), 'utf8');
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === 'ENOENT' || code === 'EACCES') return undefined;
    console.warn('[build-log] pidfile read failed:', (err as Error).message);
    return undefined;
  }
  const pid = Number(raw.trim());
  if (!Number.isInteger(pid) || pid <= 0) return undefined;
  return pid;
}

async function readCurrentPhase(
  slotPath: string,
  sectionId: string,
): Promise<string | undefined> {
  const beatsPath = path.join(
    slotPath,
    'pipeline',
    'active',
    sectionId,
    'beats.yaml',
  );
  let text: string;
  try {
    text = await fs.readFile(beatsPath, 'utf8');
  } catch {
    return undefined;
  }
  try {
    const parsed = parseYaml(text) as { current_phase?: unknown };
    const phase = parsed?.current_phase;
    return typeof phase === 'string' && phase.length > 0 ? phase : undefined;
  } catch {
    return undefined;
  }
}

async function getCandidates(): Promise<SectionCandidate[]> {
  const repoRoot = await getRepoRoot();
  let stdout: string;
  try {
    stdout = await gitWorktreeListPorcelain(repoRoot);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      console.warn(
        '[build-log] git worktree list failed:',
        (err as Error).message,
      );
    }
    return [];
  }
  return extractSectionCandidates(parsePorcelain(stdout));
}

export async function getLiveSectionIds(): Promise<ReadonlySet<string>> {
  const candidates = await getCandidates();
  return new Set(candidates.map((c) => c.sectionId));
}

export async function getLiveWorktrees(): Promise<readonly LiveWorktree[]> {
  const candidates = await getCandidates();
  const enriched = await Promise.all(
    candidates.map(async (c): Promise<LiveWorktree> => {
      const [pid, currentPhase] = await Promise.all([
        readPidIfPresent(c.slotPath),
        readCurrentPhase(c.slotPath, c.sectionId),
      ]);
      const entry: LiveWorktree = {
        sectionId: c.sectionId,
        slotPath: c.slotPath,
        branch: c.branch,
      };
      if (pid !== undefined) entry.pid = pid;
      if (currentPhase !== undefined) entry.currentPhase = currentPhase;
      return entry;
    }),
  );
  return Object.freeze(enriched);
}
