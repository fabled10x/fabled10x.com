import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const mockAction = vi.fn(async (_prev: unknown, formData: FormData) => {
  const email = formData.get('email');
  if (typeof email !== 'string' || !email.includes('@')) {
    return { status: 'error' as const, message: 'Please enter a valid email address.' };
  }
  return { status: 'success' as const };
});

vi.mock('../actions', () => ({
  captureEmail: (...args: Parameters<typeof mockAction>) => mockAction(...args),
}));

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EmailCapture } from '../EmailCapture';

const REPO_ROOT = join(__dirname, '..', '..', '..', '..');
const readSource = (relPath: string) => readFileSync(join(REPO_ROOT, relPath), 'utf8');
const EMAIL_CAPTURE_SOURCE = 'src/components/capture/EmailCapture.tsx';
const EMAIL_CAPTURE_SRC = readSource(EMAIL_CAPTURE_SOURCE);
const GLOBALS_CSS = readSource('src/app/globals.css');
const FORBIDDEN_SENTINEL_SRC = readSource('src/__tests__/brand/forbidden-patterns.test.ts');

function emailInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[name="email"]') as HTMLInputElement | null;
  expect(el, 'email input not found').not.toBeNull();
  return el!;
}

function sourceInput(container: HTMLElement): HTMLInputElement {
  const el = container.querySelector('input[name="source"]') as HTMLInputElement | null;
  expect(el, 'source hidden input not found').not.toBeNull();
  return el!;
}

function formEl(container: HTMLElement): HTMLFormElement {
  const el = container.querySelector('form') as HTMLFormElement | null;
  expect(el, 'form element not found').not.toBeNull();
  return el!;
}

function boneSurfaceRoot(container: HTMLElement): HTMLElement {
  // The Bone wrapper is the outermost element in both idle/error and success states.
  const el = container.firstElementChild as HTMLElement | null;
  expect(el, 'Bone surface root not found').not.toBeNull();
  return el!;
}

describe('EmailCapture reskin (styling-overhaul-5.3)', () => {
  beforeEach(() => {
    mockAction.mockClear();
  });

  // ─── Unit ──────────────────────────────────────────────────────────────

  it('unit_idle_renders_form_landmark', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    expect(screen.getByRole('form')).toBeInTheDocument();
    expect(formEl(container)).toBeInTheDocument();
    expect(screen.queryByText(/welcome to the library/i)).not.toBeInTheDocument();
  });

  it('unit_source_hidden_input_present', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const hidden = sourceInput(container);
    expect(hidden.type).toBe('hidden');
    expect(hidden.value).toBe('homepage-hero');
  });

  it('unit_button_label_default_join_the_library', () => {
    render(<EmailCapture source="test" />);
    expect(screen.getByRole('button', { name: /join the library/i })).toBeInTheDocument();
  });

  it('unit_button_label_override', () => {
    render(<EmailCapture source="test" buttonLabel="Subscribe" />);
    expect(screen.getByRole('button', { name: /subscribe/i })).toBeInTheDocument();
  });

  it('unit_placeholder_default_you_at_somewhere_dev', () => {
    const { container } = render(<EmailCapture source="test" />);
    expect(emailInput(container).placeholder).toBe('you@somewhere.dev');
  });

  it('unit_placeholder_override', () => {
    const { container } = render(<EmailCapture source="test" placeholder="email@acme.dev" />);
    expect(emailInput(container).placeholder).toBe('email@acme.dev');
  });

  it('unit_email_input_attrs_type_email_required', () => {
    const { container } = render(<EmailCapture source="test" />);
    const email = emailInput(container);
    expect(email.type).toBe('email');
    expect(email.required).toBe(true);
  });

  it('unit_idle_form_wrapped_in_bone_surface', () => {
    const { container } = render(<EmailCapture source="test" />);
    const root = boneSurfaceRoot(container);
    expect(root.className).toMatch(/bg-\(--color-bone\)/);
    expect(root.className).toMatch(/border-\(--edge-color-subtle\)/);
  });

  it('unit_input_has_ink_underline_at_rest', () => {
    const { container } = render(<EmailCapture source="test" />);
    const email = emailInput(container);
    expect(email.className).toMatch(/\bborder-0\b/);
    expect(email.className).toMatch(/\bborder-b\b/);
    expect(email.className).toMatch(/border-\(--color-ink\)/);
  });

  it('unit_input_has_oxblood_focus_underline', () => {
    const { container } = render(<EmailCapture source="test" />);
    const email = emailInput(container);
    expect(email.className).toMatch(/focus:outline-none/);
    expect(email.className).toMatch(/focus:border-\(--color-oxblood\)/);
  });

  it('unit_submit_is_brand_button_primary', () => {
    render(<EmailCapture source="test" />);
    const button = screen.getByRole('button');
    // Button primitive default variant=primary → bg-(--color-ink) text-(--color-marble)
    expect(button.className).toMatch(/bg-\(--color-ink\)/);
    expect(button.className).toMatch(/text-\(--color-marble\)/);
  });

  it('unit_visible_label_text_email', () => {
    const { container } = render(<EmailCapture source="test" />);
    const labels = Array.from(container.querySelectorAll('label')) as HTMLLabelElement[];
    // Find the label that is NOT sr-only and contains the word "Email"
    const visible = labels.find(
      l => !/\bsr-only\b/.test(l.className) && /email/i.test(l.textContent ?? ''),
    );
    expect(visible, 'visible (non-sr-only) Email label not found').toBeDefined();
    // Must use the .label brand utility somewhere inside the label
    expect(visible!.innerHTML).toMatch(/\blabel\b/);
  });

  // ─── Integration ───────────────────────────────────────────────────────

  it('integration_action_receives_formdata_email_and_source', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="homepage-hero" />);
    await user.type(emailInput(container), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(mockAction).toHaveBeenCalled());
    const formData = mockAction.mock.calls[0][1] as FormData;
    expect(formData.get('source')).toBe('homepage-hero');
    expect(formData.get('email')).toBe('user@example.com');
  });

  it('integration_idle_to_success_transition_replaces_form', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    await user.type(emailInput(container), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() =>
      expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument(),
    );
    expect(screen.queryByRole('form')).not.toBeInTheDocument();
    // Success state still wrapped in a Bone surface
    const root = boneSurfaceRoot(container);
    expect(root.className).toMatch(/bg-\(--color-bone\)/);
  });

  it('integration_error_state_renders_action_message', async () => {
    mockAction.mockResolvedValueOnce({
      status: 'error',
      message: 'Custom error message from action',
    });
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    await user.type(emailInput(container), 'user@example.com');
    await user.click(screen.getByRole('button'));
    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toMatch(/custom error message from action/i);
    expect(alert.className).toMatch(/text-\(--color-oxblood\)/);
    expect(alert.className).toMatch(/\bbody-3\b/);
    // Form still visible
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('integration_pending_state_swaps_button_label_and_disables', async () => {
    let resolveAction: (v: { status: 'success' }) => void = () => {};
    mockAction.mockImplementationOnce(
      () =>
        new Promise<{ status: 'success' }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" buttonLabel="Join now" />);
    await user.type(emailInput(container), 'user@example.com');
    const button = screen.getByRole('button') as HTMLButtonElement;
    await user.click(button);
    // While pending: label flips to Sending… and button disables
    await waitFor(() => expect(button.disabled).toBe(true));
    expect(button.textContent).toMatch(/sending/i);
    expect(button.textContent).not.toMatch(/join now/i);
    resolveAction({ status: 'success' });
    await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
  });

  it('integration_success_state_renders_verdigris_check_glyph', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    await user.type(emailInput(container), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
    const glyph = container.querySelector('[aria-hidden="true"]') as HTMLElement | null;
    expect(glyph, '✓ glyph element not found').not.toBeNull();
    expect(glyph!.textContent).toBe('✓');
    expect(glyph!.className).toMatch(/text-\(--color-verdigris\)/);
  });

  // ─── Accessibility ────────────────────────────────────────────────────

  it('a11y_label_associated_with_email_input_via_for', () => {
    const { container } = render(<EmailCapture source="homepage-hero" />);
    const email = emailInput(container);
    // Either: a) htmlFor matches email.id, OR b) implicit association (label wraps input)
    const labelFor = email.id
      ? (container.querySelector(`label[for="${email.id}"]`) as HTMLLabelElement | null)
      : null;
    const implicit = email.closest('label');
    expect(labelFor || implicit, 'no label associated with email input').toBeTruthy();
  });

  it('a11y_form_landmark_present_in_idle', () => {
    render(<EmailCapture source="test" />);
    // getByRole('form') only works when the form has an accessible name (aria-label or aria-labelledby).
    expect(screen.getByRole('form')).toBeInTheDocument();
  });

  it('a11y_error_message_has_role_alert', async () => {
    mockAction.mockResolvedValueOnce({ status: 'error', message: 'Boom.' });
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    await user.type(emailInput(container), 'user@example.com');
    await user.click(screen.getByRole('button'));
    const alert = await screen.findByRole('alert');
    expect(alert.tagName).toBe('P');
    expect(alert.getAttribute('role')).toBe('alert');
  });

  it('a11y_success_check_glyph_aria_hidden', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    await user.type(emailInput(container), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
    const glyph = container.querySelector('[aria-hidden="true"]');
    expect(glyph).not.toBeNull();
    expect(glyph?.textContent).toBe('✓');
  });

  it('a11y_button_is_keyboard_focusable_and_tab_order', async () => {
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    const email = emailInput(container);
    const button = screen.getByRole('button') as HTMLButtonElement;
    await user.tab();
    // First tab can land on either the email input or the label-wrapping element;
    // ensure we can tab through to the button.
    let safety = 0;
    while (document.activeElement !== button && safety < 5) {
      await user.tab();
      safety++;
    }
    expect(button).toHaveFocus();
    expect(email.tabIndex).not.toBe(-1);
  });

  // ─── Infrastructure ────────────────────────────────────────────────────

  it('infra_no_placeholder_palette_names', () => {
    const forbidden: Array<[string, RegExp]> = [
      ['bg-mist', /\bbg-mist\b/],
      ['bg-accent', /\bbg-accent\b/],
      ['text-parchment', /\btext-parchment\b/],
      ['text-foreground', /\btext-foreground\b/],
      ['border-mist', /\bborder-mist\b/],
      ['focus:border-accent', /\bfocus:border-accent\b/],
      ['bg-background', /\bbg-background\b/],
      ['hover:opacity-90', /\bhover:opacity-90\b/],
      ['disabled:opacity-60', /\bdisabled:opacity-60\b/],
      ['text-accent', /\btext-accent\b/],
    ];
    for (const [name, pat] of forbidden) {
      expect(EMAIL_CAPTURE_SRC, `placeholder palette name leaked: ${name}`).not.toMatch(pat);
    }
  });

  it('infra_no_rounded_class', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\brounded(-[a-z0-9]+)?\b/);
  });

  it('infra_no_box_shadow', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bshadow-(sm|md|lg|xl|2xl|inner|none)\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bdrop-shadow\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bbox-shadow\b/);
  });

  it('infra_no_gradient', () => {
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bbg-gradient-/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\blinear-gradient\b/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bfrom-\w/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bvia-\w/);
    expect(EMAIL_CAPTURE_SRC).not.toMatch(/\bto-\w/);
  });

  it('infra_forbidden_pattern_sentinel_clean', () => {
    // Cross-cutting forbidden-pattern sentinel scans src/ excluding SKIP_PATHS.
    // EmailCapture.tsx must NOT be in SKIP_PATHS post-reskin — the regression
    // guard relies on this to catch future drift back to placeholder palette.
    // [^=]* (not [^[]*) — type annotation `: string[]` contains `[`.
    const skipBlock = FORBIDDEN_SENTINEL_SRC.match(/SKIP_PATHS[^=]*=\s*\[([\s\S]*?)\];/);
    expect(skipBlock, 'SKIP_PATHS not found in sentinel').not.toBeNull();
    const body = skipBlock?.[1] ?? '';
    expect(body, 'EmailCapture.tsx should not need SKIP_PATHS exemption').not.toContain(
      'EmailCapture.tsx',
    );
    expect(body, 'src/components/capture/EmailCapture.tsx should not need SKIP_PATHS exemption').not.toContain(
      'capture/EmailCapture.tsx',
    );
  });

  it('infra_tokens_resolve_in_globals_css', () => {
    const tokens = [
      '--color-bone',
      '--color-ink',
      '--color-oxblood',
      '--color-verdigris',
      '--color-marble',
      '--color-muted',
      '--edge-color-subtle',
      '--space-1',
      '--space-2',
      '--space-3',
      '--space-5',
      '--pair-text-on-bone',
    ];
    for (const t of tokens) {
      expect(GLOBALS_CSS, `token ${t} not declared in globals.css`).toContain(t);
    }
    // .label utility declaration present
    expect(GLOBALS_CSS).toMatch(/\.label\s*\{/);
  });

  it('infra_use_client_directive_present', () => {
    const firstNonEmpty = EMAIL_CAPTURE_SRC.split('\n').find((l) => l.trim().length > 0) ?? '';
    expect(firstNonEmpty).toMatch(/['"]use client['"]/);
  });

  it('infra_brand_primitives_imported_from_brand_barrel', () => {
    // Source-grep: must import Bone and Button from a brand-located path
    // (either '@/components/brand' barrel or the individual files under that dir).
    const importsBone =
      /import\s*\{[^}]*\bBone\b[^}]*\}\s*from\s*['"]@\/components\/brand(?:\/Bone)?['"]/.test(
        EMAIL_CAPTURE_SRC,
      );
    expect(importsBone, 'Bone not imported from @/components/brand').toBe(true);
    const importsButton =
      /import\s*\{[^}]*\bButton\b[^}]*\}\s*from\s*['"]@\/components\/brand(?:\/Button)?['"]/.test(
        EMAIL_CAPTURE_SRC,
      );
    expect(importsButton, 'Button not imported from @/components/brand').toBe(true);
  });

  // ─── Edge cases ────────────────────────────────────────────────────────

  it('edge_long_source_string_propagated_to_hidden_input', () => {
    const longSource = 'case-some-very-long-slug-with-many-segments-2026';
    const { container } = render(<EmailCapture source={longSource} />);
    expect(sourceInput(container).value).toBe(longSource);
  });

  it('edge_special_chars_in_source_not_html_escaped_into_attribute', () => {
    const trickySource = 'episode-a&b"c';
    const { container } = render(<EmailCapture source={trickySource} />);
    expect(sourceInput(container).value).toBe(trickySource);
  });

  it('edge_empty_button_label_string_renders_empty_button', () => {
    render(<EmailCapture source="test" buttonLabel="" />);
    // Button still exists in the DOM; idle button label is the empty string
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
    const submit = buttons.find((b) => (b as HTMLButtonElement).type === 'submit') as HTMLButtonElement | undefined;
    expect(submit, 'submit button not found').toBeDefined();
    // Idle state (not pending) → empty label
    expect(submit!.textContent).toBe('');
  });

  it('edge_pending_overrides_buttonLabel', async () => {
    let resolveAction: (v: { status: 'success' }) => void = () => {};
    mockAction.mockImplementationOnce(
      () =>
        new Promise<{ status: 'success' }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" buttonLabel="Custom Label" />);
    await user.type(emailInput(container), 'user@example.com');
    const button = screen.getByRole('button') as HTMLButtonElement;
    await user.click(button);
    await waitFor(() => expect(button.disabled).toBe(true));
    expect(button.textContent).toMatch(/sending/i);
    expect(button.textContent).not.toMatch(/custom label/i);
    resolveAction({ status: 'success' });
    await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
  });

  // ─── Error recovery ────────────────────────────────────────────────────

  it('err_double_submit_prevented_by_pending_disabled', async () => {
    let resolveAction: (v: { status: 'success' }) => void = () => {};
    mockAction.mockImplementationOnce(
      () =>
        new Promise<{ status: 'success' }>((resolve) => {
          resolveAction = resolve;
        }),
    );
    const user = userEvent.setup();
    const { container } = render(<EmailCapture source="test" />);
    await user.type(emailInput(container), 'user@example.com');
    const button = screen.getByRole('button') as HTMLButtonElement;
    await user.click(button);
    await user.click(button);
    await user.click(button);
    expect(button.disabled).toBe(true);
    expect(mockAction).toHaveBeenCalledTimes(1);
    resolveAction({ status: 'success' });
    await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
  });

  it('err_render_no_console_errors_on_mount_unmount', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Idle
    const { unmount: u1 } = render(<EmailCapture source="test" />);
    u1();

    // Error
    mockAction.mockResolvedValueOnce({ status: 'error', message: 'X' });
    const user = userEvent.setup();
    const { container: c2, unmount: u2 } = render(<EmailCapture source="test" />);
    await user.type(emailInput(c2), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await screen.findByRole('alert');
    u2();

    // Success
    const { container: c3, unmount: u3 } = render(<EmailCapture source="test" />);
    await user.type(emailInput(c3), 'user@example.com');
    await user.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
    u3();

    expect(errSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errSpy.mockRestore();
    warnSpy.mockRestore();
  });

  // ─── Data integrity ───────────────────────────────────────────────────

  it('data_state_to_surface_pairing_invariant', async () => {
    // Idle: Bone surface + --edge-color-subtle border
    {
      const { container, unmount } = render(<EmailCapture source="test" />);
      const root = boneSurfaceRoot(container);
      expect(root.className, 'idle bg').toMatch(/bg-\(--color-bone\)/);
      expect(root.className, 'idle border').toMatch(/border-\(--edge-color-subtle\)/);
      unmount();
    }
    // Error: Bone surface preserved; error <p> has oxblood text
    {
      mockAction.mockResolvedValueOnce({ status: 'error', message: 'E' });
      const user = userEvent.setup();
      const { container, unmount } = render(<EmailCapture source="test" />);
      await user.type(emailInput(container), 'user@example.com');
      await user.click(screen.getByRole('button'));
      const alert = await screen.findByRole('alert');
      const root = boneSurfaceRoot(container);
      expect(root.className, 'error bg').toMatch(/bg-\(--color-bone\)/);
      expect(alert.className, 'error message color').toMatch(/text-\(--color-oxblood\)/);
      unmount();
    }
    // Success: Bone surface + verdigris ✓
    {
      const user = userEvent.setup();
      const { container, unmount } = render(<EmailCapture source="test" />);
      await user.type(emailInput(container), 'user@example.com');
      await user.click(screen.getByRole('button'));
      await waitFor(() => expect(screen.getByText(/welcome to the library/i)).toBeInTheDocument());
      const root = boneSurfaceRoot(container);
      expect(root.className, 'success bg').toMatch(/bg-\(--color-bone\)/);
      const glyph = container.querySelector('[aria-hidden="true"]') as HTMLElement;
      expect(glyph.className, 'success glyph color').toMatch(/text-\(--color-verdigris\)/);
      unmount();
    }
  });

  it('data_button_label_default_constants_match_planning_doc', () => {
    // Source-grep: exact string literals from planning doc § 5.3 plan template.
    expect(EMAIL_CAPTURE_SRC, "default placeholder string drifted from planning doc").toContain(
      'you@somewhere.dev',
    );
    expect(EMAIL_CAPTURE_SRC, "default buttonLabel string drifted from planning doc").toContain(
      'Join the library',
    );
    // Success-state copy from planning doc
    expect(EMAIL_CAPTURE_SRC, "success headline copy drifted").toContain(
      'Welcome to the library.',
    );
  });
});
