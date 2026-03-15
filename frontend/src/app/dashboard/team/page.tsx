'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { UserAvatar } from '@/components/user-avatar';
import { useTeam, useCreateMember, useUpdateMember, useDeleteMember } from '@/hooks/use-team';
import { useAuth } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Search, Shield, ShieldCheck, User, UserCog, Plus, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';
import type { UserRole, User as UserType } from '@/types';

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  CLIENT: 'Client',
};

const roleColors: Record<UserRole, string> = {
  OWNER: 'bg-amber-100 text-amber-700',
  ADMIN: 'bg-purple-100 text-purple-700',
  MEMBER: 'bg-blue-100 text-blue-600',
  CLIENT: 'bg-green-100 text-green-600',
};

const roleIcons: Record<UserRole, React.ReactNode> = {
  OWNER: <ShieldCheck className="h-4 w-4" />,
  ADMIN: <Shield className="h-4 w-4" />,
  MEMBER: <User className="h-4 w-4" />,
  CLIENT: <UserCog className="h-4 w-4" />,
};

function CreateMemberModal({ onClose }: { onClose: () => void }) {
  const createMember = useCreateMember();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await createMember.mutateAsync({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Add Member</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name *</label>
            <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Email *</label>
            <input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password *</label>
            <input required type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Min 8 characters" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={createMember.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {createMember.isPending ? 'Creating...' : 'Create Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditMemberModal({ member, onClose }: { member: UserType; onClose: () => void }) {
  const updateMember = useUpdateMember();
  const [form, setForm] = useState({
    name: member.name,
    phone: member.phone || '',
    role: member.role,
    isActive: member.isActive,
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateMember.mutateAsync({
        id: member.id,
        name: form.name,
        phone: form.phone || undefined,
        role: form.role,
        isActive: form.isActive,
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-md rounded-xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Edit Member</h2>
          <button onClick={onClose} className="rounded p-1 hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {error && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
              <option value="MEMBER">Member</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-border" />
            <label htmlFor="isActive" className="text-sm">Active</label>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
            <button type="submit" disabled={updateMember.isPending}
              className="rounded-lg bg-primary px-4 py-2 text-sm text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {updateMember.isPending ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DeleteConfirmModal({ member, onClose }: { member: UserType; onClose: () => void }) {
  const deleteMember = useDeleteMember();
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setError('');
    try {
      await deleteMember.mutateAsync(member.id);
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to delete member');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="w-full max-w-sm rounded-xl border border-border bg-background p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold">Deactivate Member</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Are you sure you want to deactivate <strong>{member.name}</strong>? They will no longer be able to log in.
        </p>
        {error && <div className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{error}</div>}
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-muted">Cancel</button>
          <button onClick={handleDelete} disabled={deleteMember.isPending}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-50">
            {deleteMember.isPending ? 'Deactivating...' : 'Deactivate'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TeamPage() {
  const { data: members = [], isLoading } = useTeam();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [showCreate, setShowCreate] = useState(false);
  const [editingMember, setEditingMember] = useState<UserType | null>(null);
  const [deletingMember, setDeletingMember] = useState<UserType | null>(null);

  const isOwnerOrAdmin = user?.role === 'OWNER' || user?.role === 'ADMIN';
  const isOwner = user?.role === 'OWNER';

  const filtered = members.filter((m) => {
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'ALL' || m.role === roleFilter;
    return matchSearch && matchRole;
  });

  return (
    <>
      <DashboardHeader title="Team" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search members..."
                className="rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="ALL">All roles</option>
              {Object.entries(roleLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          {isOwnerOrAdmin && (
            <button
              onClick={() => setShowCreate(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Member
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">No members found</div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((member) => (
              <div
                key={member.id}
                className="rounded-xl border border-border bg-background p-5 transition-all hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <UserAvatar name={member.name} avatar={member.avatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{member.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{member.email}</div>
                  </div>
                  {isOwnerOrAdmin && member.id !== user?.id && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingMember(member)}
                        className="rounded p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                        title="Edit"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {isOwner && (
                        <button
                          onClick={() => setDeletingMember(member)}
                          className="rounded p-1.5 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          title="Deactivate"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${roleColors[member.role]}`}>
                    {roleIcons[member.role]}
                    {roleLabels[member.role]}
                  </span>
                  <div className="flex items-center gap-2">
                    {!member.isActive && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-600">Inactive</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      Joined: {formatDate(member.createdAt)}
                    </span>
                  </div>
                </div>

                {member.phone && (
                  <div className="mt-3 text-xs text-muted-foreground">
                    Phone: {member.phone}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showCreate && <CreateMemberModal onClose={() => setShowCreate(false)} />}
      {editingMember && <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />}
      {deletingMember && <DeleteConfirmModal member={deletingMember} onClose={() => setDeletingMember(null)} />}
    </>
  );
}
