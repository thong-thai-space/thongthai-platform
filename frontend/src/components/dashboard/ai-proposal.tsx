'use client';

import { useGenerateProposal } from '@/hooks/use-ai';
import { MarkdownContent } from '@/components/ui/markdown-content';
import {
  FileText,
  Loader2,
  Copy,
  Check,
  Upload,
  FileSpreadsheet,
  FileType,
  FileDown,
} from 'lucide-react';
import { useState } from 'react';
import {
  exportTextAsExcel,
  exportTextAsPdf,
  exportTextAsWord,
  importTextFile,
} from '@/lib/file-export';

export function AiProposal({
  model,
  modelLabel,
}: {
  model?: string;
  modelLabel?: string;
}) {
  const [requirements, setRequirements] = useState('');
  const [budget, setBudget] = useState('');
  const [locale, setLocale] = useState<'VI' | 'EN'>('EN');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const mutation = useGenerateProposal();

  const handleGenerate = () => {
    if (!requirements.trim() || mutation.isPending) return;
    mutation.mutate(
      {
        requirements: requirements.trim(),
        budget: budget || undefined,
        locale,
        model,
      },
      {
        onSuccess: (data) => setResult(data.proposal),
        onError: () => setResult('An error occurred. Please try again.'),
      },
    );
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = async () => {
    try {
      const text = await importTextFile();
      setRequirements(text);
    } catch {
      // user cancelled file picker
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <FileText className="h-5 w-5 text-amber-500" />
        <span className="text-sm font-medium">Generate Proposal</span>
        {modelLabel && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Model: {modelLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Project requirements *</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe the project requirements: website/app type, key features, target audience..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Estimated budget</label>
              <input
                type="text"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="e.g. $5,000 USD"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Language</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'VI' | 'EN')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="EN">English</option>
                <option value="VI">Tiếng Việt</option>
              </select>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!requirements.trim() || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileText className="h-4 w-4" />
                Generate Proposal
              </>
            )}
          </button>
          <button
            onClick={handleImport}
            type="button"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Upload className="h-4 w-4" />
            Import File
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
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportTextAsPdf('ai-proposal', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => exportTextAsWord('ai-proposal', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileType className="h-3.5 w-3.5" /> Word
              </button>
              <button
                type="button"
                onClick={() => exportTextAsExcel('ai-proposal', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
