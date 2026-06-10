import type { Metadata } from 'next';
import { Marble, Section, DropAccent } from '@/components/brand';
import { Container } from '@/components/site/Container';

export const metadata: Metadata = {
  title: 'Check your email',
  robots: { index: false, follow: false },
};

export default function VerifyPage() {
  return (
    <Marble>
      <Section rhythm="lg">
        <Container width="prose">
          <span className="label">Check your email</span>
          <h1 className="display-2 mt-(--space-3)">
            <DropAccent glyph="✓">A sign-in link is on its way</DropAccent>
          </h1>
          <p className="body-1 mt-(--space-4) text-(--color-muted)">
            Open the message we just sent and click the link from the same
            browser to continue to your account.
          </p>
          <p className="body-1 mt-(--space-3) text-(--color-muted)">
            The link expires in 24 hours. If you don&rsquo;t see it, check spam.
          </p>
        </Container>
      </Section>
    </Marble>
  );
}
