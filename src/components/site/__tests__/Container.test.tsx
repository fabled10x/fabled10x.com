import { render, screen } from '@testing-library/react';
import { Container } from '../Container';

describe('Container', () => {
  // --- Unit ---

  it('unit_container_default_render', () => {
    render(<Container>content</Container>);
    const el = screen.getByText('content').closest('div');
    expect(el).toBeInTheDocument();
    expect(el).toHaveClass('mx-auto', 'max-w-5xl');
  });

  it('unit_container_custom_classname', () => {
    render(<Container className="py-12">content</Container>);
    const el = screen.getByText('content').closest('div');
    expect(el).toHaveClass('py-12');
    expect(el).toHaveClass('mx-auto');
  });

  it('unit_container_renders_children', () => {
    render(
      <Container>
        <span data-testid="child">hello</span>
      </Container>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('unit_container_as_section', () => {
    const { container } = render(
      <Container as="section">content</Container>
    );
    expect(container.querySelector('section')).toBeInTheDocument();
  });

  it('unit_container_as_main', () => {
    const { container } = render(
      <Container as="main">content</Container>
    );
    expect(container.querySelector('main')).toBeInTheDocument();
  });

  // --- Edge case ---

  it('edge_container_no_classname', () => {
    render(<Container>content</Container>);
    const el = screen.getByText('content').closest('div');
    const classes = el?.getAttribute('class') ?? '';
    expect(classes).not.toMatch(/\s{2,}/);
    expect(classes).not.toMatch(/undefined/);
  });

  it('edge_container_as_article', () => {
    const { container } = render(
      <Container as="article">content</Container>
    );
    expect(container.querySelector('article')).toBeInTheDocument();
  });

  // --- Smoke ---

  it('smoke_container_import', () => {
    expect(Container).toBeDefined();
    expect(typeof Container).toBe('function');
  });
});
