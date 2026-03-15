'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { useInvoices, useCreateInvoice, useUpdateInvoice } from '@/hooks/use-invoices';
import { useClients } from '@/hooks/use-clients';
import { useProjects } from '@/hooks/use-projects';
import { useAuth } from '@/lib/auth';
import api from '@/lib/api';
import { useState } from 'react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Plus, Search, X, FileDown, Loader2 } from 'lucide-react';
import type { Invoice, InvoiceStatus, User } from '@/types';
import { exportTextAsPdf } from '@/lib/file-export';

const statusLabels: Record<InvoiceStatus, string> = {
  DRAFT: 'Draft',
  SENT: 'Sent',
  PAID: 'Paid',
  OVERDUE: 'Overdue',
  CANCELLED: 'Cancelled',
};

const statusColors: Record<InvoiceStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  SENT: 'bg-blue-100 text-blue-600',
  PAID: 'bg-green-100 text-green-600',
  OVERDUE: 'bg-red-100 text-red-600',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function InvoicesPage() {
  const { data: invoices = [], isLoading } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: projects = [] } = useProjects();
  const createInvoice = useCreateInvoice();
  const updateInvoice = useUpdateInvoice();
  const { isOwnerOrAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showForm, setShowForm] = useState(false);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    clientId: '',
    projectId: '',
    dueDate: '',
    currency: 'VND',
    taxRate: '10',
    notes: '',
    items: [{ description: '', quantity: 1, unitPrice: 0 }],
  });

  const filtered = invoices.filter((inv) => {
    const matchSearch = inv.invoiceNumber.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || inv.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const addItem = () => setForm({ ...form, items: [...form.items, { description: '', quantity: 1, unitPrice: 0 }] });
  const removeItem = (i: number) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: string, value: string | number) => {
    const items = [...form.items];
    items[i] = { ...items[i], [field]: value };
    setForm({ ...form, items });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createInvoice.mutate(
      {
        clientId: form.clientId,
        projectId: form.projectId || undefined,
        dueDate: form.dueDate,
        currency: form.currency as 'VND' | 'USD',
        taxRate: Number(form.taxRate),
        notes: form.notes || undefined,
        items: form.items.map((it) => ({ description: it.description, quantity: Number(it.quantity), unitPrice: Number(it.unitPrice) })),
      },
      {
        onSuccess: () => {
          setShowForm(false);
          setForm({ clientId: '', projectId: '', dueDate: '', currency: 'VND', taxRate: '10', notes: '', items: [{ description: '', quantity: 1, unitPrice: 0 }] });
        },
      },
    );
  };

  const handleStatusChange = (id: string, status: InvoiceStatus) => {
    updateInvoice.mutate({ id, status });
  };

  const handleExportPdf = async (invoiceId: string) => {
    try {
      setExportingId(invoiceId);
      const detail = await api.get(`/invoices/${invoiceId}`).then((r) => r.data as InvoiceDetail);

      const lines = buildInvoiceDetailLines(detail);
      exportTextAsPdf(`invoice-${detail.invoiceNumber}`, lines.join('\n'));
    } finally {
      setExportingId(null);
    }
  };

  return (
    <>
      <DashboardHeader title="Invoices" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search invoices..."
                className="rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Create Invoice
            </button>
          )}
        </div>

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4">
            <form onSubmit={handleSubmit} className="w-full max-w-lg rounded-xl bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Create New Invoice</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <select
                  required
                  value={form.clientId}
                  onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <option value="">Select client *</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <select
                  value={form.projectId}
                  onChange={(e) => setForm({ ...form, projectId: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <option value="">Project (optional)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="grid grid-cols-3 gap-3">
                  <input
                    required
                    type="date"
                    value={form.dueDate}
                    onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  />
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value })}
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    value={form.taxRate}
                    onChange={(e) => setForm({ ...form, taxRate: e.target.value })}
                    placeholder="Tax %"
                    className="rounded-lg border border-border px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <div className="mb-2 text-sm font-medium">Line Items</div>
                  {form.items.map((item, i) => (
                    <div key={i} className="mb-2 flex gap-2">
                      <input
                        required
                        value={item.description}
                        onChange={(e) => updateItem(i, 'description', e.target.value)}
                        placeholder="Description"
                        className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(i, 'quantity', e.target.value)}
                        className="w-20 rounded-lg border border-border px-2 py-2 text-sm"
                      />
                      <input
                        type="number"
                        min={0}
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, 'unitPrice', e.target.value)}
                        placeholder="Unit Price"
                        className="w-28 rounded-lg border border-border px-2 py-2 text-sm"
                      />
                      {form.items.length > 1 && (
                        <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addItem} className="text-sm text-primary hover:underline">
                    + Add Item
                  </button>
                </div>

                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Notes"
                  rows={2}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createInvoice.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createInvoice.isPending ? 'Creating...' : 'Create Invoice'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Invoice table */}
        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">No invoices yet</div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-175 text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Invoice Number</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  <th className="px-4 py-3 font-medium">Due Date</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((inv) => (
                  <tr key={inv.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3 text-muted-foreground">{inv.client?.name ?? '—'}</td>
                    <td className="px-4 py-3 font-medium">{formatCurrency(Number(inv.total), inv.currency)}</td>
                    <td className="px-4 py-3">
                      {isOwnerOrAdmin ? (
                        <select
                          value={inv.status}
                          onChange={(e) => handleStatusChange(inv.id, e.target.value as InvoiceStatus)}
                          className={`rounded-full border-0 px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status]}`}
                        >
                          {Object.entries(statusLabels).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      ) : (
                        <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[inv.status]}`}>
                          {statusLabels[inv.status]}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.createdAt)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => handleExportPdf(inv.id)}
                        disabled={exportingId === inv.id}
                        className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {exportingId === inv.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <FileDown className="h-3.5 w-3.5" />
                        )}
                        PDF
                      </button>
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

type InvoiceDetail = Invoice & {
  client?: Pick<User, 'id' | 'name' | 'email' | 'phone'>;
  creator?: Pick<User, 'id' | 'name'>;
};

function buildInvoiceDetailLines(invoice: InvoiceDetail) {
  const lines = [
    `Invoice Number: ${invoice.invoiceNumber}`,
    `Status: ${invoice.status}`,
    `Issue Date: ${formatDate(invoice.issueDate)}`,
    `Due Date: ${formatDate(invoice.dueDate)}`,
    `Currency: ${invoice.currency}`,
    `Client: ${invoice.client?.name || '-'}`,
    `Client Email: ${invoice.client?.email || '-'}`,
    `Client Phone: ${invoice.client?.phone || '-'}`,
    `Project: ${invoice.project?.name || '-'}`,
    `Creator: ${invoice.creator?.name || '-'}`,
    '',
    'Line Items:',
  ];

  (invoice.items || []).forEach((item, index) => {
    lines.push(
      `${index + 1}. ${item.description} | Qty: ${item.quantity} | Unit: ${formatCurrency(item.unitPrice, invoice.currency)} | Amount: ${formatCurrency(item.amount, invoice.currency)}`,
    );
  });

  lines.push('');
  lines.push(`Subtotal: ${formatCurrency(invoice.subtotal, invoice.currency)}`);
  lines.push(`Tax: ${formatCurrency(invoice.tax, invoice.currency)}`);
  lines.push(`Discount: ${formatCurrency(invoice.discount, invoice.currency)}`);
  lines.push(`Total: ${formatCurrency(invoice.total, invoice.currency)}`);
  if (invoice.totalUsd) lines.push(`Total (USD): ${formatCurrency(invoice.totalUsd, 'USD')}`);
  if (invoice.notes) {
    lines.push('');
    lines.push('Notes:');
    lines.push(invoice.notes);
  }

  return lines;
}
