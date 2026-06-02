'use client';

import { useRef, useState } from 'react';
import { FileUp, Loader2, Plus } from 'lucide-react';
import { useIngestText, useUploadDocument } from '@/hooks/use-rag';
import { extractApiErrorMessage } from '@/lib/api-error';

type Mode = 'upload' | 'text';

const ACCEPT = '.pdf,.docx,.txt,.md';

/**
 * Pattern: Client Island — adds a document to the selected client's knowledge
 * base, either by uploading a file (PDF/DOCX/TXT/MD) or pasting raw text.
 */
export function RagIngestForm({ clientId }: { clientId: string }) {
  const [mode, setMode] = useState<Mode>('upload');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const upload = useUploadDocument();
  const ingestText = useIngestText();
  const busy = upload.isPending || ingestText.isPending;

  const reset = () => {
    setTitle('');
    setText('');
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId || busy) return;

    if (mode === 'upload') {
      if (!file) return;
      upload.mutate(
        { clientId, file, title },
        { onSuccess: reset },
      );
    } else {
      if (!title.trim() || !text.trim()) return;
      ingestText.mutate(
        { clientId, title: title.trim(), text: text.trim() },
        { onSuccess: reset },
      );
    }
  };

  const error = upload.error ?? ingestText.error;
  const lastResult = upload.data ?? ingestText.data;
  const canSubmit =
    !!clientId &&
    !busy &&
    (mode === 'upload' ? !!file : !!title.trim() && !!text.trim());

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-lg border border-border p-4"
    >
      <div className="flex gap-1.5">
        {(['upload', 'text'] as Mode[]).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              mode === m
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/70'
            }`}
          >
            {m === 'upload' ? 'Upload file' : 'Paste text'}
          </button>
        ))}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Title {mode === 'upload' && '(optional — defaults to filename)'}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={300}
          placeholder="e.g. Onboarding Guide"
          className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {mode === 'upload' ? (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            File (PDF, DOCX, TXT, MD)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept={ACCEPT}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-md file:border file:border-border file:bg-muted file:px-3 file:py-1.5 file:text-sm file:font-medium hover:file:bg-muted/70"
          />
        </div>
      ) : (
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">
            Content
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            placeholder="Paste the document text here…"
            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-destructive">
          {extractApiErrorMessage(error)}
        </p>
      )}
      {lastResult && !busy && (
        <p className="text-xs text-emerald-600 dark:text-emerald-400">
          Ingested — {lastResult.chunkCount} chunk
          {lastResult.chunkCount === 1 ? '' : 's'} indexed.
        </p>
      )}

      <button
        type="submit"
        disabled={!canSubmit}
        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : mode === 'upload' ? (
          <FileUp className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {busy ? 'Ingesting…' : 'Add to knowledge base'}
      </button>
    </form>
  );
}
