import { setRequestLocale } from 'next-intl/server';
import { BlogPostEditor } from '@/components/dashboard/blog-post-editor';
import { DashboardHeader } from '@/components/dashboard/header';

export default async function DashboardBlogEditPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeader title="Edit Blog Post" />
      <div className="flex flex-1 flex-col overflow-hidden">
        <BlogPostEditor postId={id} />
      </div>
    </>
  );
}
