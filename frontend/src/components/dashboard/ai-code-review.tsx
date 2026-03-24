'use client';

import { useReviewCode } from '@/hooks/use-ai';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { Code, Loader2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

const commonLanguages = [
  'TypeScript', 'JavaScript', 'Python', 'Java', 'C#', 'Go', 'Rust',
  'PHP', 'Ruby', 'SQL', 'HTML/CSS', 'Dart',
];

export function AiCodeReview() {
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('TypeScript');
  const [context, setContext] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const mutation = useReviewCode();

  const handleReview = () => {
    if (!code.trim() || mutation.isPending) return;
    mutation.mutate(
      { code: code.trim(), language, context: context || undefined },
      {
        onSuccess: (data) => setResult(data.review),
        onError: () => setResult('An error occurred. Please try again.'),
      },
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Code className="h-5 w-5 text-green-500" />
        <span className="text-sm font-medium">Review Code</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {commonLanguages.map((lang) => (
                  <option key={lang} value={lang}>
                    {lang}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Context (optional)</label>
              <input
                type="text"
                value={context}
                onChange={(e) => setContext(e.target.value)}
                placeholder="e.g. NestJS controller, React hook..."
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Code to review *</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste the code to review here..."
              rows={10}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 font-mono text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleReview}
            disabled={!code.trim() || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-green-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Reviewing...
              </>
            ) : (
              <>
                <Code className="h-4 w-4" />
                Review Code
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {result && (
          <div className="relative rounded-xl border border-border bg-muted/50 p-4">
            <button
              onClick={handleCopy}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              title="Copy"
            >
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </button>
            <MarkdownContent content={result} className="pr-10 text-sm" />
          </div>
        )}
      </div>
    </div>
  );
}
