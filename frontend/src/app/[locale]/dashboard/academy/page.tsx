import { setRequestLocale } from 'next-intl/server';
import { DashboardHeader } from '@/components/dashboard/header';
import { AcademyWorkspace } from '@/components/dashboard/academy/academy-workspace';

/**
 * Pattern: RSC wrapper — page chrome on the server, interactive authoring
 * client-side. Dashboard routes are gated and not indexed (no metadata).
 */
export default async function DashboardAcademyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <DashboardHeader title="Academy" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-6">
          <p className="text-sm text-muted-foreground">
            Author AI-usage Playbooks, publish them, then deliver each one to the
            right clients and track their progress.
          </p>
        </div>
        <AcademyWorkspace />
      </main>
    </>
  );
}
