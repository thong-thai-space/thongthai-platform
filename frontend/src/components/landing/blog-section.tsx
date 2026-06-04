'use client';

import Link from 'next/link';
import { CalendarDays, Tag } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useBlogPosts } from '@/hooks/use-blog';
import { resolveBackendAssetUrl } from '@/lib/asset-url';
import { MotionCard, MotionReveal, MotionSection } from '@/components/motion/motion-primitives';
import type { BlogPost } from '@/types';

// Home now owns the only blog index, so this section shows the latest few posts;
// individual posts still live at /blog/[slug].
const MAX_POSTS = 6;

function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(dateStr));
}

function BlogCard({ post, locale, delay }: { post: BlogPost; locale: string; delay: number }) {
  const coverUrl = post.coverImageUrl
    ? resolveBackendAssetUrl(post.coverImageUrl) ?? post.coverImageUrl
    : null;
  const href = locale === 'vi' ? `/blog/${post.slug}` : `/${locale}/blog/${post.slug}`;

  return (
    <MotionCard
      delay={delay}
      className="tts-brand-surface group flex flex-col overflow-hidden rounded-2xl transition-all hover:border-primary/35 hover:shadow-[0_22px_55px_-30px_rgba(37,99,235,0.45)]"
    >
      <Link href={href} className="block">
        <div className="flex h-48 items-center justify-center overflow-hidden bg-linear-to-br from-primary/10 to-accent/10">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt={post.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <span className="text-4xl opacity-20">✍️</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-6">
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

        <Link href={href}>
          <h3 className="text-lg font-semibold leading-snug text-slate-900 transition-colors group-hover:text-primary dark:text-white">
            {post.title}
          </h3>
        </Link>

        {post.excerpt && (
          <p className="tts-brand-body mt-2 line-clamp-3 flex-1 text-sm">{post.excerpt}</p>
        )}

        {post.publishedAt && (
          <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5" />
            <time dateTime={post.publishedAt}>{formatDate(post.publishedAt, locale)}</time>
          </div>
        )}
      </div>
    </MotionCard>
  );
}

export function BlogSection() {
  const locale = useLocale();
  const t = useTranslations('blog');
  const { data, isLoading, isError } = useBlogPosts(1);
  const posts = (data?.items ?? []).slice(0, MAX_POSTS);

  return (
    <MotionSection id="blog" className="tts-landing-section relative overflow-hidden bg-linear-to-b from-white to-slate-50 py-20 sm:py-28 dark:from-slate-950 dark:to-slate-900">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-16 left-0 h-72 w-72 rounded-full bg-accent/10 blur-3xl" />
      </div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <MotionReveal className="mx-auto max-w-2xl text-center">
          <h2 className="tts-landing-title text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl dark:text-white">
            {t('hero.title')}{' '}
            <span className="text-primary">{t('hero.titleHighlight')}</span>
          </h2>
          <p className="tts-landing-subtitle mt-4 text-lg text-slate-600 dark:text-slate-300">
            {t('hero.subtitle')}
          </p>
        </MotionReveal>

        {isLoading ? (
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-80 animate-pulse rounded-2xl bg-muted" />
            ))}
          </div>
        ) : isError ? (
          <div className="mt-16 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="tts-brand-body text-sm">{t('loadError')}</p>
          </div>
        ) : posts.length === 0 ? (
          <div className="mt-16 rounded-xl border border-dashed border-border p-10 text-center">
            <p className="tts-brand-body text-sm">{t('empty')}</p>
          </div>
        ) : (
          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {posts.map((post, index) => (
              <BlogCard key={post.id} post={post} locale={locale} delay={0.08 * index} />
            ))}
          </div>
        )}
      </div>
    </MotionSection>
  );
}
