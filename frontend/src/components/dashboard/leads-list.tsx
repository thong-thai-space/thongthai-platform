'use client';

import { useState } from 'react';
import {
  LEAD_ALLOWED_NEXT,
  type Lead,
  type LeadStatus,
  useLeads,
  useUpdateLeadStatus,
} from '@/hooks/use-leads';

const STATUS_FILTERS: { value: LeadStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'NEW', label: 'New' },
  { value: 'REVIEWED', label: 'Reviewed' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'CONVERTED', label: 'Converted' },
  { value: 'CLOSED', label: 'Closed' },
];

const STATUS_TONE: Record<LeadStatus, string> = {
  NEW: 'bg-blue-500/15 text-blue-600',
  REVIEWED: 'bg-amber-500/15 text-amber-600',
  CONTACTED: 'bg-purple-500/15 text-purple-600',
  CONVERTED: 'bg-emerald-500/15 text-emerald-600',
  CLOSED: 'bg-zinc-500/15 text-zinc-500',
};

/**
 * Pattern: Client Island — only the interactive parts of the leads admin
 * view live in this component. The route page.tsx renders metadata and
 * the page chrome on the server.
 */
export function LeadsList() {
  const [filter, setFilter] = useState<LeadStatus | 'ALL'>('ALL');
  const query = useLeads({
    status: filter === 'ALL' ? undefined : filter,
    pageSize: 50,
  });
  const mutation = useUpdateLeadStatus();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              'rounded-full px-3 py-1 text-xs font-medium transition-colors ' +
              (filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70')
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {query.isLoading && (
        <p className="text-sm text-muted-foreground">Loading leads…</p>
      )}
      {query.isError && (
        <p className="text-sm text-destructive">
          Could not load leads. Try again later.
        </p>
      )}
      {query.data && query.data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">No leads found.</p>
      )}

      {query.data && query.data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Service / Budget</th>
                <th className="px-4 py-3">Message</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Next</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {query.data.items.map((lead) => (
                <LeadRow
                  key={lead.id}
                  lead={lead}
                  pending={mutation.isPending}
                  onAdvance={(next) =>
                    mutation.mutate({ id: lead.id, status: next })
                  }
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {query.data && (
        <p className="text-xs text-muted-foreground">
          {query.data.items.length} of {query.data.total} leads
        </p>
      )}
      {mutation.isError && (
        <p className="text-xs text-destructive">
          Status update failed. The lead may already be in that state, or the
          transition is not allowed.
        </p>
      )}
    </div>
  );
}

function LeadRow({
  lead,
  pending,
  onAdvance,
}: {
  lead: Lead;
  pending: boolean;
  onAdvance: (next: LeadStatus) => void;
}) {
  const allowedNext = LEAD_ALLOWED_NEXT[lead.status];

  return (
    <tr className="align-top">
      <td className="px-4 py-3">
        <div className="font-medium text-foreground">{lead.name}</div>
        <div className="text-xs text-muted-foreground">
          <a href={`mailto:${lead.email}`} className="hover:underline">
            {lead.email}
          </a>
        </div>
        {lead.phone && (
          <div className="text-xs text-muted-foreground">{lead.phone}</div>
        )}
        {lead.company && (
          <div className="text-xs text-muted-foreground">{lead.company}</div>
        )}
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <div>{lead.service ?? '—'}</div>
        <div>{lead.budget ?? '—'}</div>
        <div className="mt-1 text-[10px] uppercase tracking-wide">
          {new Date(lead.createdAt).toLocaleDateString()}
        </div>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        <p className="line-clamp-4 max-w-md whitespace-pre-wrap">
          {lead.message}
        </p>
      </td>
      <td className="px-4 py-3">
        <span
          className={
            'inline-flex rounded-full px-2 py-0.5 text-xs font-medium ' +
            STATUS_TONE[lead.status]
          }
        >
          {lead.status}
        </span>
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-wrap gap-1">
          {allowedNext.length === 0 ? (
            <span className="text-xs text-muted-foreground">—</span>
          ) : (
            allowedNext.map((next) => (
              <button
                key={next}
                type="button"
                onClick={() => onAdvance(next)}
                disabled={pending}
                className="rounded border border-border bg-background px-2 py-0.5 text-xs hover:bg-muted disabled:opacity-50"
              >
                {next}
              </button>
            ))
          )}
        </div>
      </td>
    </tr>
  );
}
