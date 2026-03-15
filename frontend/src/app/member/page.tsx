'use client';

import { MemberHeader } from '@/components/member/header';
import { useProjects } from '@/hooks/use-projects';
import { useMyTasks } from '@/hooks/use-tasks';
import { useConversations } from '@/hooks/use-messages';
import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import {
  CheckSquare,
  FolderKanban,
  MessageSquare,
  ArrowRight,
  Clock,
} from 'lucide-react';

export default function MemberOverviewPage() {
  const { user } = useAuth();
  const { data: tasks = [] } = useMyTasks();
  const { data: projects = [] } = useProjects();
  const { data: conversations = [] } = useConversations();

  const pendingTasks = tasks.filter((t) => t.status !== 'DONE');
  const activeProjects = projects.filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'REVIEW',
  );
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const stats = [
    {
      label: 'My Tasks',
      value: pendingTasks.length,
      icon: CheckSquare,
      color: 'text-amber-500 bg-amber-500/10',
      href: '/member/tasks',
    },
    {
      label: 'My Projects',
      value: activeProjects.length,
      icon: FolderKanban,
      color: 'text-blue-500 bg-blue-500/10',
      href: '/member/projects',
    },
    {
      label: 'Messages',
      value: unreadMessages > 0 ? `${unreadMessages} unread` : '0',
      icon: MessageSquare,
      color: 'text-green-500 bg-green-500/10',
      href: '/member/messages',
    },
  ];

  return (
    <>
      <MemberHeader title={`Hello, ${user?.name || ''}!`} />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group rounded-xl border border-border bg-background p-5 transition-all hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className={`rounded-lg p-2.5 ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </div>
              <div className="mt-3 text-2xl font-bold">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </Link>
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          {/* Pending Tasks */}
          <div className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Pending Tasks</h2>
              <Link
                href="/member/tasks"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {pendingTasks.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No pending tasks
                </p>
              ) : (
                pendingTasks.slice(0, 5).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{task.title}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <PriorityDot priority={task.priority} />
                        {task.priority}
                        {task.dueDate && (
                          <>
                            <span>·</span>
                            <Clock className="h-3 w-3" />
                            {new Date(task.dueDate).toLocaleDateString('en-US')}
                          </>
                        )}
                      </div>
                    </div>
                    <StatusBadge status={task.status} />
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Projects */}
          <div className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Active Projects</h2>
              <Link
                href="/member/projects"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {activeProjects.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No active projects
                </p>
              ) : (
                activeProjects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/member/projects/${project.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 transition-colors hover:bg-muted"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{project.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {project.client?.name || 'No client assigned'}
                      </div>
                    </div>
                    <StatusBadge status={project.status} />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-600',
    PROPOSAL_SENT: 'bg-blue-100 text-blue-600',
    IN_PROGRESS: 'bg-amber-100 text-amber-600',
    ON_HOLD: 'bg-gray-100 text-gray-600',
    REVIEW: 'bg-purple-100 text-purple-600',
    COMPLETED: 'bg-green-100 text-green-600',
    CANCELLED: 'bg-red-100 text-red-600',
    TODO: 'bg-gray-100 text-gray-600',
    IN_REVIEW: 'bg-purple-100 text-purple-600',
    DONE: 'bg-green-100 text-green-600',
    BLOCKED: 'bg-red-100 text-red-600',
  };

  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[status] || 'bg-gray-100 text-gray-600'}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

function PriorityDot({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    LOW: 'bg-gray-400',
    MEDIUM: 'bg-blue-400',
    HIGH: 'bg-amber-400',
    URGENT: 'bg-red-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[priority] || 'bg-gray-400'}`} />;
}
