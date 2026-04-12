import { render, screen } from '@testing-library/react';
import { EmailCapture } from '../EmailCapture';

describe('EmailCapture stub', () => {
  it('unit_stub_renders', () => {
    expect(() => render(<EmailCapture source="test" />)).not.toThrow();
  });

  it('unit_stub_source_prop', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const input = container.querySelector('input[name="source"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.value).toBe('homepage-hero');
  });

  it('unit_stub_form_element', () => {
    render(<EmailCapture source="test" />);
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
});
