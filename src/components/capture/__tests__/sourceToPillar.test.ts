import { describe, it, expect } from 'vitest';

import { CONTENT_PILLARS } from '@/content/schemas/content-pillar';

import { sourceToPillar } from '../sourceToPillar';

describe('sourceToPillar (email-funnel-1)', () => {
  it('unit_sourceToPillar_episode_to_delivery', () => {
    expect(sourceToPillar('episode-claude-shipped-an-app')).toBe('delivery');
    expect(sourceToPillar('episode-zero-to-10x-1')).toBe('delivery');
    expect(sourceToPillar('episode-')).toBe('delivery');
  });

  it('unit_sourceToPillar_case_to_business', () => {
    expect(sourceToPillar('case-party-masters')).toBe('business');
    expect(sourceToPillar('case-acme-co')).toBe('business');
    expect(sourceToPillar('case-')).toBe('business');
  });

  it('unit_sourceToPillar_homepage_hero_to_delivery', () => {
    expect(sourceToPillar('homepage-hero')).toBe('delivery');
  });

  it('unit_sourceToPillar_unknown_defaults_to_delivery', () => {
    expect(sourceToPillar('about-cta')).toBe('delivery');
    expect(sourceToPillar('')).toBe('delivery');
    expect(sourceToPillar('random-string')).toBe('delivery');
    expect(sourceToPillar('tool-roi-calculator')).toBe('delivery');
  });

  it('unit_sourceToPillar_output_in_CONTENT_PILLARS', () => {
    const samples = [
      'episode-x',
      'case-y',
      'homepage-hero',
      'about-cta',
      '',
      'tool-z',
      'unknown',
    ];
    for (const s of samples) {
      expect(CONTENT_PILLARS).toContain(sourceToPillar(s));
    }
  });
});
