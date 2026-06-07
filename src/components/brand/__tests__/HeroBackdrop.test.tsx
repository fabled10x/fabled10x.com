import { render } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { HeroBackdrop } from '../HeroBackdrop';
import * as brandBarrel from '..';

describe('HeroBackdrop — homepage hero cream overlay', () => {
  it('unit_hero_backdrop_renders_aria_hidden_div', () => {
    const { container } = render(<HeroBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.tagName).toBe('DIV');
    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(root.className).toMatch(/\babsolute\b/);
    expect(root.className).toMatch(/-z-10/);
    expect(root.className).toMatch(/\bpointer-events-none\b/);
  });

  it('unit_hero_backdrop_applies_marble_background_and_horizontal_mask', () => {
    const { container } = render(<HeroBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.background).toMatch(/var\(--color-marble\)/);
    expect(root.style.maskImage).toMatch(/linear-gradient\(to right/);
    expect(root.style.maskImage).toMatch(/0%/);
    expect(root.style.maskImage).toMatch(/100%/);
  });

  it('unit_hero_backdrop_exported_from_brand_barrel', () => {
    expect(brandBarrel).toHaveProperty('HeroBackdrop');
  });
});
