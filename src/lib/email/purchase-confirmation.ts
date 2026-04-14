import { Resend } from 'resend';
import { getProductBySlug } from '@/lib/content/products';

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPurchaseConfirmationArgs {
  to: string;
  productSlug: string;
  purchaseId: string;
}

export async function sendPurchaseConfirmation({
  to,
  productSlug,
  purchaseId,
}: SendPurchaseConfirmationArgs): Promise<void> {
  const entry = await getProductBySlug(productSlug);
  const productTitle = entry?.meta.title ?? productSlug;
  const baseUrl = process.env.AUTH_URL ?? 'https://fabled10x.com';
  const accountUrl = `${baseUrl}/products/account/purchases/${purchaseId}`;

  const subject = `Your Fabled10X purchase: ${productTitle}`;
  const html = `
    <div style="font-family: ui-sans-serif, system-ui, sans-serif; max-width: 560px;">
      <h1 style="font-size: 20px;">Thanks for your purchase</h1>
      <p>You bought <strong>${productTitle}</strong>.</p>
      <p>Your download is available in your account. Sign in with this same
        email to access it:</p>
      <p style="margin: 24px 0;">
        <a href="${accountUrl}"
           style="display:inline-block;padding:12px 20px;background:#c2410c;color:#faf8f3;text-decoration:none;border-radius:6px;">
          View your purchase
        </a>
      </p>
      <p style="color: #475569; font-size: 14px;">
        If the link expires, request a fresh sign-in link at
        <a href="${baseUrl}/login">${baseUrl.replace(/^https?:\/\//, '')}/login</a>.
      </p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
      <p style="color: #94a3b8; font-size: 12px;">
        Fabled10X &middot; One person. An agent team. Full SaaS delivery.
      </p>
    </div>
  `;

  const { error } = await resend.emails.send({
    from: process.env.AUTH_RESEND_FROM ?? 'no-reply@fabled10x.com',
    to,
    subject,
    html,
  });

  if (error) {
    throw new Error(`Failed to send purchase confirmation: ${error.message}`);
  }
}
