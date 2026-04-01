'use client';

import { useState } from 'react';
import { ChevronDown, ChevronRight, FileDown, FileType, FileSpreadsheet } from 'lucide-react';
import type { TaskBreakdownResponse } from '@/hooks/use-ai';
import {
  exportJsonAsExcel,
  exportJsonAsPdf,
  exportJsonAsWord,
} from '@/lib/file-export';

const priorityColors: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-600',
  MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600',
  URGENT: 'bg-red-100 text-red-600',
};

interface AiTaskBreakdownResultProps {
  result: TaskBreakdownResponse | null;
}

/**
 * Pattern: Component Composition
 * Extracted result display section from main component
 */
export function AiTaskBreakdownResult({ result }: AiTaskBreakdownResultProps) {
  const [expandedMilestones, setExpandedMilestones] = useState<Set<number>>(new Set());

  if (!result || !result.milestones) {
    return null;
  }

  const toggleMilestone = (index: number) => {
    setExpandedMilestones((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
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
  );
}
