'use client';

import { useStrategicPlan, useApplyStrategicPlan } from '@/hooks/use-ai';
import { useProjects } from '@/hooks/use-projects';
import { MarkdownContent } from '@/components/ui/markdown-content';
import {
  Sparkles,
  Loader2,
  Upload,
  FileDown,
  FileType,
  FileSpreadsheet,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
  exportDocument,
  importTextFile,
} from '@/lib/file-export';

export function AiStrategicPlan() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const mutation = useStrategicPlan();
  const applyMutation = useApplyStrategicPlan();

  const [objective, setObjective] = useState('');
  const [constraints, setConstraints] = useState('');
  const [projectId, setProjectId] = useState('');
  const [locale, setLocale] = useState<'VI' | 'EN'>('VI');
  const [includeRiskMatrix, setIncludeRiskMatrix] = useState(true);

  const result = mutation.data?.data;

  const summaryMarkdown = useMemo(() => {
    if (!result) return '';
    if (result.raw) return result.raw;

    const lines: string[] = [];
    if (result.executiveSummary) {
      lines.push('## Executive Summary');
      lines.push(result.executiveSummary);
      lines.push('');
    }

    if (result.projectHealth) {
      lines.push('## Project Health');
      lines.push(`- Score: ${result.projectHealth.score ?? 'N/A'}`);
      lines.push(`- Status: ${result.projectHealth.status ?? 'N/A'}`);
      (result.projectHealth.reasons ?? []).forEach((reason) => {
        lines.push(`- ${reason}`);
      });
      lines.push('');
    }

    if (result.stakeholderUpdates?.forInternalTeam || result.stakeholderUpdates?.forClient) {
      lines.push('## Stakeholder Updates');
      if (result.stakeholderUpdates.forInternalTeam) {
        lines.push(`- Internal: ${result.stakeholderUpdates.forInternalTeam}`);
      }
      if (result.stakeholderUpdates.forClient) {
        lines.push(`- Client: ${result.stakeholderUpdates.forClient}`);
      }
      lines.push('');
    }

    if (result.deliveryPlan) {
      lines.push('## Delivery Plan');
      lines.push('### Next 7 Days');
      (result.deliveryPlan.next7Days ?? []).forEach((item) => lines.push(`- ${item}`));
      lines.push('### Next 30 Days');
      (result.deliveryPlan.next30Days ?? []).forEach((item) => lines.push(`- ${item}`));
      lines.push('### Dependencies');
      (result.deliveryPlan.dependencies ?? []).forEach((item) => lines.push(`- ${item}`));
      lines.push('');
    }

    return lines.join('\n').trim();
  }, [result]);

  const handleGenerate = () => {
    if (!objective.trim() || mutation.isPending) return;

    mutation.mutate({
      objective: objective.trim(),
      constraints: constraints.trim() || undefined,
      projectId: projectId || undefined,
      locale,
      includeRiskMatrix,
    });
  };

  const handleImport = async () => {
    try {
      const text = await importTextFile();
      setObjective(text);
    } catch {
      // user cancelled file picker
    }
  };

  const handleApply = () => {
    if (!mutation.data?.data || !projectId || applyMutation.isPending) return;

    applyMutation.mutate({
      projectId,
      plan: mutation.data.data as Record<string, unknown>,
      objective: objective.trim() || undefined,
      constraints: constraints.trim() || undefined,
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <Sparkles className="h-5 w-5 text-indigo-500" />
        <span className="text-sm font-medium">Strategic AI Brief</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="space-y-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Objective *</label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              placeholder="Example: Build a 30-day action plan to improve delivery speed and reduce blocked tasks"
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Constraints</label>
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
              placeholder="Budget cap, team limits, deadline constraints..."
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Project Context</label>
              {loadingProjects ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading projects...
                </div>
              ) : (
                <select
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="">No specific project</option>
                  {projects?.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} ({project.status})
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Language</label>
              <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as 'VI' | 'EN')}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="VI">Tiếng Việt</option>
                <option value="EN">English</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={includeRiskMatrix}
              onChange={(e) => setIncludeRiskMatrix(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Include risk matrix
          </label>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleGenerate}
              disabled={!objective.trim() || mutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-600 disabled:opacity-50"
            >
              {mutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Strategic Brief
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
        </div>

        {mutation.isError && (
          <p className="text-sm text-red-500">An error occurred. Please try again.</p>
        )}

        {mutation.data && (
          <div className="space-y-3 rounded-xl border border-border bg-muted/50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleApply}
                disabled={!projectId || applyMutation.isPending}
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {applyMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />} Submit Apply Request
              </button>
              <button
                type="button"
                onClick={() => {
                  const projectName = projects?.find((p) => p.id === projectId)?.name;
                  exportDocument('strategic-plan', 'pdf', mutation.data.data, { projectName, locale });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => {
                  const projectName = projects?.find((p) => p.id === projectId)?.name;
                  exportDocument('strategic-plan', 'docx', mutation.data.data, { projectName, locale });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileType className="h-3.5 w-3.5" /> Word
              </button>
              <button
                type="button"
                onClick={() => {
                  const projectName = projects?.find((p) => p.id === projectId)?.name;
                  exportDocument('strategic-plan', 'xlsx', mutation.data.data, { projectName, locale });
                }}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </button>
            </div>

            {!projectId && (
              <p className="text-xs text-amber-600">Select a project context to enable one-click apply.</p>
            )}

            {applyMutation.isSuccess && (
              <p className="text-xs text-green-700">
                {applyMutation.data.message}
              </p>
            )}

            {applyMutation.isError && (
              <p className="text-xs text-red-600">Failed to apply plan. Please try again.</p>
            )}

            {summaryMarkdown && (
              <MarkdownContent content={summaryMarkdown} className="text-sm" />
            )}

            {result?.priorityActions && result.priorityActions.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Priority Actions</h3>
                <div className="space-y-2">
                  {result.priorityActions.map((action, index) => (
                    <div key={index} className="rounded-lg border border-border bg-card p-3">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{action.title}</p>
                        <span className="rounded bg-muted px-2 py-0.5 text-[11px] font-medium">
                          {action.impact}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Owner: {action.owner} • Timeline: {action.timeline}
                      </p>
                      <p className="mt-2 text-sm">{action.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {result?.riskMatrix && result.riskMatrix.length > 0 && (
              <div>
                <h3 className="mb-2 text-sm font-semibold">Risk Matrix</h3>
                <div className="space-y-2">
                  {result.riskMatrix.map((item, index) => (
                    <div key={index} className="rounded-lg border border-border bg-card p-3">
                      <p className="text-sm font-medium">{item.risk}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Probability: {item.probability} • Severity: {item.severity}
                      </p>
                      <p className="mt-2 text-sm">Mitigation: {item.mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
