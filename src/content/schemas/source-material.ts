export const SOURCE_MATERIAL_KINDS = [
  'markdown',
  'email',
  'spreadsheet',
  'document',
  'html-mockup',
  'screenshot',
  'transcript',
  'diagram',
  'code',
] as const;

export type SourceMaterialKind = (typeof SOURCE_MATERIAL_KINDS)[number];

export interface SourceMaterial {
  id: string;
  filename: string;
  kind: SourceMaterialKind;
  description: string;
  episodeIds: string[];
  path?: string;
}
