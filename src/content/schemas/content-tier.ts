export const CONTENT_TIERS = [
  'flagship',
  'playbook',
  'shorts',
  'livestream',
  'community',
] as const;

export type ContentTier = (typeof CONTENT_TIERS)[number];

export const CONTENT_TIER_LABELS: Record<ContentTier, string> = {
  flagship: 'Flagship Series (Documentary)',
  playbook: 'Playbook Series (Standalone)',
  shorts: 'Short-Form & Hooks',
  livestream: 'Night Build Livestream',
  community: 'Community & Ecosystem',
};
