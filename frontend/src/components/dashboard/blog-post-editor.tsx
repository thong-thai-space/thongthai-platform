'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { ArrowLeft, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import {
  useAdminBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  usePublishBlogPost,
  useUnpublishBlogPost,
} from '@/hooks/use-blog';
import type { BlogPost } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

/** Converts a Vietnamese/English title into a URL-safe slug. */
function toSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[àáạảãâầấậẩẫăằắặẳẵ]/g, 'a')
    .replace(/[èéẹẻẽêềếệểễ]/g, 'e')
    .replace(/[ìíịỉĩ]/g, 'i')
    .replace(/[òóọỏõôồốộổỗơờớợởỡ]/g, 'o')
    .replace(/[ùúụủũưừứựửữ]/g, 'u')
    .replace(/[ỳýỵỷỹ]/g, 'y')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const FIELD =
  'w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary';

// ─── Form state ────────────────────────────────────────────────────────────────

interface DraftState {
  title: string;
  slug: string;
  locale: 'VI' | 'EN';
  excerpt: string;
  tags: string; // comma-separated
  coverImageUrl: string;
  contentMdx: string;
}

function postToDraft(post: BlogPost): DraftState {
  return {
    title: post.title,
    slug: post.slug,
    locale: post.locale as 'VI' | 'EN',
    excerpt: post.excerpt ?? '',
    tags: post.tags.join(', '),
    coverImageUrl: post.coverImageUrl ?? '',
    contentMdx: post.contentMdx,
  };
}

const EMPTY_DRAFT: DraftState = {
  title: '',
  slug: '',
  locale: 'VI',
  excerpt: '',
  tags: '',
  coverImageUrl: '',
  contentMdx: '',
};

// ─── Editor component ──────────────────────────────────────────────────────────

/**
 * Pattern: Client Island — full create/edit form for a blog post.
 * `postId` undefined → create mode; defined → edit mode.
 */
export function BlogPostEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const isEdit = !!postId;

  // Fetch existing post in edit mode
  const { data: existing, isLoading: loadingPost } = useAdminBlogPost(postId ?? '');

  // Mutations
  const createPost = useCreateBlogPost();
  const updatePost = useUpdateBlogPost(postId ?? '');
  const publishPost = usePublishBlogPost();
  const unpublishPost = useUnpublishBlogPost();

  // Local form state
  const [draft, setDraft] = useState<DraftState>(EMPTY_DRAFT);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  // Populate form when existing post loads
  useEffect(() => {
    if (existing) {
      setDraft(postToDraft(existing));
      setSlugManuallyEdited(true); // don't auto-overwrite slug from existing post
    }
  }, [existing]);

  // Auto-generate slug from title (create mode only, until user edits slug)
  const handleTitleChange = (value: string) => {
    setDraft((d) => ({
      ...d,
      title: value,
      slug: slugManuallyEdited ? d.slug : toSlug(value),
    }));
  };

  const set = (key: keyof DraftState, value: string) =>
    setDraft((d) => ({ ...d, [key]: value }));

  // ─── Submit ──────────────────────────────────────────────────────────────────

  const buildPayload = () => ({
    title: draft.title.trim(),
    slug: draft.slug.trim(),
    locale: draft.locale,
    excerpt: draft.excerpt.trim() || undefined,
    tags: draft.tags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    coverImageUrl: draft.coverImageUrl.trim() || undefined,
    contentMdx: draft.contentMdx,
  });

  const handleSaveDraft = async () => {
    if (!draft.title.trim() || !draft.slug.trim()) return;
    if (isEdit) {
      await updatePost.mutateAsync(buildPayload());
    } else {
      const created = await createPost.mutateAsync({ ...buildPayload(), locale: draft.locale });
      router.replace(`/dashboard/blog/${created.id}`);
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handlePublish = async () => {
    if (!postId) return;
    await publishPost.mutateAsync(postId);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleUnpublish = async () => {
    if (!postId) return;
    await unpublishPost.mutateAsync(postId);
  };

  const isSaving =
    createPost.isPending ||
    updatePost.isPending ||
    publishPost.isPending ||
    unpublishPost.isPending;

  const saveError =
    createPost.error || updatePost.error || publishPost.error || unpublishPost.error;

  const currentStatus = existing?.status;

  // ─── Loading ──────────────────────────────────────────────────────────────────

  if (isEdit && loadingPost) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-full flex-col gap-4 p-6">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/blog"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            All posts
          </Link>
          {currentStatus && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                currentStatus === 'PUBLISHED'
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
              }`}
            >
              {currentStatus}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Preview toggle */}
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {showPreview ? 'Hide preview' : 'Preview'}
          </button>

          {/* Save draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving || !draft.title.trim() || !draft.slug.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm hover:bg-muted disabled:opacity-50"
          >
            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {isSaving ? 'Saving…' : saved ? '✓ Saved' : 'Save draft'}
          </button>

          {/* Publish / Unpublish (edit mode only) */}
          {isEdit && currentStatus === 'DRAFT' && (
            <button
              type="button"
              onClick={handlePublish}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              <Eye className="h-4 w-4" /> Publish
            </button>
          )}
          {isEdit && currentStatus === 'PUBLISHED' && (
            <button
              type="button"
              onClick={handleUnpublish}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-1.5 text-sm text-amber-700 hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-400"
            >
              <EyeOff className="h-4 w-4" /> Unpublish
            </button>
          )}
        </div>
      </div>

      {saveError && (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {(saveError as { message?: string })?.message ?? 'Save failed. Check the slug is unique.'}
        </p>
      )}

      {/* Metadata fields */}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Title *</span>
          <input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Post title"
            className={FIELD}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Slug *</span>
          <input
            value={draft.slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              set('slug', e.target.value);
            }}
            placeholder="url-friendly-slug"
            className={`${FIELD} font-mono`}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Locale</span>
          <select
            value={draft.locale}
            onChange={(e) => set('locale', e.target.value)}
            className={FIELD}
          >
            <option value="VI">Tiếng Việt (VI)</option>
            <option value="EN">English (EN)</option>
          </select>
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Excerpt</span>
          <textarea
            value={draft.excerpt}
            onChange={(e) => set('excerpt', e.target.value)}
            rows={2}
            placeholder="Short description shown on the blog list card"
            className={FIELD}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Tags (comma-separated)</span>
          <input
            value={draft.tags}
            onChange={(e) => set('tags', e.target.value)}
            placeholder="nestjs, ai, tutorial"
            className={FIELD}
          />
        </label>

        <label className="space-y-1.5">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Cover image URL</span>
          <input
            value={draft.coverImageUrl}
            onChange={(e) => set('coverImageUrl', e.target.value)}
            placeholder="https://..."
            className={FIELD}
          />
        </label>
      </div>

      {/* Content editor — split or single pane */}
      <div className={`flex flex-1 gap-4 overflow-hidden ${showPreview ? 'min-h-[400px]' : ''}`}>
        {/* Markdown input */}
        <div className={`flex flex-col ${showPreview ? 'w-1/2' : 'w-full'}`}>
          <span className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Content (Markdown)
          </span>
          <textarea
            value={draft.contentMdx}
            onChange={(e) => set('contentMdx', e.target.value)}
            placeholder="Write your post content in Markdown…"
            className="flex-1 resize-none rounded-lg border border-border bg-background p-3 font-mono text-sm leading-relaxed focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            style={{ minHeight: 320 }}
          />
        </div>

        {/* Markdown preview */}
        {showPreview && (
          <div className="flex w-1/2 flex-col">
            <span className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Preview
            </span>
            <div className="prose prose-slate dark:prose-invert flex-1 overflow-y-auto rounded-lg border border-border bg-background p-4 text-sm">
              {draft.contentMdx ? (
                <ReactMarkdown>{draft.contentMdx}</ReactMarkdown>
              ) : (
                <p className="text-muted-foreground italic">Nothing to preview yet.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
