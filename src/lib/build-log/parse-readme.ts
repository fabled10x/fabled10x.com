import type { JobFeature } from '@/content/schemas';

const ALIAS_RE = /^\*\*Alias:\*\*\s*`([a-z]{1,8})`/m;
const TITLE_RE = /^#\s+(.+)$/m;
const CONTEXT_RE = /## Context\s*\n+([\s\S]*?)(?=\n## |$)/;
const SEPARATOR_CELL_RE = /^:?-{3,}:?$/;

export interface ParsedReadme {
  title: string;
  alias?: string;
  context: string;
  features: JobFeature[];
}

const stripBackticks = (s: string) => s.replace(/`/g, '').trim();

function splitCells(line: string): string[] {
  const trimmed = line.trim();
  if (!trimmed.startsWith('|') || !trimmed.endsWith('|')) return [];
  return trimmed.slice(1, -1).split('|').map((c) => c.trim());
}

function findFeatureTable(markdown: string): JobFeature[] {
  const lines = markdown.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    const headerCells = splitCells(lines[i]);
    if (headerCells.length < 5) continue;

    const normalized = headerCells.map((c) => c.toLowerCase());
    const idCol = normalized.indexOf('#');
    const nameCol = normalized.indexOf('feature');
    const phaseCol = normalized.indexOf('phase');
    const sizeCol = normalized.indexOf('size');
    const statusCol = normalized.indexOf('status');
    if (idCol < 0 || nameCol < 0 || phaseCol < 0 || sizeCol < 0 || statusCol < 0) continue;

    const sepCells = splitCells(lines[i + 1]);
    if (sepCells.length !== headerCells.length) continue;
    if (!sepCells.every((c) => SEPARATOR_CELL_RE.test(c))) continue;

    const features: JobFeature[] = [];
    for (let j = i + 2; j < lines.length; j++) {
      const cells = splitCells(lines[j]);
      if (cells.length !== headerCells.length) break;
      const id = stripBackticks(cells[idCol]);
      if (!/^\d+\.\d+$/.test(id)) break;
      features.push({
        id,
        name: stripBackticks(cells[nameCol]),
        phase: stripBackticks(cells[phaseCol]),
        size: stripBackticks(cells[sizeCol]),
        status: stripBackticks(cells[statusCol]),
      });
    }
    if (features.length > 0) return features;
  }
  return [];
}

export function parseReadme(markdown: string): ParsedReadme {
  const titleMatch = markdown.match(TITLE_RE);
  const title = titleMatch?.[1]?.trim() ?? '';

  const aliasMatch = markdown.match(ALIAS_RE);
  const alias = aliasMatch?.[1];

  const contextMatch = markdown.match(CONTEXT_RE);
  const context = contextMatch?.[1]?.trim() ?? '';

  return { title, alias, context, features: findFeatureTable(markdown) };
}
