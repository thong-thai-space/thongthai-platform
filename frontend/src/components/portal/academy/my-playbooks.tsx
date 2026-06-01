'use client';

import { useState } from 'react';
import { BookOpen, ChevronRight } from 'lucide-react';
import { useMyPlaybooks } from '@/hooks/use-academy';
import type { PlaybookAssignmentStatus } from '@/types';
import { PlaybookReader } from './playbook-reader';

const STATUS_TONE: Record<PlaybookAssignmentStatus, string> = {
  ASSIGNED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

/**
 * Pattern: Client Island — the client's own Academy: a list of assigned
 * playbooks that opens into a reader. Everything is scoped server-side to the
 * signed-in client.
 */
export function MyPlaybooks() {
  const [openId, setOpenId] = useState<string | null>(null);
  const { data, isLoading, isError } = useMyPlaybooks();

  if (openId) {
    return (
      <PlaybookReader assignmentId={openId} onBack={() => setOpenId(null)} />
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading your playbooks…</p>;
  }
  if (isError) {
    return <p className="text-sm text-destructive">Could not load your playbooks.</p>;
  }
  if ((data ?? []).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
        <BookOpen className="h-8 w-8 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No playbooks have been shared with you yet.
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {(data ?? []).map((a) => (
        <li key={a.id}>
          <button
            type="button"
            onClick={() => setOpenId(a.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted/40"
          >
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">
                {a.playbook.title}
              </div>
              {a.playbook.summary && (
                <p className="mt-0.5 truncate text-xs text-muted-foreground">
                  {a.playbook.summary}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[a.status]}`}
              >
                {a.status.replace('_', ' ')}
              </span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </div>
          </button>
        </li>
      ))}
    </ul>
  );
}
