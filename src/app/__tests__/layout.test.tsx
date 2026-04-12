import { vi } from 'vitest';

vi.mock('next/font/google', () => ({
  Geist: () => ({ variable: '--font-geist-sans', className: 'geist-sans' }),
  Geist_Mono: () => ({ variable: '--font-geist-mono', className: 'geist-mono' }),
}));

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

import { render, screen } from '@testing-library/react';
import { metadata } from '../layout';
import RootLayout from '../layout';

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

  // --- Unit: expanded SEO metadata (phase 4.1) ---

  it('unit_layout_metadata_opengraph', () => {
    expect(metadata.openGraph).toBeDefined();
    const og = metadata.openGraph as {
      type?: string;
      siteName?: string;
      images?: Array<string | { url: string }> | string | { url: string };
    };
    expect(og.type).toBe('website');
    expect(og.siteName).toBe('fabled10x');
    expect(og.images).toBeDefined();
  });

  it('unit_layout_metadata_twitter', () => {
    expect(metadata.twitter).toBeDefined();
    const twitter = metadata.twitter as { card?: string; creator?: string };
    expect(twitter.card).toBe('summary_large_image');
    expect(twitter.creator).toMatch(/Fabled10X/i);
  });

  it('unit_layout_metadata_robots', () => {
    expect(metadata.robots).toBeDefined();
    const robots = metadata.robots as { index?: boolean; follow?: boolean };
    expect(robots.index).toBe(true);
    expect(robots.follow).toBe(true);
  });
});

describe('layout shell', () => {
  // --- Integration: shell components ---

  it('i_layout_header_present', () => {
    render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('i_layout_footer_present', () => {
    render(
      <RootLayout>
        <div>page content</div>
      </RootLayout>
    );
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('i_layout_main_wrapper', () => {
    render(
      <RootLayout>
        <div data-testid="child">page content</div>
      </RootLayout>
    );
    const child = screen.getByTestId('child');
    expect(child.closest('main')).toBeInTheDocument();
  });
});
