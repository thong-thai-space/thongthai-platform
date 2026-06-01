'use client';

import { useState } from 'react';
import { useClients } from '@/hooks/use-clients';
import { RagDocumentList } from './rag-document-list';
import { RagIngestForm } from './rag-ingest-form';
import { RagQueryPanel } from './rag-query-panel';

/**
 * Pattern: Client Island — composition root for the knowledge base. Every RAG
 * call is tenant-scoped, so a client must be selected before anything renders.
 */
export function RagWorkspace() {
  const { data: clients, isLoading, isError } = useClients();
  const [clientId, setClientId] = useState('');

  return (
    <div className="space-y-6">
      {/* Client picker */}
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">Client</label>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading clients…</p>
        ) : isError ? (
          <p className="text-sm text-destructive">Could not load clients.</p>
        ) : (
          <select
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full max-w-sm rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          >
            <option value="">— Select a client —</option>
            {(clients ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.email})
              </option>
            ))}
          </select>
        )}
      </div>

      {clientId && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Left: documents + ingest */}
          <div className="space-y-4">
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Documents</h2>
              <RagDocumentList clientId={clientId} />
            </section>
            <section className="space-y-3">
              <h2 className="text-sm font-semibold">Add a document</h2>
              <RagIngestForm clientId={clientId} />
            </section>
          </div>

          {/* Right: ask + review */}
          <section className="space-y-3">
            <h2 className="text-sm font-semibold">Ask &amp; review</h2>
            <RagQueryPanel clientId={clientId} />
          </section>
        </div>
      )}
    </div>
  );
}
