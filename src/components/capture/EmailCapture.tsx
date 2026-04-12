export function EmailCapture({ source }: { source: string }) {
  return (
    <form aria-label="Email capture">
      <input type="hidden" name="source" value={source} />
      <div className="flex gap-3">
        <input
          type="email"
          name="email"
          placeholder="you@example.com"
          required
          className="flex-1 rounded-md border border-mist bg-transparent px-4 py-2 text-sm placeholder:text-muted focus:border-accent focus:outline-none"
        />
        <button
          type="submit"
          className="rounded-md bg-accent px-5 py-2 text-sm font-medium text-parchment hover:opacity-90"
        >
          Subscribe
        </button>
      </div>
    </form>
  );
}
