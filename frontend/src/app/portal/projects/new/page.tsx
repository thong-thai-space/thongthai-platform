'use client';

import { PortalHeader } from '@/components/portal/header';
import { useCreateProjectRequest } from '@/hooks/use-projects';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';

export default function PortalNewProjectPage() {
  const router = useRouter();
  const createRequest = useCreateProjectRequest();
  const [form, setForm] = useState({
    name: '',
    description: '',
    budget: '',
    currency: 'VND' as 'VND' | 'USD',
    deadline: '',
    techStack: '',
  });
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim()) {
      setError('Please enter a project name.');
      return;
    }

    try {
      await createRequest.mutateAsync({
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        budget: form.budget ? Number(form.budget) : undefined,
        currency: form.currency,
        deadline: form.deadline || undefined,
        techStack: form.techStack
          ? form.techStack.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      router.push('/portal/projects');
    } catch {
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <>
      <PortalHeader title="Request New Project" />
      <main className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/portal/projects"
            className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to project list
          </Link>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-lg font-semibold">Submit Project Request</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Describe the project you'd like to build. The Thong Thai Space team will review and contact you.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.g.: Online store website"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Detailed Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Describe requirements, desired features, target users..."
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Estimated Budget</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="0"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as 'VND' | 'USD' })}
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Desired Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Required Technologies</label>
                <input
                  type="text"
                  value={form.techStack}
                  onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                  placeholder="React, Node.js, PostgreSQL... (comma-separated)"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                type="submit"
                disabled={createRequest.isPending}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
