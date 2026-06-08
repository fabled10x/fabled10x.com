export const PHASE_ORDER = [
  'preflight',
  'discovery',
  'red',
  'green',
  'refactor',
  'finish',
  'release',
] as const;

export type PhaseName = (typeof PHASE_ORDER)[number];

export const PHASE_LABELS: Readonly<Record<PhaseName, string>> = Object.freeze({
  preflight: 'Running safety checks',
  discovery: 'Researching the change',
  red: 'Writing the tests',
  green: 'Making the tests pass',
  refactor: 'Polishing the code',
  finish: 'Shipping it',
  release: 'Merging to main',
});

export function phaseLabel(name: string | null | undefined): string {
  if (!name) return '';
  if ((PHASE_ORDER as readonly string[]).includes(name)) {
    return PHASE_LABELS[name as PhaseName];
  }
  return name;
}

export function isPhaseName(value: string | null | undefined): value is PhaseName {
  return !!value && (PHASE_ORDER as readonly string[]).includes(value);
}
