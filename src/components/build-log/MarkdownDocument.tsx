import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeSlug from 'rehype-slug';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeHighlight from 'rehype-highlight';

import 'highlight.js/styles/github-dark.css';

interface MarkdownDocumentProps {
  body: string;
  className?: string;
}

export function MarkdownDocument({ body, className }: MarkdownDocumentProps) {
  return (
    <article
      className={[
        'build-log-prose',
        'max-w-none',
        'prose-headings:font-display',
        'prose-headings:text-foreground',
        'prose-a:text-link',
        'prose-code:text-accent',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeSlug,
          [
            rehypeAutolinkHeadings,
            {
              behavior: 'append',
              properties: {
                className: ['build-log-anchor'],
                'aria-label': 'Permalink',
              },
            },
          ],
          rehypeHighlight,
        ]}
        components={{
          h1: ({ children, ...rest }) => <h2 {...rest}>{children}</h2>,
          table: ({ children, ...rest }) => (
            <div className="build-log-table-wrapper overflow-x-auto">
              <table {...rest}>{children}</table>
            </div>
          ),
        }}
      >
        {body}
      </ReactMarkdown>
    </article>
  );
}
