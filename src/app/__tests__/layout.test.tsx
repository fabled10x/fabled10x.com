import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans', className: 'geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono', className: 'geist-mono' }),
}));

import { metadata } from '../layout';

describe('layout metadata', () => {
  // --- Unit: metadataBase ---

  it('unit_metadata_base_url', () => {
    expect(metadata.metadataBase).toBeInstanceOf(URL);
    expect(metadata.metadataBase?.toString()).toBe('https://fabled10x.com/');
  });

  // --- Unit: title template ---

  it('unit_metadata_title_default', () => {
    const title = metadata.title as { default: string; template: string };
    expect(title.default).toBe('fabled10x');
  });

  it('unit_metadata_title_template', () => {
    const title = metadata.title as { default: string; template: string };
    expect(title.template).toBe('%s · fabled10x');
  });

  // --- Integration: description preserved ---

  it('i_metadata_description', () => {
    expect(metadata.description).toBe(
      'One person. An agent team. Full SaaS delivery.'
    );
  });
});
