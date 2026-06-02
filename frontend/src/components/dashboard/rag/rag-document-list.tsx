'use client';

import { FileText } from 'lucide-react';
import { useRagDocuments } from '@/hooks/use-rag';
import type { RagDocumentStatus } from '@/types';

const STATUS_TONE: Record<RagDocumentStatus, string> = {
  PENDING: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  PROCESSING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  INDEXED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  FAILED: 'bg-destructive/15 text-destructive',
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

/**
 * Pattern: Client Island — tenant-scoped document list. Polls (via the hook)
 * while any document is still indexing so status badges settle on their own.
 */
export function RagDocumentList({ clientId }: { clientId: string }) {
  const { data, isLoading, isError } = useRagDocuments(clientId);

  if (!clientId) {
    return (
      <p className="text-sm text-muted-foreground">
        Select a client to see their knowledge base.
      </p>
    );
  }

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading documents…</p>;
  }

  if (isError) {
    return (
      <p className="text-sm text-destructive">
        Could not load documents. Try again later.
      </p>
    );
  }

  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No documents yet. Upload a file or paste text to build this knowledge base.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Document</th>
            <th className="px-4 py-3">Status</th>
            <th className="px-4 py-3">Chunks</th>
            <th className="px-4 py-3">Added</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {data.map((doc) => (
            <tr key={doc.id} className="align-middle hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="flex items-center gap-2 font-medium leading-snug">
                  <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                  {doc.title}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[doc.status]}`}
                >
                  {doc.status}
                </span>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {doc.chunkCount}
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground">
                {formatDate(doc.createdAt)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
