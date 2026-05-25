import { setRequestLocale } from 'next-intl/server';
import { BlogPostsList } from '@/components/dashboard/blog-posts-list';
import { DashboardHeader } from '@/components/dashboard/header';

/**
 * Pattern: RSC wrapper — page chrome on the server, interactive list client-side.
 * No generateMetadata — dashboard routes are gated and not indexed.
 */
export default async function DashboardBlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeader title="Blog Posts" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Create and manage blog posts. Draft posts are invisible to the public until published.
          </p>
        </div>
        <BlogPostsList />
      </main>
    </>
  );
}
