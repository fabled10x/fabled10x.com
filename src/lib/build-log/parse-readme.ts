import type { JobFeature } from '@/content/schemas';

const ALIAS_RE = /^\*\*Alias:\*\*\s*`([a-z]{1,8})`/m;
const TITLE_RE = /^#\s+(.+)$/m;
const CONTEXT_RE = /## Context\s*\n+([\s\S]*?)(?=\n## |$)/;
const TABLE_HEADER_RE =
  /^\|\s*#\s*\|\s*Feature\s*\|\s*Phase\s*\|\s*Size\s*\|\s*Status\s*\|/m;
const TABLE_ROW_RE =
  /^\|\s*([0-9]+\.[0-9]+)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*$/gm;

export interface ParsedReadme {
  title: string;
  alias?: string;
  context: string;
  features: JobFeature[];
}

const stripBackticks = (s: string) => s.replace(/`/g, '').trim();

export function parseReadme(markdown: string): ParsedReadme {
  const titleMatch = markdown.match(TITLE_RE);
  const title = titleMatch?.[1]?.trim() ?? '';

  const aliasMatch = markdown.match(ALIAS_RE);
  const alias = aliasMatch?.[1];

  const contextMatch = markdown.match(CONTEXT_RE);
  const context = contextMatch?.[1]?.trim() ?? '';

  const features: JobFeature[] = [];
  if (TABLE_HEADER_RE.test(markdown)) {
    TABLE_ROW_RE.lastIndex = 0;
    let row: RegExpExecArray | null;
    while ((row = TABLE_ROW_RE.exec(markdown)) !== null) {
      const [, id, name, phase, size, status] = row;
      features.push({
        id: stripBackticks(id),
        name: stripBackticks(name),
        phase: stripBackticks(phase),
        size: stripBackticks(size),
        status: stripBackticks(status),
      });
    }
  }

  return { title, alias, context, features };
}
