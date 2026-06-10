import { notFound } from 'next/navigation';
import { ALLOWED_GLYPHS } from '../glyphs';

export const dynamic = 'force-dynamic';

interface Example {
  label: string;
  href: string;
}

const EXAMPLES: Example[] = [
  {
    label: 'Flagship — opening question',
    href: '/thumb-preview?title=Build%20the%20whole%20thing%20alone&series=Zero%20to%2010x&tier=FLAGSHIP&accent=%3F',
  },
  {
    label: 'Playbook — declarative',
    href: '/thumb-preview?title=Ship%20it%20alone&series=Playbooks&tier=PLAYBOOK&accent=.',
  },
  {
    label: 'Shorts — emphatic',
    href: '/thumb-preview?title=Do%20it%20now&series=Shorts&tier=SHORTS&accent=!',
  },
  {
    label: 'Field note — directional',
    href: '/thumb-preview?title=From%20zero%20to%20shipped&series=Case%20Study&tier=COMMUNITY&accent=%E2%86%92',
  },
];

export default async function ThumbPreviewIndexPage() {
  if (process.env.NODE_ENV !== 'development') return notFound();

  return (
    <main className="bg-(--color-marble) min-h-screen p-(--space-8)">
      <span className="label text-(--color-oxblood)">Dev tool</span>
      <h1 className="display-2 mt-(--space-3)">Thumbnail composer — example URLs</h1>
      <p className="body-1 text-(--color-muted) mt-(--space-3) max-w-prose">
        Open an example, screenshot the 1280×720 canvas, upload to YouTube. Edit
        the query string to compose your own.
      </p>

      <ul className="mt-(--space-6) flex flex-col gap-(--space-4)">
        {EXAMPLES.map((example) => (
          <li key={example.href} className="flex flex-col gap-(--space-1)">
            <span className="label text-(--color-ink)">{example.label}</span>
            <a className="mono text-(--color-link) break-all" href={example.href}>
              {example.href}
            </a>
          </li>
        ))}
      </ul>

      <div className="mt-(--space-7)">
        <span className="label text-(--color-ink)">Allowed accent glyphs</span>
        <p className="mono text-(--color-muted) mt-(--space-2)">
          {ALLOWED_GLYPHS.join('  ')}
        </p>
      </div>
    </main>
  );
}
