'use client';

import { PortalHeader } from '@/components/portal/header';
import { useProjects } from '@/hooks/use-projects';
import { useInvoices } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/utils';
import { FolderKanban, FileText, Clock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PROPOSAL_SENT: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  REVIEW: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  PROPOSAL_SENT: 'Proposal Sent',
  IN_PROGRESS: 'In Progress',
  ON_HOLD: 'On Hold',
  REVIEW: 'In Review',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

const invoiceStatusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

const invoiceStatusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function PortalOverviewPage() {
  const { data: projects, isLoading: loadingProjects } = useProjects();
  const { data: invoices, isLoading: loadingInvoices } = useInvoices();

  const activeProjects = projects?.filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'REVIEW',
  ) || [];
  const completedProjects = projects?.filter((p) => p.status === 'COMPLETED') || [];
  const unpaidInvoices = invoices?.filter(
    (i) => i.status === 'SENT' || i.status === 'OVERDUE',
  ) || [];
  const totalOwed = unpaidInvoices.reduce((sum, i) => sum + i.total, 0);

  const isLoading = loadingProjects || loadingInvoices;

  if (isLoading) {
    return (
      <>
        <PortalHeader title="Overview" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  return (
    <>
      <PortalHeader title="Overview" />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            icon={<FolderKanban className="h-5 w-5 text-purple-600" />}
            label="Total Projects"
            value={projects?.length || 0}
            bg="bg-purple-50"
          />
          <StatCard
            icon={<Clock className="h-5 w-5 text-blue-600" />}
            label="In Progress"
            value={activeProjects.length}
            bg="bg-blue-50"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5 text-green-600" />}
            label="Completed"
            value={completedProjects.length}
            bg="bg-green-50"
          />
          <StatCard
            icon={<FileText className="h-5 w-5 text-amber-600" />}
            label="Amount Due"
            value={formatCurrency(totalOwed, unpaidInvoices[0]?.currency || 'VND')}
            bg="bg-amber-50"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Active Projects */}
          <section className="tts-workspace-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Active Projects</h2>
              <Link
                href="/portal/projects"
                className="text-sm text-accent hover:underline"
              >
                View all
              </Link>
            </div>
            {activeProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active projects.</p>
            ) : (
              <div className="space-y-3">
                {activeProjects.slice(0, 5).map((project) => {
                  const totalTasks = project.tasks?.length || 0;
                  const doneTasks =
                    project.tasks?.filter((t) => t.status === 'DONE').length || 0;
                  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

                  return (
                    <Link
                      key={project.id}
                      href={`/portal/projects/${project.id}`}
                      className="block rounded-lg border border-border p-4 transition-colors hover:bg-muted/50"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <h3 className="font-medium">{project.name}</h3>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[project.status]}`}
                        >
                          {statusLabels[project.status]}
                        </span>
                      </div>
                      {/* Progress bar */}
                      <div className="flex items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-accent transition-all"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {doneTasks}/{totalTasks} tasks ({progress}%)
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* Recent Invoices */}
          <section className="tts-workspace-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold">Recent Invoices</h2>
              <Link
                href="/portal/invoices"
                className="text-sm text-accent hover:underline"
              >
                View all
              </Link>
            </div>
            {!invoices || invoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="space-y-3">
                {invoices.slice(0, 5).map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between rounded-lg border border-border p-4"
                  >
                    <div>
                      <div className="font-medium">{invoice.invoiceNumber}</div>
                      <div className="text-xs text-muted-foreground">
                        {invoice.project?.name || 'No project linked'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">
                        {formatCurrency(invoice.total, invoice.currency)}
                      </div>
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${invoiceStatusColors[invoice.status]}`}
                      >
                        {invoiceStatusLabels[invoice.status]}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </main>
    </>
  );
}

function StatCard({
  icon,
  label,
  value,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  bg: string;
}) {
  return (
    <div className="tts-workspace-surface p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className={`rounded-lg p-2 ${bg}`}>{icon}</div>
        <span className="text-sm text-muted-foreground">{label}</span>
      </div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );
}
