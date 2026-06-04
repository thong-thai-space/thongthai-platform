'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { ArrowLeft, CalendarDays, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { useBlogPost } from '@/hooks/use-blog';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import {
  BrandContainer,
  BrandSection,
} from '@/components/brand/brand-primitives';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BlogPostContent({ slug }: { slug: string }) {
  const locale = useLocale();
  const t = useTranslations('blog');
  const { data: post, isLoading, isError } = useBlogPost(slug);

  const backHref = locale === 'vi' ? '/#blog' : `/${locale}#blog`;

  if (isLoading) {
    return (
      <BrandSection>
        <BrandContainer className="max-w-3xl">
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-muted" />
            <div className="mt-8 space-y-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className={`h-4 animate-pulse rounded bg-muted ${i % 5 === 4 ? 'w-2/3' : 'w-full'}`} />
              ))}
            </div>
          </div>
        </BrandContainer>
      </BrandSection>
    );
  }

  if (isError || !post) {
    return (
      <BrandSection>
        <BrandContainer className="max-w-3xl text-center">
          <p className="tts-brand-body">{t('notFound')}</p>
          <Link
            href={backHref}
            className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToBlog')}
          </Link>
        </BrandContainer>
      </BrandSection>
    );
  }

  const coverUrl = post.coverImageUrl
    ? resolveBackendAssetUrl(post.coverImageUrl) ?? post.coverImageUrl
    : null;

  return (
    <BrandSection>
      <BrandContainer className="max-w-3xl">
        {/* Back link */}
        <Link
          href={backHref}
          className="mb-8 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('backToBlog')}
        </Link>

        {/* Cover image */}
        {coverUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt={post.title}
            className="mb-8 h-64 w-full rounded-xl object-cover sm:h-80"
          />
        )}

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
              >
                <Tag className="h-2.5 w-2.5" />
                {tag}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h1 className="tts-landing-display text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>

        {/* Date */}
        {post.publishedAt && (
          <div className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-4 w-4" />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          </div>
        )}

        {/* Excerpt */}
        {post.excerpt && (
          <p className="tts-brand-body mt-4 text-lg leading-relaxed text-muted-foreground">
            {post.excerpt}
          </p>
        )}

        {/* Divider */}
        <hr className="my-8 border-border" />

        {/* Content — Pattern: render stored Markdown via react-markdown */}
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <ReactMarkdown>{post.contentMdx}</ReactMarkdown>
        </div>

        {/* Footer back link */}
        <div className="mt-12 border-t border-border pt-8">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToBlog')}
          </Link>
        </div>
      </BrandContainer>
    </BrandSection>
  );
}
