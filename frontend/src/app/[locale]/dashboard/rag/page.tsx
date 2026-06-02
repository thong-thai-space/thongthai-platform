import { setRequestLocale } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/header';
import { RagWorkspace } from '@/components/dashboard/rag/rag-workspace';

/**
 * Pattern: RSC wrapper — page chrome on the server, interactive knowledge base
 * client-side. No generateMetadata — dashboard routes are gated and not indexed.
 */
export default async function DashboardRagPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeader title="Knowledge Base" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Build a per-client knowledge base, then ask grounded questions. Every
            AI answer is a draft you review before it counts as delivered.
          </p>
        </div>
        <RagWorkspace />
      </main>
    </>
  );
}
