'use client';

import { PortalHeader } from '@/components/portal/header';
import { useProject, useUpdateProjectAsClient } from '@/hooks/use-projects';
import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';

export default function PortalProjectEditPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProjectAsClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [budget, setBudget] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [deadline, setDeadline] = useState('');
  const [techStack, setTechStack] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (project) {
      setName(project.name || '');
      setDescription(project.description || '');
      setBudget(project.budget ? String(project.budget) : '');
      setCurrency(project.currency || 'VND');
      setDeadline(project.deadline ? project.deadline.slice(0, 10) : '');
      setTechStack(project.techStack?.join(', ') || '');
    }
  }, [project]);

  if (isLoading) {
    return (
      <>
        <PortalHeader title="Edit Project" />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
        </div>
      </>
    );
  }

  if (!project) {
    return (
      <>
        <PortalHeader title="Edit Project" />
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <p>Project not found.</p>
          <Link href="/portal/projects" className="mt-2 text-accent hover:underline">
            Back to list
          </Link>
        </div>
      </>
    );
  }

  if (project.status !== 'DRAFT') {
    return (
      <>
        <PortalHeader title="Edit Project" />
        <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
          <p>Only projects in Draft status can be edited.</p>
          <Link href={`/portal/projects/${id}`} className="mt-2 text-accent hover:underline">
            Back to project
          </Link>
        </div>
      </>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await updateProject.mutateAsync({
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        budget: budget ? Number(budget) : undefined,
        currency: currency as 'VND' | 'USD',
        deadline: deadline || undefined,
        techStack: techStack
          ? techStack.split(',').map((s) => s.trim()).filter(Boolean)
          : undefined,
      });
      router.push(`/portal/projects/${id}`);
    } catch {
      setError('Save failed. Please try again.');
    }
  };

  return (
    <>
      <PortalHeader title="Edit Project" />
      <main className="flex-1 overflow-y-auto p-6">
        <Link
          href={`/portal/projects/${id}`}
          className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>

        <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6">
          <div>
            <label className="text-sm font-medium">
              Project Name <span className="text-destructive">*</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              className="mt-1 w-full resize-none rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="text-sm font-medium">Budget</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
              >
                <option value="VND">VND</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Deadline</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Technologies (comma-separated)</label>
            <input
              value={techStack}
              onChange={(e) => setTechStack(e.target.value)}
              placeholder="React, Node.js, PostgreSQL"
              className="mt-1 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={!name.trim() || updateProject.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2.5 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {updateProject.isPending ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </main>
    </>
  );
}
