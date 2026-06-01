'use client';

import { useState } from 'react';
import { Loader2, Save, Send, Trash2, Undo2, Archive } from 'lucide-react';
import {
  useCreatePlaybook,
  useDeletePlaybook,
  usePlaybookLifecycle,
  useUpdatePlaybook,
} from '@/hooks/use-academy';
import { extractApiErrorMessage } from '@/lib/api-error';
import type { Playbook } from '@/types';

const FIELD =
  'w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary';

/** Converts a Vietnamese/English title into a URL-safe slug. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

interface Draft {
  title: string;
  slug: string;
  summary: string;
  tags: string;
  contentMdx: string;
}

function toDraft(p: Playbook | null): Draft {
  return {
    title: p?.title ?? '',
    slug: p?.slug ?? '',
    summary: p?.summary ?? '',
    tags: p?.tags.join(', ') ?? '',
    contentMdx: p?.contentMdx ?? '',
  };
}

/**
 * Pattern: Client Island — create/edit a playbook and drive its publish
 * lifecycle. A playbook must be PUBLISHED before it can be assigned (the
 * backend enforces this), so the publish button is the gate to delivery.
 */
export function PlaybookEditor({
  playbook,
  onCreated,
  onDeleted,
}: {
  playbook: Playbook | null;
  onCreated: (id: string) => void;
  onDeleted: () => void;
}) {
  // The parent keys this component by playbook id, so it remounts (and re-seeds
  // from these initializers) whenever the selection changes — no effect needed.
  const [draft, setDraft] = useState<Draft>(toDraft(playbook));
  const [slugTouched, setSlugTouched] = useState(!!playbook);

  const create = useCreatePlaybook();
  const update = useUpdatePlaybook(playbook?.id ?? '');
  const lifecycle = usePlaybookLifecycle(playbook?.id ?? '');
  const remove = useDeletePlaybook();

  const busy =
    create.isPending ||
    update.isPending ||
    lifecycle.isPending ||
    remove.isPending;
  const error =
    create.error ?? update.error ?? lifecycle.error ?? remove.error;

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));

  const handleTitle = (title: string) =>
    set({ title, ...(slugTouched ? {} : { slug: toSlug(title) }) });

  const payload = () => ({
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    summary: draft.summary.trim() || undefined,
    contentMdx: draft.contentMdx,
    tags: draft.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
  });

  const handleSave = () => {
    if (busy) return;
    if (playbook) {
      update.mutate(payload());
    } else {
      create.mutate(payload(), { onSuccess: (p) => onCreated(p.id) });
    }
  };

  const canSave = !!draft.title.trim() && !!draft.slug.trim() && !!draft.contentMdx.trim();

  return (
    <div className="space-y-4 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">
          {playbook ? 'Edit playbook' : 'New playbook'}
        </h3>
        {playbook && (
          <span className="text-xs text-muted-foreground">{playbook.status}</span>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Title</label>
          <input
            className={FIELD}
            value={draft.title}
            maxLength={200}
            onChange={(e) => handleTitle(e.target.value)}
            placeholder="e.g. Marketing AI Playbook"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Slug</label>
          <input
            className={FIELD}
            value={draft.slug}
            maxLength={200}
            onChange={(e) => {
              setSlugTouched(true);
              set({ slug: e.target.value });
            }}
            placeholder="marketing-ai-playbook"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Summary (optional)
        </label>
        <input
          className={FIELD}
          value={draft.summary}
          maxLength={500}
          onChange={(e) => set({ summary: e.target.value })}
          placeholder="One line describing what this playbook covers"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Tags (comma-separated)
        </label>
        <input
          className={FIELD}
          value={draft.tags}
          onChange={(e) => set({ tags: e.target.value })}
          placeholder="marketing, prompts, sop"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground">
          Content (Markdown)
        </label>
        <textarea
          className={`${FIELD} font-mono`}
          rows={12}
          value={draft.contentMdx}
          onChange={(e) => set({ contentMdx: e.target.value })}
          placeholder="# Section 1&#10;Prompt templates, SOPs, step-by-step guidance…"
        />
      </div>

      {error && (
        <p className="text-xs text-destructive">{extractApiErrorMessage(error)}</p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || !canSave}
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {playbook ? 'Save' : 'Create'}
        </button>

        {playbook && playbook.status !== 'PUBLISHED' && (
          <button
            type="button"
            onClick={() => lifecycle.mutate('publish')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-sm font-medium text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
          >
            <Send className="h-4 w-4" /> Publish
          </button>
        )}
        {playbook && playbook.status === 'PUBLISHED' && (
          <button
            type="button"
            onClick={() => lifecycle.mutate('unpublish')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
          >
            <Undo2 className="h-4 w-4" /> Unpublish
          </button>
        )}
        {playbook && playbook.status !== 'ARCHIVED' && (
          <button
            type="button"
            onClick={() => lifecycle.mutate('archive')}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
          >
            <Archive className="h-4 w-4" /> Archive
          </button>
        )}
        {playbook && (
          <button
            type="button"
            onClick={() => {
              if (confirm('Delete this playbook? This cannot be undone.')) {
                remove.mutate(playbook.id, { onSuccess: onDeleted });
              }
            }}
            disabled={busy}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-3 py-1.5 text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-4 w-4" /> Delete
          </button>
        )}
      </div>
    </div>
  );
}
