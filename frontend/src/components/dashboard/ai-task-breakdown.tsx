'use client';

import { useBreakdownTasks } from '@/hooks/use-ai';
import {
  GitBranch,
  Loader2,
  ChevronDown,
  ChevronRight,
  Upload,
  FileDown,
  FileType,
  FileSpreadsheet,
} from 'lucide-react';
import { useState } from 'react';
import type { TaskBreakdownResponse } from '@/hooks/use-ai';
import {
  exportJsonAsExcel,
  exportJsonAsPdf,
  exportJsonAsWord,
  importTextFile,
} from '@/lib/file-export';

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

export function AiTaskBreakdown() {
  const [description, setDescription] = useState('');
  const [techStackInput, setTechStackInput] = useState('');
  const [result, setResult] = useState<TaskBreakdownResponse | null>(null);
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());
  const mutation = useBreakdownTasks();

  const handleGenerate = () => {
    if (!description.trim() || mutation.isPending) return;
    const techStack = techStackInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    mutation.mutate(
      { description: description.trim(), techStack },
      {
        onSuccess: (data) => {
          setResult(data);
          setExpandedMilestones(new Set(data.milestones.map((_, i) => i)));
        },
        onError: () => setResult(null),
      },
    );
  };

  const toggleMilestone = (index: number) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleImport = async () => {
    try {
      const text = await importTextFile();
      setDescription(text);
    } catch {
      // user cancelled file picker
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <GitBranch className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium">Task Breakdown</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Project description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the project to break down: features, technical requirements..."
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Tech Stack</label>
            <input
              type="text"
              value={techStackInput}
              onChange={(e) => setTechStackInput(e.target.value)}
              placeholder="React, NestJS, PostgreSQL (comma separated)"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || mutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-purple-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-600 disabled:opacity-50"
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <GitBranch className="h-4 w-4" />
                Task Breakdown
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
        {result && result.milestones && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => exportJsonAsPdf('ai-task-breakdown', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileDown className="h-3.5 w-3.5" /> PDF
              </button>
              <button
                type="button"
                onClick={() => exportJsonAsWord('ai-task-breakdown', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileType className="h-3.5 w-3.5" /> Word
              </button>
              <button
                type="button"
                onClick={() => exportJsonAsExcel('ai-task-breakdown', result)}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs hover:bg-muted"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
              </button>
            </div>
            <div className="text-sm font-medium text-muted-foreground">
              {result.milestones.length} milestones •{' '}
              {result.milestones.reduce((sum, m) => sum + m.tasks.length, 0)} tasks
            </div>
            {result.milestones.map((milestone, mi) => (
              <div key={mi} className="rounded-xl border border-border">
                <button
                  onClick={() => toggleMilestone(mi)}
                  className="flex w-full items-center gap-2 p-3 text-left transition-colors hover:bg-muted/50"
                >
                  {expandedMilestones.has(mi) ? (
                    <ChevronDown className="h-4 w-4 shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 shrink-0" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{milestone.title}</div>
                    <div className="text-xs text-muted-foreground">{milestone.description}</div>
                  </div>
                  <span className="shrink-0 rounded bg-muted px-2 py-0.5 text-xs">
                    {milestone.tasks.length} tasks
                  </span>
                </button>

                {expandedMilestones.has(mi) && (
                  <div className="border-t border-border divide-y divide-border">
                    {milestone.tasks.map((task, ti) => (
                      <div key={ti} className="flex items-start gap-3 p-3 pl-9">
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-medium">{task.title}</div>
                          <div className="text-xs text-muted-foreground">{task.description}</div>
                          <div className="mt-1 flex flex-wrap gap-1">
                            {task.labels?.map((label) => (
                              <span
                                key={label}
                                className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-1">
                          <span className="text-xs text-muted-foreground">
                            ~{task.estimatedHours}h
                          </span>
                          <span
                            className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[task.priority] || 'bg-gray-100'}`}
                          >
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {mutation.isError && (
          <p className="text-sm text-red-500">An error occurred. Please try again.</p>
        )}
      </div>
    </div>
  );
}
