'use client';

import { PortalHeader } from '@/components/portal/header';
import { useInvoices } from '@/hooks/use-invoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Search, FileText } from 'lucide-react';
import { useState } from 'react';

const statusLabels: Record<string, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  SENT: 'bg-blue-100 text-blue-700',
  PAID: 'bg-green-100 text-green-700',
  OVERDUE: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-gray-100 text-gray-500',
};

export default function PortalInvoicesPage() {
  const { data: invoices, isLoading } = useInvoices();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = invoices?.filter((inv) => {
    const matchSearch =
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.project?.name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalUnpaid =
    filtered
      ?.filter((i) => i.status === 'SENT' || i.status === 'OVERDUE')
      .reduce((sum, i) => sum + i.total, 0) || 0;

  const totalPaid =
    filtered
      ?.filter((i) => i.status === 'PAID')
      .reduce((sum, i) => sum + i.total, 0) || 0;

  return (
    <>
      <PortalHeader title="Invoices" />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Summary cards */}
        <div className="mb-6 grid gap-4 sm:grid-cols-3">
          <div className="tts-workspace-surface p-4">
            <div className="text-xs text-muted-foreground">Total Invoices</div>
            <div className="text-2xl font-bold">{invoices?.length || 0}</div>
          </div>
          <div className="tts-workspace-surface p-4">
            <div className="text-xs text-muted-foreground">Amount Due</div>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(totalUnpaid, 'VND')}
            </div>
          </div>
          <div className="tts-workspace-surface p-4">
            <div className="text-xs text-muted-foreground">Paid</div>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(totalPaid, 'VND')}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoices..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="tts-form-field w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="tts-form-field rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="ALL">All statuses</option>
            {Object.entries(statusLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
          </div>
        )}

        {/* Empty */}
        {!isLoading && (!filtered || filtered.length === 0) && (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <FileText className="mb-3 h-12 w-12" />
            <p>No invoices found.</p>
          </div>
        )}

        {/* Invoice Table */}
        {filtered && filtered.length > 0 && (
          <div className="tts-workspace-surface overflow-x-auto">
            <table className="tts-data-table w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Invoice No.</th>
                  <th className="px-4 py-3 text-left font-medium">Project</th>
                  <th className="px-4 py-3 text-left font-medium">Issued</th>
                  <th className="px-4 py-3 text-left font-medium">Due Date</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                  <th className="px-4 py-3 text-center font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((invoice) => (
                  <tr
                    key={invoice.id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {invoice.project?.name || '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(invoice.issueDate)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDate(invoice.dueDate)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatCurrency(invoice.total, invoice.currency)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[invoice.status]}`}
                      >
                        {statusLabels[invoice.status]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </>
  );
}
