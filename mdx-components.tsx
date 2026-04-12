import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h1: ({ children }) => (
    <h1 className="font-display text-4xl font-bold tracking-tight text-foreground">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground mt-8 mb-4">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="font-display text-xl font-semibold text-foreground mt-6 mb-3">
      {children}
    </h3>
  ),
  p: ({ children }) => (
    <p className="text-secondary leading-relaxed mb-4">{children}</p>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      className="text-link underline underline-offset-2 hover:text-foreground transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc list-inside text-secondary mb-4 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal list-inside text-secondary mb-4 space-y-1">
      {children}
    </ol>
  ),
  code: ({ children }) => (
    <code className="font-mono text-sm bg-mist/50 px-1.5 py-0.5 rounded">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="font-mono text-sm bg-mist/30 p-4 rounded-lg overflow-x-auto mb-4">
      {children}
    </pre>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
