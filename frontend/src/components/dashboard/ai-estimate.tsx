'use client';

import { useEstimateProject } from '@/hooks/use-ai';
import {
  Calculator,
  Loader2,
  Upload,
  FileDown,
  FileType,
  FileSpreadsheet,
} from 'lucide-react';
import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import type { EstimateResponse } from '@/hooks/use-ai';
import {
  exportJsonAsExcel,
  exportJsonAsPdf,
  exportJsonAsWord,
  importTextFile,
} from '@/lib/file-export';

export function AiEstimate({
  model,
  modelLabel,
}: {
  model?: string;
  modelLabel?: string;
}) {
  const [requirements, setRequirements] = useState('');
  const [locale, setLocale] = useState<'VI' | 'EN'>('EN');
  const [result, setResult] = useState<EstimateResponse | null>(null);
  const mutation = useEstimateProject();

  const handleEstimate = () => {
    if (!requirements.trim() || mutation.isPending) return;
    mutation.mutate(
      { requirements: requirements.trim(), locale, model },
      {
        onSuccess: (data) => setResult(data),
        onError: () => setResult(null),
      },
    );
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
        <Calculator className="h-5 w-5 text-blue-500" />
        <span className="text-sm font-medium">Project Estimate</span>
        {modelLabel && (
          <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
            Model: {modelLabel}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Project requirements *</label>
            <textarea
              value={requirements}
              onChange={(e) => setRequirements(e.target.value)}
              placeholder="Describe the project to estimate: app type, features, technical requirements..."
              rows={4}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Language</label>
            <select
              value={locale}
              onChange={(e) => setLocale(e.target.value as 'VI' | 'EN')}
              className="w-full max-w-xs rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="EN">English</option>
              <option value="VI">Tiếng Việt</option>
            </select>
          </div>
          <button
            onClick={handleEstimate}
            disabled={!requirements.trim() || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Estimating...
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Estimate
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
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportJsonAsPdf('ai-estimate', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => exportJsonAsWord('ai-estimate', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileType className="h-3.5 w-3.5" /> Word
              </button>
              <button
                type="button"
                onClick={() => exportJsonAsExcel('ai-estimate', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </button>
            </div>
            {/* Summary cards */}
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-xs text-muted-foreground">Total hours</div>
                <div className="text-2xl font-bold text-blue-600">{result.totalHours}h</div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-xs text-muted-foreground">Cost (VND)</div>
                <div className="text-xl font-bold text-green-600">
                  {result.estimatedCost?.vnd
                    ? formatCurrency(result.estimatedCost.vnd, 'VND')
                    : '—'}
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 text-center">
                <div className="text-xs text-muted-foreground">Cost (USD)</div>
                <div className="text-xl font-bold text-green-600">
                  {result.estimatedCost?.usd
                    ? formatCurrency(result.estimatedCost.usd, 'USD')
                    : '—'}
                </div>
              </div>
            </div>

            {/* Timeline */}
            {result.timeline && (
              <div className="rounded-xl border border-border bg-muted/50 p-4">
                <div className="mb-1 text-xs font-medium text-muted-foreground">Timeline</div>
                <div className="text-sm font-medium">{result.timeline}</div>
              </div>
            )}

            {/* Phases */}
            {result.phases && result.phases.length > 0 && (
              <div className="rounded-xl border border-border">
                <div className="border-b border-border px-4 py-3 text-sm font-medium">
                  Phases ({result.phases.length})
                </div>
                <div className="divide-y divide-border">
                  {result.phases.map((phase, i) => (
                    <div key={i} className="flex items-start justify-between p-4">
                      <div className="min-w-0 flex-1">
                        <div className="font-medium">{phase.name}</div>
                        <div className="text-xs text-muted-foreground">{phase.description}</div>
                      </div>
                      <span className="shrink-0 ml-3 rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {phase.hours}h
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {mutation.isError && (
          <p className="text-sm text-red-500">An error occurred. Please try again.</p>
        )}
      </div>
    </div>
  );
}
