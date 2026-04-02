'use client';

import { useBreakdownTasks } from '@/hooks/use-ai';
import { GitBranch } from 'lucide-react';
import { useState } from 'react';
import type { TaskBreakdownResponse } from '@/hooks/use-ai';
import { AiTaskBreakdownForm } from './ai-task-breakdown-form';
import { AiTaskBreakdownResult } from './ai-task-breakdown-result';

/**
 * Pattern: Component Composition
 * Main component orchestrates form and result sub-components
 */
export function AiTaskBreakdown({ initialProjectId }: { initialProjectId?: string }) {
  const [result, setResult] = useState<TaskBreakdownResponse | null>(null);
  const mutation = useBreakdownTasks();

  const handleGenerate = (description: string, techStack: string[]) => {
    mutation.mutate(
      { description, techStack },
      {
        onSuccess: (data) => {
          setResult(data);
        },
        onError: () => setResult(null),
      },
    );
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <GitBranch className="h-5 w-5 text-purple-500" />
        <span className="text-sm font-medium">Task Breakdown</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <AiTaskBreakdownForm
          onGenerate={handleGenerate}
          isPending={mutation.isPending}
          initialProjectId={initialProjectId}
        />

        {/* Result */}
        <AiTaskBreakdownResult result={result} />
      </div>
    </div>
  );
}
