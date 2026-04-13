import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Job, JobPhase } from '@/content/schemas';
import { JobSchema } from '@/content/schemas';
import { parseReadme } from './parse-readme';
import { parsePhaseHeader } from './parse-phase';

const CURRENTWORK_DIR = path.join(process.cwd(), 'currentwork');
const PHASE_FILE_RE = /^phase-(\d+)-[a-z0-9-]+\.md$/;

let cache: readonly Job[] | null = null;

async function loadJob(slug: string): Promise<Job | null> {
  const jobDir = path.join(CURRENTWORK_DIR, slug);
  const readmePath = path.join(jobDir, 'README.md');

  let readmeBody: string;
  try {
    readmeBody = await fs.readFile(readmePath, 'utf8');
  } catch {
    return null;
  }

  const parsed = parseReadme(readmeBody);

  const entries = await fs.readdir(jobDir);
  const phaseFiles = entries
    .filter((f) => PHASE_FILE_RE.test(f))
    .sort((a, b) => {
      const numA = Number(a.match(PHASE_FILE_RE)![1]);
      const numB = Number(b.match(PHASE_FILE_RE)![1]);
      return numA - numB;
    });

  const phases: JobPhase[] = await Promise.all(
    phaseFiles.map(async (filename) => {
      const body = await fs.readFile(path.join(jobDir, filename), 'utf8');
      return {
        slug: filename.replace(/\.md$/, ''),
        filename,
        header: parsePhaseHeader(body),
        body,
      };
    }),
  );

  const job: Job = {
    slug,
    alias: parsed.alias,
    title: parsed.title || slug,
    context: parsed.context,
    features: parsed.features,
    phases,
    readmeBody,
  };

  return JobSchema.parse(job) as Job;
}

async function loadAll(): Promise<readonly Job[]> {
  if (cache) return cache;

  let entries: string[];
  try {
    entries = await fs.readdir(CURRENTWORK_DIR);
  } catch {
    cache = Object.freeze([]);
    return cache;
  }

  const candidates = entries.filter(
    (entry) => !entry.startsWith('.') && entry !== 'TEMPLATE.md',
  );
  const stats = await Promise.all(
    candidates.map((entry) => fs.stat(path.join(CURRENTWORK_DIR, entry))),
  );
  const dirCandidates = candidates.filter((_, i) => stats[i].isDirectory());

  const jobs = (await Promise.all(dirCandidates.map(loadJob))).filter(
    (j): j is Job => j !== null,
  );

  jobs.sort((a, b) => a.slug.localeCompare(b.slug));

  cache = Object.freeze(jobs);
  return cache;
}

export async function getAllJobs(): Promise<readonly Job[]> {
  return loadAll();
}

export async function getJobBySlug(slug: string): Promise<Job | undefined> {
  const all = await loadAll();
  return all.find((j) => j.slug === slug);
}

export async function getJobPhase(
  slug: string,
  phaseSlug: string,
): Promise<JobPhase | undefined> {
  const job = await getJobBySlug(slug);
  return job?.phases.find((p) => p.slug === phaseSlug);
}
