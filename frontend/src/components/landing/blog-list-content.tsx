'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CalendarDays, Tag } from 'lucide-react';
import { useBlogPosts } from '@/hooks/use-blog';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import {
  BrandContainer,
  BrandHeroContainer,
  BrandSection,
  BrandSurface,
} from '@/components/brand/brand-primitives';
import type { BlogPost } from '@/types';

// ─── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function BlogCard({ post, locale }: { post: BlogPost; locale: string }) {
  const coverUrl = post.coverImageUrl
    ? resolveBackendAssetUrl(post.coverImageUrl) ?? post.coverImageUrl
    : null;
  const href = locale === 'vi' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;

  return (
    <BrandSurface className="group flex flex-col overflow-hidden rounded-xl transition-all hover:border-primary/30 hover:shadow-lg">
      {/* Cover image */}
      <Link href={href} className="block">
        <div className="flex h-48 items-center justify-center overflow-hidden bg-gradient-to-br from-primary/10 to-accent/10">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform group-hover:scale-105"
            />
          ) : (
            <span className="text-4xl opacity-20">✍️</span>
          )}
        </div>
      </Link>

      {/* Body */}
      <div className="flex flex-1 flex-col p-6">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {post.tags.slice(0, 3).map((tag) => (
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
        <Link href={href}>
          <h2 className="text-lg font-semibold leading-snug transition-colors group-hover:text-primary">
            {post.title}
          </h2>
        </Link>

        {/* Excerpt */}
        {post.excerpt && (
          <p className="tts-brand-body mt-2 line-clamp-3 flex-1 text-sm">{post.excerpt}</p>
        )}

        {/* Date */}
        {post.publishedAt && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          </div>
        )}
      </div>
    </BrandSurface>
  );
}

function Pagination({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
}) {
  const totalPages = Math.ceil(total / pageSize);
  if (totalPages <= 1) return null;

  return (
    <div className="mt-12 flex items-center justify-center gap-2">
      <button
        onClick={() => onPage(page - 1)}
        disabled={page <= 1}
        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        ←
      </button>
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <button
          key={p}
          onClick={() => onPage(p)}
          className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
            p === page
              ? 'bg-primary text-primary-foreground'
              : 'border border-border hover:bg-muted'
          }`}
        >
          {p}
        </button>
      ))}
      <button
        onClick={() => onPage(page + 1)}
        disabled={page >= totalPages}
        className="rounded-full border border-border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
      >
        →
      </button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────

export function BlogListContent() {
  const locale = useLocale();
  const t = useTranslations('blog');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError } = useBlogPosts(page);

  return (
    <div>
      {/* Hero */}
      <BrandSection className="tts-brand-grid bg-linear-to-br from-background via-background to-primary/5">
        <BrandHeroContainer>
          <h1 className="tts-landing-display text-4xl font-bold tracking-tight sm:text-5xl">
            {t('hero.title')}{' '}
            <span className="text-primary">{t('hero.titleHighlight')}</span>
          </h1>
          <p className="tts-brand-body mt-6 text-lg leading-8">{t('hero.subtitle')}</p>
        </BrandHeroContainer>
      </BrandSection>

      {/* Posts grid */}
      <BrandSection>
        <BrandContainer>
          {isLoading && (
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          )}

          {isError && (
            <BrandSurface className="rounded-xl border-dashed p-10 text-center">
              <p className="tts-brand-body text-sm">{t('loadError')}</p>
            </BrandSurface>
          )}

          {!isLoading && !isError && data?.items.length === 0 && (
            <BrandSurface className="rounded-xl border-dashed p-10 text-center">
              <p className="tts-brand-body text-sm">{t('empty')}</p>
            </BrandSurface>
          )}

          {!isLoading && data && data.items.length > 0 && (
            <>
              <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {data.items.map((post) => (
                  <BlogCard key={post.id} post={post} locale={locale} />
                ))}
              </div>
              <Pagination
                page={page}
                total={data.total}
                pageSize={data.pageSize}
                onPage={setPage}
              />
            </>
          )}
        </BrandContainer>
      </BrandSection>
    </div>
  );
}
