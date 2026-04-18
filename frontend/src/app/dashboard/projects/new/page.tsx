'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { useCreateProject } from '@/hooks/use-projects';
import { useClients } from '@/hooks/use-clients';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { ProjectStatus } from '@/types';
import { MotionReveal } from '@/components/motion/motion-primitives';

export default function NewProjectPage() {
  const createProject = useCreateProject();
  const { data: clients = [] } = useClients();
  const router = useRouter();
  const [form, setForm] = useState({
    name: '',
    description: '',
    clientId: '',
    status: 'DRAFT' as ProjectStatus,
    budget: '',
    currency: 'VND',
    deadline: '',
    techStack: '',
    liveUrl: '',
    repoUrl: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProject.mutate(
      {
        name: form.name,
        description: form.description || undefined,
        clientId: form.clientId || undefined,
        status: form.status,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: form.currency as 'VND' | 'USD',
        deadline: form.deadline || undefined,
        techStack: form.techStack ? form.techStack.split(',').map((s) => s.trim()).filter(Boolean) : [],
        liveUrl: form.liveUrl || undefined,
        repoUrl: form.repoUrl || undefined,
      },
      { onSuccess: () => router.push('/dashboard/projects') },
    );
  };

  return (
    <>
      <DashboardHeader title="Create New Project" />
      <main className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="tts-form-shell mx-auto max-w-2xl space-y-5">
          <MotionReveal delay={0.04}>
            <div>
            <label className="mb-1 block text-sm font-medium">Project Name *</label>
            <input
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          </MotionReveal>

          <MotionReveal delay={0.08}>
            <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={3}
              className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          </MotionReveal>

          <MotionReveal delay={0.12} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Client</label>
              <select
                value={form.clientId}
                onChange={(e) => setForm({ ...form, clientId: e.target.value })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">Select client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as ProjectStatus })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="DRAFT">Draft</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="IN_PROGRESS">In Progress</option>
              </select>
            </div>
          </MotionReveal>

          <MotionReveal delay={0.16} className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Budget</label>
              <input
                type="number"
                value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Deadline</label>
              <input
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </MotionReveal>

          <MotionReveal delay={0.2}>
            <div>
            <label className="mb-1 block text-sm font-medium">Tech Stack (comma separated)</label>
            <input
              value={form.techStack}
              onChange={(e) => setForm({ ...form, techStack: e.target.value })}
              placeholder="Next.js, NestJS, PostgreSQL..."
              className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          </MotionReveal>

          <MotionReveal delay={0.24} className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Live URL</label>
              <input
                value={form.liveUrl}
                onChange={(e) => setForm({ ...form, liveUrl: e.target.value })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Repo URL</label>
              <input
                value={form.repoUrl}
                onChange={(e) => setForm({ ...form, repoUrl: e.target.value })}
                className="tts-form-field w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </MotionReveal>

          <MotionReveal delay={0.28} className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => router.back()}
              className="rounded-lg border border-border px-6 py-2 text-sm hover:bg-muted"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createProject.isPending}
              className="rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {createProject.isPending ? 'Creating...' : 'Create Project'}
            </button>
          </MotionReveal>
        </form>
      </main>
    </>
  );
}
