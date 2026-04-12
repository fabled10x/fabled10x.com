interface LllCrosslinksProps {
  urls: string[];
  className?: string;
}

export function LllCrosslinks({ urls, className }: LllCrosslinksProps) {
  if (urls.length === 0) return null;

  return (
    <section className={className}>
      <h2 className="font-display text-xl font-semibold">
        From The Large Language Library
      </h2>
      <ul className="mt-4 space-y-2 text-sm">
        {urls.map((url) => (
          <li key={url}>
            <a
              href={url}
              className="text-link underline-offset-2 hover:underline"
            >
              {url}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
