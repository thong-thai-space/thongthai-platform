import { setRequestLocale } from 'next-intl/server';
import { BlogPostEditor } from '@/components/dashboard/blog-post-editor';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardBlogNewPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeader title="New Blog Post" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BlogPostEditor />
      </div>
    </>
  );
}
