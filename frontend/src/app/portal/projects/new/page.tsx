'use client';

import { PortalHeader } from '@/components/portal/header';
import { useCreateProjectRequest } from '@/hooks/use-projects';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Send } from 'lucide-react';
import Link from 'next/link';
import { MotionReveal } from '@/components/motion/motion-primitives';

const ARCHITECTURE_IMPORT_STORAGE_KEY = 'tts_project_request_import';

export default function PortalNewProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const createRequest = useCreateProjectRequest();
  const isArchitectureImport = searchParams.get('import') === 'architecture';
  const [form, setForm] = useState({
    name: '',
    description: '',
    budget: '',
    currency: 'VND' as 'VND' | 'USD',
    deadline: '',
    techStack: '',
  });
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('import') !== 'architecture') return;

    const importedRaw = localStorage.getItem(ARCHITECTURE_IMPORT_STORAGE_KEY);
    if (!importedRaw) return;

    try {
      const imported = JSON.parse(importedRaw) as {
        name?: string;
        description?: string;
        techStack?: string[];
      };

      setForm((prev) => ({
        ...prev,
        name: imported.name || prev.name,
        description: imported.description || prev.description,
        techStack: Array.isArray(imported.techStack)
          ? imported.techStack.join(', ')
          : prev.techStack,
      }));
    } catch {
      // Ignore malformed import payload.
    } finally {
      localStorage.removeItem(ARCHITECTURE_IMPORT_STORAGE_KEY);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

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

      if (isArchitectureImport) {
        setSuccessMessage('Import thanh cong, dang chuyen ve Portal...');
        setTimeout(() => {
          router.push('/portal');
        }, 900);
        return;
      }

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
          <MotionReveal delay={0.02}>
            <Link
              href="/portal/projects"
              className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to project list
            </Link>
          </MotionReveal>

          <MotionReveal delay={0.06} className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-1 text-lg font-semibold">Submit Project Request</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Describe the project you&apos;d like to build. The Thong Thai Space team will review and contact you.
            </p>

            <form onSubmit={handleSubmit} className="tts-form-shell space-y-4">
              <MotionReveal delay={0.1}>
                <div>
                <label className="mb-1 block text-sm font-medium">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="E.g.: Online store website"
                  className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              </MotionReveal>

              <MotionReveal delay={0.14}>
                <div>
                <label className="mb-1 block text-sm font-medium">Detailed Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  placeholder="Describe requirements, desired features, target users..."
                  className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              </MotionReveal>

              <MotionReveal delay={0.18} className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">Estimated Budget</label>
                  <input
                    type="number"
                    value={form.budget}
                    onChange={(e) => setForm({ ...form, budget: e.target.value })}
                    placeholder="0"
                    className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Currency</label>
                  <select
                    value={form.currency}
                    onChange={(e) => setForm({ ...form, currency: e.target.value as 'VND' | 'USD' })}
                    className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                  >
                    <option value="VND">VND</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </MotionReveal>

              <MotionReveal delay={0.22}>
                <div>
                <label className="mb-1 block text-sm font-medium">Desired Deadline</label>
                <input
                  type="date"
                  value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                  className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              </MotionReveal>

              <MotionReveal delay={0.26}>
                <div>
                <label className="mb-1 block text-sm font-medium">Required Technologies</label>
                <input
                  type="text"
                  value={form.techStack}
                  onChange={(e) => setForm({ ...form, techStack: e.target.value })}
                  placeholder="React, Node.js, PostgreSQL... (comma-separated)"
                  className="tts-form-field w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
                />
              </div>
              </MotionReveal>

              {error && <p className="text-sm text-red-600">{error}</p>}
              {successMessage && <p className="text-sm text-emerald-600">{successMessage}</p>}

              <MotionReveal delay={0.3}>
                <button
                  type="submit"
                  disabled={createRequest.isPending || Boolean(successMessage)}
                  className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90 disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                  {createRequest.isPending ? 'Submitting...' : 'Submit Request'}
                </button>
              </MotionReveal>
            </form>
          </MotionReveal>
        </div>
      </main>
    </>
  );
}
