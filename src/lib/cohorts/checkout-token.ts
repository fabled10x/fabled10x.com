import { createHmac, timingSafeEqual } from 'node:crypto';

interface TokenPayload {
  applicationId: string;
  cohortSlug: string;
  expiresAt: number;
}

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; reason: 'malformed' | 'bad-signature' | 'expired' };

function base64urlEncode(buffer: Buffer): string {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function base64urlDecode(value: string): Buffer {
  const padNeeded = (4 - (value.length % 4)) % 4;
  const padded = value + '='.repeat(padNeeded);
  return Buffer.from(padded.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

function sign(body: string): string {
  const secret = process.env.COHORT_CHECKOUT_SECRET;
  if (!secret) throw new Error('COHORT_CHECKOUT_SECRET is not set');
  return base64urlEncode(createHmac('sha256', secret).update(body).digest());
}

export function signCheckoutToken(payload: TokenPayload): string {
  const body = base64urlEncode(Buffer.from(JSON.stringify(payload)));
  const signature = sign(body);
  return `${body}.${signature}`;
}

export function verifyCheckoutToken(token: string): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 2 || parts[0].length === 0 || parts[1].length === 0) {
    return { ok: false, reason: 'malformed' };
  }
  const [body, signature] = parts;

  const expected = sign(body);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (
    expectedBuf.length !== actualBuf.length ||
    !timingSafeEqual(expectedBuf, actualBuf)
  ) {
    return { ok: false, reason: 'bad-signature' };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(base64urlDecode(body).toString('utf8'));
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  if (
    !parsed ||
    typeof parsed !== 'object' ||
    typeof (parsed as TokenPayload).applicationId !== 'string' ||
    typeof (parsed as TokenPayload).cohortSlug !== 'string' ||
    typeof (parsed as TokenPayload).expiresAt !== 'number'
  ) {
    return { ok: false, reason: 'malformed' };
  }

  const payload = parsed as TokenPayload;
  if (Date.now() > payload.expiresAt) {
    return { ok: false, reason: 'expired' };
  }

  return { ok: true, payload };
}
