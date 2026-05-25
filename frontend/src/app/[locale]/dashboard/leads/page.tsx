import { setRequestLocale } from 'next-intl/server';
import { LeadsList } from '@/components/dashboard/leads-list';

/**
 * Pattern: RSC wrapper — page chrome on the server, interactive table client-side.
 * No `generateMetadata` because /dashboard is gated and shouldn't be indexed.
 */
export default async function DashboardLeadsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="space-y-6 p-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Leads</h1>
        <p className="text-sm text-muted-foreground">
          Contact-form submissions. Advance status through the pipeline as you
          work each lead.
        </p>
      </header>
      <LeadsList />
    </div>
  );
}
