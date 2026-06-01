'use client';

import { useState } from 'react';
import { Loader2, UserPlus, X } from 'lucide-react';
import {
  useAssignPlaybook,
  usePlaybookAssignees,
  useUnassignPlaybook,
} from '@/hooks/use-academy';
import { useClients } from '@/hooks/use-clients';
import { extractApiErrorMessage } from '@/lib/api-error';
import type { Playbook, PlaybookAssignmentStatus } from '@/types';

const STATUS_TONE: Record<PlaybookAssignmentStatus, string> = {
  ASSIGNED: 'bg-muted text-muted-foreground',
  IN_PROGRESS: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
  COMPLETED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

/**
 * Pattern: Client Island — delivers a published playbook to clients and shows
 * each client's progress. Only published playbooks can be assigned.
 */
export function PlaybookAssignees({ playbook }: { playbook: Playbook }) {
  const [clientId, setClientId] = useState('');
  const { data: clients } = useClients();
  const { data: assignees, isLoading } = usePlaybookAssignees(playbook.id);
  const assign = useAssignPlaybook(playbook.id);
  const unassign = useUnassignPlaybook(playbook.id);

  const published = playbook.status === 'PUBLISHED';

  const handleAssign = () => {
    if (!clientId || assign.isPending) return;
    assign.mutate(clientId, { onSuccess: () => setClientId('') });
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <h3 className="text-sm font-semibold">Delivery</h3>

      {!published ? (
        <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
          Publish this playbook to start assigning it to clients.
        </p>
      ) : (
        <div className="flex gap-2">
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">— Select a client —</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleAssign}
            disabled={!clientId || assign.isPending}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {assign.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            Assign
          </button>
        </div>
      )}

      {assign.isError && (
        <p className="text-xs text-destructive">
          {extractApiErrorMessage(assign.error)}
        </p>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading assignees…</p>
      ) : (assignees ?? []).length === 0 ? (
        <p className="text-xs text-muted-foreground">Not delivered to anyone yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-md border border-border">
          {(assignees ?? []).map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between gap-2 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{a.client.name}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {a.client.email}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${STATUS_TONE[a.status]}`}
                >
                  {a.status.replace('_', ' ')}
                </span>
                <button
                  type="button"
                  onClick={() => unassign.mutate(a.id)}
                  disabled={unassign.isPending}
                  title="Remove"
                  className="rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
