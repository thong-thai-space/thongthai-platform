'use client';

import { Plus } from 'lucide-react';
import type { Playbook, PlaybookStatus } from '@/types';

const STATUS_TONE: Record<PlaybookStatus, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

const FILTERS: { value: PlaybookStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Drafts' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'ARCHIVED', label: 'Archived' },
];

/**
 * Pattern: Presentational — the playbook picker. Selection + filter state lives
 * in the parent workspace; this only renders and emits.
 */
export function PlaybookList({
  items,
  isLoading,
  selectedId,
  filter,
  onFilter,
  onSelect,
  onNew,
}: {
  items: Playbook[];
  isLoading: boolean;
  selectedId: string | null;
  filter: PlaybookStatus | 'ALL';
  onFilter: (f: PlaybookStatus | 'ALL') => void;
  onSelect: (id: string) => void;
  onNew: () => void;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => onFilter(f.value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                filter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onNew}
          className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-3.5 w-3.5" /> New
        </button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading playbooks…</p>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
          No playbooks yet. Create one to start building your training library.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {items.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                  selectedId === p.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/40'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{p.title}</span>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[p.status]}`}
                  >
                    {p.status}
                  </span>
                </div>
                {p.summary && (
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {p.summary}
                  </p>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
