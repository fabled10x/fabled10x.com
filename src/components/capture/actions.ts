'use server';

import { Resend } from 'resend';
import { z } from 'zod';

const InputSchema = z.object({
  email: z.email(),
  source: z.string().min(1).max(128),
});

export type CaptureState =
  | { status: 'idle' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export async function captureEmail(
  _prev: CaptureState,
  formData: FormData,
): Promise<CaptureState> {
  const parsed = InputSchema.safeParse({
    email: formData.get('email'),
    source: formData.get('source'),
  });

  if (!parsed.success) {
    return { status: 'error', message: 'Please enter a valid email address.' };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const audienceId = process.env.RESEND_AUDIENCE_ID;

  if (!apiKey || !audienceId) {
    console.error('[capture] RESEND_API_KEY or RESEND_AUDIENCE_ID not set');
    return {
      status: 'error',
      message: 'Email capture is temporarily unavailable.',
    };
  }

  try {
    const resend = new Resend(apiKey);
    await resend.contacts.create({
      email: parsed.data.email,
      audienceId,
      unsubscribed: false,
    });
    console.log('[capture] subscribed', parsed.data.source);
    return { status: 'success' };
  } catch {
    // Intentionally do not log the raw error — Resend SDK errors may contain the api key
    console.error('[capture] resend error');
    return {
      status: 'error',
      message: 'Something went wrong. Please try again.',
    };
  }
}
