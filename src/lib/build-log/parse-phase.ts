import type { JobPhaseHeader } from '@/content/schemas';

const PHASE_TITLE_RE = /^#\s+Phase\s+(\d+):\s*(.+)$/m;

export function parsePhaseHeader(markdown: string): JobPhaseHeader {
  const titleMatch = markdown.match(PHASE_TITLE_RE);
  const phaseNumber = titleMatch ? Number(titleMatch[1]) : undefined;
  const title = titleMatch?.[2]?.trim();

  // Bold-key fields use one of two conventions seen in real READMEs:
  //   1. **Key:** value          (key inside bold, value outside)
  //   2. **Key: value**          (entire line inside bold)
  // Try format 1 first, then format 2.
  const grab = (key: string): string | undefined => {
    const re1 = new RegExp(`^\\*\\*${key}:\\*\\*\\s+(.+)$`, 'm');
    const m1 = markdown.match(re1);
    if (m1) return m1[1].trim();

    const re2 = new RegExp(`^\\*\\*${key}:\\s+(.+?)\\*\\*\\s*$`, 'm');
    const m2 = markdown.match(re2);
    if (m2) return m2[1].trim();

    return undefined;
  };

  return {
    phaseNumber,
    title,
    totalSize: grab('Total Size'),
    prerequisites: grab('Prerequisites'),
    newTypes: grab('New Types'),
    newFiles: grab('New Files'),
  };
}
