'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { useProjects, useDeleteProject } from '@/hooks/use-projects';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useUnreadByProject } from '@/hooks/use-messages';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-600',
  PROPOSAL_SENT: 'bg-blue-100 text-blue-600',
  IN_PROGRESS: 'bg-amber-100 text-amber-600',
  ON_HOLD: 'bg-gray-100 text-gray-600',
  REVIEW: 'bg-purple-100 text-purple-600',
  COMPLETED: 'bg-green-100 text-green-600',
  CANCELLED: 'bg-red-100 text-red-600',
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

export default function ProjectsPage() {
  const { data: projects = [], isLoading } = useProjects();
  const deleteProject = useDeleteProject();
  const { isOwnerOrAdmin } = useAuth();
  const { data: unreadByProject } = useUnreadByProject();
  const unreadMap = new Map(unreadByProject?.map((u) => [u.projectId, u.count]) ?? []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <DashboardHeader title="Projects" />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="tts-form-field rounded-lg border border-border bg-background py-2 pl-9 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="tts-form-field rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="ALL">All statuses</option>
              {Object.entries(statusLabels).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/ai-assistant?tool=proposal&module=projects"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" /> AI for Projects
            </Link>
            {isOwnerOrAdmin && (
              <Link
                href="/dashboard/projects/new"
                className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" /> Create Project
              </Link>
            )}
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="mt-12 flex justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="mt-12 text-center text-muted-foreground">
            {search || statusFilter !== 'ALL' ? 'No projects found' : 'No projects yet. Create your first project!'}
          </div>
        ) : (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => (
              <div
                key={project.id}
                className="tts-workspace-surface group p-5 transition-all hover:border-primary/30 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </span>
                    {project.status === 'DRAFT' && project.clientId && (
                      <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Client Request
                      </span>
                    )}
                  </div>
                  {isOwnerOrAdmin && (
                    <button
                      onClick={() => {
                        if (confirm('Delete this project?')) deleteProject.mutate(project.id);
                      }}
                      className="rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <Link href={`/dashboard/projects/${project.id}`}>
                  <h3 className="mt-3 flex items-center gap-2 text-base font-semibold hover:text-primary">
                    {project.name}
                    {(unreadMap.get(project.id) ?? 0) > 0 && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                        <MessageSquare className="h-3 w-3" />
                        {unreadMap.get(project.id)}
                      </span>
                    )}
                  </h3>
                </Link>
                {project.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}

                <div className="mt-4 space-y-1.5 text-xs text-muted-foreground">
                  {project.client && (
                    <div>Client: <span className="font-medium text-foreground">{project.client.name}</span></div>
                  )}
                  {project.budget && (
                    <div>Budget: <span className="font-medium text-foreground">{formatCurrency(Number(project.budget), project.currency)}</span></div>
                  )}
                  {project.deadline && (
                    <div>Deadline: <span className="font-medium text-foreground">{formatDate(project.deadline)}</span></div>
                  )}
                </div>

                {project.techStack.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {project.techStack.slice(0, 4).map((t) => (
                      <span key={t} className="rounded bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                        {t}
                      </span>
                    ))}
                    {project.techStack.length > 4 && (
                      <span className="text-[10px] text-muted-foreground">+{project.techStack.length - 4}</span>
                    )}
                  </div>
                )}

                <div className="mt-4 flex items-center justify-end border-t border-border pt-3">
                  <Link
                    href={`/dashboard/ai-assistant?tool=proposal&projectId=${project.id}`}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium hover:bg-muted"
                  >
                    <Sparkles className="h-3.5 w-3.5" /> AI Proposal
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
