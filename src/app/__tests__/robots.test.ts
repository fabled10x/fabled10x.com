import { describe, it, expect } from 'vitest';
import robots from '../robots';

describe('robots', () => {
  // --- Unit ---

  it('unit_robots_allows_all', () => {
    const result = robots();
    expect(result.rules).toBeDefined();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const starRule = rules.find((r) => r.userAgent === '*');
    expect(starRule).toBeDefined();
    expect(starRule?.allow).toBe('/');
  });

  it('unit_robots_sitemap_reference', () => {
    const result = robots();
    expect(result.sitemap).toBe('https://fabled10x.com/sitemap.xml');
  });

  // --- Infrastructure ---

  it('infra_robots_returns_metadataroute_shape', () => {
    const result = robots();
    expect(result).toHaveProperty('rules');
    expect(result).toHaveProperty('sitemap');
  });
});
