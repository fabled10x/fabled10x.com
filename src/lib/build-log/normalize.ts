// normalize lib (build-log-overhaul-2.3) — pure shape-normalizers over the raw
// SessionStatus.completedSections union. The only place YAML-shape decisions for
// completed sections live. No IO, no framework deps — importable from the server
// tree and from tests. Consumed by build-log status page (now) and RecentActivity (3.3).
import type { CompletedSectionEntry, SessionStatus } from '@/content/schemas';

type RawEntry = SessionStatus['completedSections'][number];

/**
 * Extract just the section id from any completed-section entry shape.
 * Preserved verbatim from the inline helper that lived in the build-log status page.
 */
export function extractSectionId(entry: RawEntry): string {
  return typeof entry === 'string' ? entry : entry.section;
}

/**
 * Normalize a raw entry (string OR snake_case object) into the discriminated
 * union the UI consumes. Snake_case keys are camelCased; the `kind` tag
 * distinguishes detailed (object) from minimal (string-only) entries. commit_hash
 * is String()-coerced because YAML parses all-digit short hashes as numbers, but
 * the union types commitHash as string.
 */
export function toEntry(raw: RawEntry): CompletedSectionEntry {
  if (typeof raw === 'string') {
    return { kind: 'minimal', id: raw };
  }
  return {
    kind: 'detailed',
    id: raw.section,
    name: raw.name,
    completedAt: raw.completedAt,
    commitHash: raw.commit_hash != null ? String(raw.commit_hash) : undefined,
    commitMessage: raw.commit_message,
    tests: raw.tests,
    filesNew: raw.files_new,
    filesModified: raw.files_modified,
    pushed: raw.pushed,
    notes: raw.notes,
  };
}
