'use client';

import { PortalHeader } from '@/components/portal/header';
import { useProjects } from '@/hooks/use-projects';
import { formatDate } from '@/lib/utils';
import { Search, FolderKanban, Plus, MessageSquare } from 'lucide-react';
import { useUnreadByProject } from '@/hooks/use-messages';
import Link from 'next/link';
import { useState } from 'react';

const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PROPOSAL_SENT: 'bg-blue-100 text-blue-700',
  IN_PROGRESS: 'bg-purple-100 text-purple-700',
  ON_HOLD: 'bg-yellow-100 text-yellow-700',
  REVIEW: 'bg-orange-100 text-orange-700',
  COMPLETED: 'bg-green-100 text-green-700',
  CANCELLED: 'bg-red-100 text-red-700',
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

export default function PortalProjectsPage() {
  const { data: projects, isLoading } = useProjects();
  const { data: unreadByProject } = useUnreadByProject();
  const unreadMap = new Map(unreadByProject?.map((u) => [u.projectId, u.count]) ?? []);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const filtered = projects?.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <>
      <PortalHeader title="My Projects" />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Header with button */}
        <div className="mb-6 flex items-center justify-between">
          <div />
          <Link
            href="/portal/projects/new"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" />
            Request New Project
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-background py-2 pl-10 pr-4 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
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
            <FolderKanban className="mb-3 h-12 w-12" />
            <p>No projects found.</p>
          </div>
        )}

        {/* Project Grid */}
        {filtered && filtered.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((project) => {
              const totalTasks = project.tasks?.length || 0;
              const doneTasks =
                project.tasks?.filter((t) => t.status === 'DONE').length || 0;
              const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

              return (
                <Link
                  key={project.id}
                  href={`/portal/projects/${project.id}`}
                  className="group rounded-xl border border-border bg-card p-5 transition-shadow hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <h3 className="flex items-center gap-2 font-semibold group-hover:text-accent">
                      {project.name}
                      {(unreadMap.get(project.id) ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-destructive px-1.5 py-0.5 text-[10px] font-bold text-white">
                          <MessageSquare className="h-3 w-3" />
                          {unreadMap.get(project.id)}
                        </span>
                      )}
                    </h3>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${statusColors[project.status]}`}
                    >
                      {statusLabels[project.status]}
                    </span>
                  </div>

                  {project.description && (
                    <p className="mb-3 line-clamp-2 text-sm text-muted-foreground">
                      {project.description}
                    </p>
                  )}

                  {/* Progress */}
                  <div className="mb-3">
                    <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                      <span>Progress</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-accent transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {doneTasks}/{totalTasks} tasks
                    </span>
                    {project.deadline && (
                      <span>Due: {formatDate(project.deadline)}</span>
                    )}
                  </div>

                  {/* Tech stack */}
                  {project.techStack && project.techStack.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {project.techStack.slice(0, 4).map((tech) => (
                        <span
                          key={tech}
                          className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {tech}
                        </span>
                      ))}
                      {project.techStack.length > 4 && (
                        <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                          +{project.techStack.length - 4}
                        </span>
                      )}
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
