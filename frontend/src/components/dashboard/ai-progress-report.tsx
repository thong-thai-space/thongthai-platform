'use client';

import { useProgressReport } from '@/hooks/use-ai';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { useProjects } from '@/hooks/use-projects';
import {
  BarChart3,
  Loader2,
  Copy,
  Check,
  Upload,
  FileDown,
  FileType,
  FileSpreadsheet,
} from 'lucide-react';
import { useState } from 'react';
import {
  exportTextAsExcel,
  exportTextAsPdf,
  exportTextAsWord,
  importTextFile,
} from '@/lib/file-export';

export function AiProgressReport() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const mutation = useProgressReport();

  const handleGenerate = () => {
    if (!selectedProjectId || mutation.isPending) return;
    mutation.mutate(
      { projectId: selectedProjectId },
      {
        onSuccess: (data) => setResult(data.report),
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
      setResult(text);
    } catch {
      // user cancelled file picker
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <BarChart3 className="h-5 w-5 text-rose-500" />
        <span className="text-sm font-medium">Progress Report</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Select project *</label>
            {loadingProjects ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading projects...
              </div>
            ) : (
              <select
                value={selectedProjectId}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="">-- Select a project --</option>
                {projects?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.status})
                  </option>
                ))}
              </select>
            )}
          </div>
          <button
            onClick={handleGenerate}
            disabled={!selectedProjectId || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-rose-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating report...
              </>
            ) : (
              <>
                <BarChart3 className="h-4 w-4" />
                Generate Report
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
                onClick={() => exportTextAsPdf('ai-progress-report', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => exportTextAsWord('ai-progress-report', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileType className="h-3.5 w-3.5" /> Word
              </button>
              <button
                type="button"
                onClick={() => exportTextAsExcel('ai-progress-report', result)}
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
