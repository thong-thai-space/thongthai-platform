'use client';

import ReactMarkdown from 'react-markdown';

type MarkdownContentProps = {
  content: string;
  className?: string;
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={className}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="mb-2 text-xl font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-lg font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1.5 text-base font-semibold">{children}</h3>,
          p: ({ children }) => <p className="mb-2 leading-6 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li>{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-border pl-3 italic text-muted-foreground">
              {children}
            </blockquote>
          ),
          code: ({ children }) => (
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
          ),
          pre: ({ children }) => (
            <pre className="mb-2 overflow-x-auto rounded-lg border border-border bg-background p-3 text-sm">
              {children}
            </pre>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="text-primary underline underline-offset-2"
            >
              {children}
            </a>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
