'use client';

import { ArrowLeft, Check, Loader2, Play } from 'lucide-react';
import { useMyPlaybook, useUpdateProgress } from '@/hooks/use-academy';
import { MarkdownContent } from '@/components/ui/markdown-content';
import { extractApiErrorMessage } from '@/lib/api-error';
import type { PlaybookAssignmentStatus } from '@/types';

const STATUS_TONE: Record<PlaybookAssignmentStatus, string> = {
  ASSIGNED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

/**
 * Pattern: Client Island — reads one assigned playbook and lets the client move
 * it through ASSIGNED → IN_PROGRESS → COMPLETED. The fetch is tenant-scoped
 * server-side, so this only ever shows the signed-in client's own content.
 */
export function PlaybookReader({
  assignmentId,
  onBack,
}: {
  assignmentId: string;
  onBack: () => void;
}) {
  const { data, isLoading, isError, error } = useMyPlaybook(assignmentId);
  const progress = useUpdateProgress(assignmentId);

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All playbooks
      </button>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">{extractApiErrorMessage(error)}</p>
      ) : !data ? null : (
        <article className="space-y-4 rounded-lg border border-border p-6">
          <header className="space-y-2 border-b border-border pb-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-xl font-semibold">{data.playbook.title}</h1>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_TONE[data.status]}`}
              >
                {data.status.replace('_', ' ')}
              </span>
            </div>
            {data.playbook.summary && (
              <p className="text-sm text-muted-foreground">
                {data.playbook.summary}
              </p>
            )}
            {data.playbook.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {data.playbook.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground"
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}
          </header>

          <MarkdownContent
            content={data.playbook.contentMdx}
            className="text-sm leading-relaxed"
          />

          {progress.isError && (
            <p className="text-xs text-destructive">
              {extractApiErrorMessage(progress.error)}
            </p>
          )}

          {data.status !== 'COMPLETED' && (
            <div className="flex items-center gap-2 border-t border-border pt-4">
              {data.status === 'ASSIGNED' && (
                <button
                  type="button"
                  onClick={() => progress.mutate('START')}
                  disabled={progress.isPending}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/40 bg-sky-500/10 px-3 py-1.5 text-sm font-medium text-sky-700 hover:bg-sky-500/20 disabled:opacity-50 dark:text-sky-400"
                >
                  <Play className="h-4 w-4" /> Start
                </button>
              )}
              <button
                type="button"
                onClick={() => progress.mutate('COMPLETE')}
                disabled={progress.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {progress.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Mark complete
              </button>
            </div>
          )}
        </article>
      )}
    </div>
  );
}
