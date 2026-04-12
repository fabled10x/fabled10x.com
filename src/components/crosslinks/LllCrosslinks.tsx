interface LllCrosslinksProps {
  urls: string[];
  className?: string;
}

function extractEntrySlug(url: string): string {
  try {
    const parsed = new URL(url);
    const last = parsed.pathname.split('/').filter(Boolean).pop();
    return last ? last.replace(/-/g, ' ') : parsed.hostname;
  } catch {
    return url;
  }
}

export function LllCrosslinks({ urls, className }: LllCrosslinksProps) {
  if (urls.length === 0) return null;

  return (
    <section className={className}>
      <p className="text-xs uppercase tracking-wide text-muted">
        From The Large Language Library
      </p>
      <p className="mt-2 max-w-xl text-sm text-muted">
        The structured technical entries generated from this work live at the
        sister project,{' '}
        <a
          href="https://largelanguagelibrary.ai"
          className="text-link underline-offset-2 hover:underline"
          target="_blank"
          rel="noopener"
        >
          largelanguagelibrary.ai
        </a>
        .
      </p>
      <ul className="mt-4 space-y-2">
        {urls.map((url) => (
          <li key={url}>
            <a
              href={url}
              target="_blank"
              rel="noopener"
              className="inline-flex items-center gap-2 text-link underline-offset-2 hover:underline"
            >
              <span className="capitalize">{extractEntrySlug(url)}</span>
              <span aria-hidden="true">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
