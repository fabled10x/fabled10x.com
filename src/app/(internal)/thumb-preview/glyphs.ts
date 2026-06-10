import type { AccentGlyph } from '@/components/brand';

// Runtime allowlist for the ?accent= param. Typed as AccentGlyph[] so it can
// never drift from DropAccent's AccentGlyph union (compile error on mismatch).
export const ALLOWED_GLYPHS: AccentGlyph[] = ['?', '.', '!', '→', '✕', '✓', '—'];

export const DEFAULT_ACCENT: AccentGlyph = '?';

export function toAccentGlyph(raw: string | undefined): AccentGlyph {
  return ALLOWED_GLYPHS.find((glyph) => glyph === raw) ?? DEFAULT_ACCENT;
}
