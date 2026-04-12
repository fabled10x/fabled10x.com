export const CONTENT_PILLARS = [
  'delivery',
  'workflow',
  'business',
  'future',
] as const;

export type ContentPillar = (typeof CONTENT_PILLARS)[number];

export const CONTENT_PILLAR_QUESTIONS: Record<ContentPillar, string> = {
  delivery: 'What can an AI agent team actually deliver?',
  workflow: 'How do you manage AI agents on complex projects?',
  business: 'How do you run this as a business?',
  future: "What's the future of this model?",
};
