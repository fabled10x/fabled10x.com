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
