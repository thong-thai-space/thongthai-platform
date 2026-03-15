'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { useClients, useCreateClient, useDeleteClient } from '@/hooks/use-clients';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { formatDate } from '@/lib/utils';

export default function ClientsPage() {
  const { data: clients = [], isLoading } = useClients();
  const createClient = useCreateClient();
  const deleteClient = useDeleteClient();
  const { isOwnerOrAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createClient.mutate(form, {
      onSuccess: () => {
        setForm({ name: '', email: '', phone: '', password: '' });
        setShowForm(false);
      },
    });
  };

  return (
    <>
      <DashboardHeader title="Clients" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" /> Add Client
            </button>
          )}
        </div>

        {/* Create form modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <form onSubmit={handleSubmit} className="w-full max-w-md rounded-xl bg-background p-6 shadow-lg">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Add New Client</h2>
                <button type="button" onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="mt-4 space-y-3">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Name *"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="Email *"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Phone"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  required
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="Password *"
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
              <div className="mt-5 flex justify-end gap-3">
                <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createClient.isPending}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  {createClient.isPending ? 'Creating...' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Client table */}
        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">No clients yet</div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left">
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Created</th>
                  {isOwnerOrAdmin && <th className="px-4 py-3 font-medium" />}
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => (
                  <tr key={client.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{client.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.email}</td>
                    <td className="px-4 py-3 text-muted-foreground">{client.phone || '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(client.createdAt)}</td>
                    {isOwnerOrAdmin && (
                      <td className="px-4 py-3">
                        <button
                          onClick={() => {
                            if (confirm('Delete this client?')) deleteClient.mutate(client.id);
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    )}
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
