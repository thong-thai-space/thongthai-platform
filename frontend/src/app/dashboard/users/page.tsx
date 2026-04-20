'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { UserAvatar } from '@/components/user-avatar';
import { useTeam, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/use-team';
import { useClients, useCreateClient } from '@/hooks/use-clients';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Search, Plus, X, Pencil, Trash2, Sparkles } from 'lucide-react';
import type { User, UserRole } from '@/types';

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  CLIENT: 'Client',
};

const roleColors: Record<UserRole, string> = {
  OWNER: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  MEMBER: 'bg-blue-100 text-blue-700',
  CLIENT: 'bg-green-100 text-green-700',
};

function AddUserModal({ onClose }: { onClose: () => void }) {
  const createMember = useCreateMember();
  const createClient = useCreateClient();
  const updateMember = useUpdateMember();
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    role: 'MEMBER' as UserRole,
  });

  const isSubmitting =
    createMember.isPending || createClient.isPending || updateMember.isPending;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) return;

    setError('');
    try {
      if (form.role === 'CLIENT') {
        await createClient.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        });
      } else {
        const created = await createMember.mutateAsync({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          password: form.password,
        });

        if (form.role === 'ADMIN') {
          await updateMember.mutateAsync({
            id: created.id,
            role: 'ADMIN',
          });
        }
      }

      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to create user';
      setError(message || 'Failed to create user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="tts-workspace-surface w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Add User</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="space-y-3">
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Name *"
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email *"
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder="Password *"
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone"
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="MEMBER">Member</option>
            <option value="ADMIN">Admin</option>
            <option value="CLIENT">Client</option>
          </select>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const updateMember = useUpdateMember();
  const [form, setForm] = useState({
    name: user.name,
    phone: user.phone || '',
    role: user.role,
    isActive: user.isActive,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateMember.mutateAsync({
        id: user.id,
        name: form.name,
        phone: form.phone || undefined,
        role: form.role,
        isActive: form.isActive,
      });
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to update user';
      setError(message || 'Failed to update user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        className="tts-workspace-surface w-full max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Edit User</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && <div className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}

        <div className="space-y-3">
          <input
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
            placeholder="Phone"
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          />
          <select
            value={form.role}
            onChange={(e) => setForm((prev) => ({ ...prev, role: e.target.value as UserRole }))}
            className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="OWNER">Owner</option>
            <option value="ADMIN">Admin</option>
            <option value="MEMBER">Member</option>
            <option value="CLIENT">Client</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm((prev) => ({ ...prev, isActive: e.target.checked }))}
              className="h-4 w-4 rounded border-border"
            />
            Active
          </label>
        </div>

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={updateMember.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMember.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function DeleteUserModal({ user, onClose }: { user: User; onClose: () => void }) {
  const deleteMember = useDeleteMember();
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    try {
      await deleteMember.mutateAsync(user.id);
      onClose();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message === 'string'
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : 'Failed to deactivate user';
      setError(message || 'Failed to deactivate user');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="tts-workspace-surface w-full max-w-sm p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold">Deactivate User</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to deactivate <strong>{user.name}</strong>?
        </p>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMember.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50"
          >
            {deleteMember.isPending ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const { data: team = [], isLoading: loadingTeam } = useTeam();
  const { data: clients = [], isLoading: loadingClients } = useClients();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'ALL'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [showAdd, setShowAdd] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';

  const users = useMemo(() => {
    const map = new Map<string, User>();
    [...team, ...clients].forEach((u) => {
      map.set(u.id, u);
    });
    return Array.from(map.values());
  }, [team, clients]);

  const roleSummary = useMemo(() => {
    return {
      total: users.length,
      active: users.filter((u) => u.isActive).length,
      inactive: users.filter((u) => !u.isActive).length,
      owner: users.filter((u) => u.role === 'OWNER').length,
      admin: users.filter((u) => u.role === 'ADMIN').length,
      member: users.filter((u) => u.role === 'MEMBER').length,
      client: users.filter((u) => u.role === 'CLIENT').length,
    };
  }, [users]);

  const filtered = users.filter((u) => {
    const matchSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  return (
    <>
      <DashboardHeader title="Users" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users..."
                className="tts-form-field rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as UserRole | 'ALL')}
              className="tts-form-field rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All roles</option>
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
              <option value="MEMBER">Member</option>
              <option value="CLIENT">Client</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
              className="tts-form-field rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/ai-assistant?tool=chat&module=users"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" /> AI for Users
            </Link>
            {isOwnerOrAdmin && (
              <button
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Add User
              </button>
            )}
          </div>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-semibold">{roleSummary.total}</p>
          </div>
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Active</p>
            <p className="text-sm font-semibold text-green-600">{roleSummary.active}</p>
          </div>
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Inactive</p>
            <p className="text-sm font-semibold text-red-600">{roleSummary.inactive}</p>
          </div>
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Owner</p>
            <p className="text-sm font-semibold">{roleSummary.owner}</p>
          </div>
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Admin</p>
            <p className="text-sm font-semibold">{roleSummary.admin}</p>
          </div>
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Member</p>
            <p className="text-sm font-semibold">{roleSummary.member}</p>
          </div>
          <div className="tts-workspace-surface px-3 py-2">
            <p className="text-xs text-muted-foreground">Client</p>
            <p className="text-sm font-semibold">{roleSummary.client}</p>
          </div>
        </div>

        {loadingTeam || loadingClients ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">No users found</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((entry) => (
              <div key={entry.id} className="tts-workspace-surface p-5">
                <div className="flex items-center gap-3">
                  <UserAvatar name={entry.name} avatar={entry.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{entry.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{entry.email}</div>
                  </div>
                  {isOwnerOrAdmin && entry.id !== user?.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setEditingUser(entry)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => setDeletingUser(entry)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[entry.role]}`}>
                    {roleLabels[entry.role]}
                  </span>
                  {!entry.isActive && (
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="mt-2 text-xs text-muted-foreground">Joined: {formatDate(entry.createdAt)}</div>
                {entry.phone && <div className="mt-1 text-xs text-muted-foreground">Phone: {entry.phone}</div>}
              </div>
            ))}
          </div>
        )}
      </main>

      {showAdd && <AddUserModal onClose={() => setShowAdd(false)} />}
      {editingUser && <EditUserModal user={editingUser} onClose={() => setEditingUser(null)} />}
      {deletingUser && <DeleteUserModal user={deletingUser} onClose={() => setDeletingUser(null)} />}
    </>
  );
}
