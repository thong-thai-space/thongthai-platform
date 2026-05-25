'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { useState } from 'react';
import { PenLine, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  useAdminBlogPosts,
  usePublishBlogPost,
  useUnpublishBlogPost,
  useDeleteBlogPost,
} from '@/hooks/use-blog';
import type { BlogPost, BlogPostStatus } from '@/types';

// ─── Constants ─────────────────────────────────────────────────────────────────

const STATUS_FILTERS: { value: BlogPostStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'PUBLISHED', label: 'Published' },
];

const STATUS_TONE: Record<BlogPostStatus, string> = {
  DRAFT: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  PUBLISHED: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
};

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateStr));
}

// ─── Row ───────────────────────────────────────────────────────────────────────

function PostRow({
  post,
  locale,
  onPublish,
  onUnpublish,
  onDelete,
  busy,
}: {
  post: BlogPost;
  locale: string;
  onPublish: (id: string) => void;
  onUnpublish: (id: string) => void;
  onDelete: (id: string) => void;
  busy: boolean;
}) {
  const publicHref =
    locale === 'vi' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;

  return (
    <tr className="align-middle transition-colors hover:bg-muted/30">
      <td className="px-4 py-3">
        <div className="font-medium leading-snug">{post.title}</div>
        <div className="mt-0.5 text-xs text-muted-foreground font-mono">{post.slug}</div>
        {post.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {post.tags.slice(0, 3).map((t) => (
              <span key={t} className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                {t}
              </span>
            ))}
          </div>
        )}
      </td>
      <td className="px-4 py-3 text-xs uppercase tracking-wide text-muted-foreground">
        {post.locale}
      </td>
      <td className="px-4 py-3">
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_TONE[post.status]}`}>
          {post.status}
        </span>
      </td>
      <td className="px-4 py-3 text-xs text-muted-foreground">
        {post.publishedAt ? formatDate(post.publishedAt) : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Edit */}
          <Link
            href={`/dashboard/blog/${post.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
          >
            <PenLine className="h-3 w-3" /> Edit
          </Link>

          {/* Publish / Unpublish */}
          {post.status === 'DRAFT' ? (
            <button
              type="button"
              onClick={() => onPublish(post.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-emerald-500/40 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-500/20 disabled:opacity-50 dark:text-emerald-400"
            >
              <Eye className="h-3 w-3" /> Publish
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onUnpublish(post.id)}
              disabled={busy}
              className="inline-flex items-center gap-1 rounded-md border border-amber-500/40 bg-amber-500/10 px-2 py-1 text-xs text-amber-700 hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
            >
              <EyeOff className="h-3 w-3" /> Unpublish
            </button>
          )}

          {/* Preview (published only) */}
          {post.status === 'PUBLISHED' && (
            <Link
              href={publicHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted"
            >
              <Eye className="h-3 w-3" /> View
            </Link>
          )}

          {/* Delete */}
          <button
            type="button"
            onClick={() => onDelete(post.id)}
            disabled={busy}
            className="inline-flex items-center gap-1 rounded-md border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10 disabled:opacity-50"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </td>
    </tr>
  );
}

// ─── Main list ─────────────────────────────────────────────────────────────────

/**
 * Pattern: Client Island — interactive post list with status filters and
 * inline publish/unpublish/delete actions.
 */
export function BlogPostsList() {
  const locale = useLocale();
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useAdminBlogPosts({
    page,
    pageSize: 25,
    status: statusFilter === 'ALL' ? undefined : statusFilter,
  });

  const publish = usePublishBlogPost();
  const unpublish = useUnpublishBlogPost();
  const deleteMutation = useDeleteBlogPost();
  const busy = publish.isPending || unpublish.isPending || deleteMutation.isPending;

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this post? This cannot be undone.')) return;
    deleteMutation.mutate(id);
  };

  const totalPages = data ? Math.ceil(data.total / 25) : 1;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => { setStatusFilter(f.value); setPage(1); }}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === f.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/70'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <Link
          href="/dashboard/blog/new"
          className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New post
        </Link>
      </div>

      {/* States */}
      {isLoading && <p className="text-sm text-muted-foreground">Loading posts…</p>}
      {isError && <p className="text-sm text-destructive">Could not load posts. Try again later.</p>}
      {(publish.isError || unpublish.isError) && (
        <p className="text-xs text-destructive">Action failed — post may already be in that state.</p>
      )}

      {/* Table */}
      {data && data.items.length === 0 && (
        <p className="text-sm text-muted-foreground">No posts found.</p>
      )}
      {data && data.items.length > 0 && (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Title / Slug</th>
                <th className="px-4 py-3">Locale</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.items.map((post) => (
                <PostRow
                  key={post.id}
                  post={post}
                  locale={locale}
                  onPublish={(id) => publish.mutate(id)}
                  onUnpublish={(id) => unpublish.mutate(id)}
                  onDelete={handleDelete}
                  busy={busy}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-xs text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {data && (
        <p className="text-xs text-muted-foreground">
          {data.items.length} of {data.total} posts
        </p>
      )}
    </div>
  );
}
