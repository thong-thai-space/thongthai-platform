'use client';

import { DashboardHeader } from '@/components/dashboard/header';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useInvoices } from '@/hooks/use-invoices';
import { useClients } from '@/hooks/use-clients';
import { useTeam } from '@/hooks/use-team';
import { useUnreadCount } from '@/hooks/use-notifications';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import { useMemo } from 'react';
import {
  FolderKanban,
  CheckSquare,
  Users,
  DollarSign,
  ArrowRight,
  Clock,
  AlertCircle,
  Plus,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const { data: invoices = [] } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: team = [] } = useTeam();
  const { data: unreadNotifications = 0 } = useUnreadCount();

  const activeProjects = projects.filter(
    (p) => p.status === 'IN_PROGRESS' || p.status === 'REVIEW',
  );
  const pendingTasks = tasks.filter((t) => t.status !== 'DONE');
  const totalRevenue = invoices
    .filter((i) => i.status === 'PAID')
    .reduce((sum, i) => sum + Number(i.total), 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');

  const urgentTasksCount = pendingTasks.filter((t) => t.priority === 'URGENT').length;

  const taskDueSoonCount = pendingTasks.filter((task) => {
    if (!task.dueDate || task.priority === 'URGENT') return false;
    const due = new Date(task.dueDate).getTime();
    const now = Date.now();
    const threeDays = 3 * 24 * 60 * 60 * 1000;
    return due >= now && due <= now + threeDays;
  }).length;

  const projectDeadlineRiskCount = activeProjects.filter((project) => {
    if (!project.deadline) return false;
    const due = new Date(project.deadline).getTime();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    return due >= now && due <= now + sevenDays;
  }).length;

  const overdueProjectCount = projects.filter((project) => {
    if (!project.deadline) return false;
    if (project.status === 'COMPLETED' || project.status === 'CANCELLED') return false;
    return new Date(project.deadline).getTime() < Date.now();
  }).length;

  const alerts = useMemo(() => {
    const items: {
      id: string;
      title: string;
      description: string;
      tone: 'destructive' | 'warning' | 'info';
      href: string;
      ctaLabel: string;
    }[] = [];

    if (overdueInvoices.length > 0) {
      items.push({
        id: 'overdue-invoices',
        title: `${overdueInvoices.length} overdue invoice(s)`,
        description: 'Follow up payment with clients to protect cashflow.',
        tone: 'destructive',
        href: '/dashboard/invoices',
        ctaLabel: 'Review invoices',
      });
    }

    if (overdueProjectCount > 0) {
      items.push({
        id: 'overdue-projects',
        title: `${overdueProjectCount} project(s) passed deadline`,
        description: 'Check timeline risk and update milestone plans.',
        tone: 'destructive',
        href: '/dashboard/projects',
        ctaLabel: 'Open projects',
      });
    }

    if (urgentTasksCount > 0) {
      items.push({
        id: 'urgent-tasks',
        title: `${urgentTasksCount} urgent task(s)`,
        description: 'These items need immediate assignment or execution.',
        tone: 'warning',
        href: '/dashboard/tasks',
        ctaLabel: 'Open tasks',
      });
    }

    if (taskDueSoonCount > 0) {
      items.push({
        id: 'soon-tasks',
        title: `${taskDueSoonCount} task(s) due in 3 days`,
        description: 'Prepare handoff and block dependencies early.',
        tone: 'warning',
        href: '/dashboard/tasks',
        ctaLabel: 'Plan workload',
      });
    }

    if (projectDeadlineRiskCount > 0) {
      items.push({
        id: 'project-risk',
        title: `${projectDeadlineRiskCount} active project(s) due this week`,
        description: 'Prioritize delivery checkpoints and client communication.',
        tone: 'warning',
        href: '/dashboard/projects',
        ctaLabel: 'Inspect timeline',
      });
    }

    if (unreadNotifications > 0) {
      items.push({
        id: 'unread-notifications',
        title: `${unreadNotifications} unread notification(s)`,
        description: 'Review updates from team, client, and system events.',
        tone: 'info',
        href: '/dashboard/messages',
        ctaLabel: 'Check updates',
      });
    }

    return items;
  }, [
    overdueInvoices.length,
    overdueProjectCount,
    urgentTasksCount,
    taskDueSoonCount,
    projectDeadlineRiskCount,
    unreadNotifications,
  ]);

  const stats = [
    {
      label: 'Active Projects',
      value: activeProjects.length,
      icon: FolderKanban,
      color: 'text-blue-500 bg-blue-500/10',
      href: '/dashboard/projects',
    },
    {
      label: 'Pending Tasks',
      value: pendingTasks.length,
      icon: CheckSquare,
      color: 'text-amber-500 bg-amber-500/10',
      href: '/dashboard/tasks',
    },
    {
      label: 'Users',
      value: clients.length + team.length,
      icon: Users,
      color: 'text-green-500 bg-green-500/10',
      href: '/dashboard/users',
    },
    {
      label: 'Revenue (Collected)',
      value: formatCurrency(totalRevenue),
      icon: DollarSign,
      color: 'text-purple-500 bg-purple-500/10',
      href: '/dashboard/invoices',
    },
  ];

  return (
    <>
      <DashboardHeader title={`Hello, ${user?.name || ''}!`} />
      <main className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
          {/* Recent Projects */}
          <div className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Recent Projects</h2>
              <Link
                href="/dashboard/projects"
                className="text-xs font-medium text-primary hover:text-primary/80"
              >
                View all
              </Link>
            </div>
            <div className="mt-4 space-y-3">
              {projects.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No projects yet
                </p>
              ) : (
                projects.slice(0, 5).map((project) => (
                  <Link
                    key={project.id}
                    href={`/dashboard/projects/${project.id}`}
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

          {/* My Tasks */}
          <div className="rounded-xl border border-border bg-background p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Pending Tasks</h2>
              <Link
                href="/dashboard/tasks"
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
                  <Link
                    key={task.id}
                    href={`/dashboard/projects/${task.projectId}?task=${task.id}`}
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
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="font-semibold">Quick Actions</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              {[
                { label: 'Create Project', href: '/dashboard/projects', icon: FolderKanban },
                { label: 'Create Task', href: '/dashboard/tasks', icon: CheckSquare },
                { label: 'Create Invoice', href: '/dashboard/invoices', icon: DollarSign },
                { label: 'Ask AI', href: '/dashboard/ai-assistant', icon: Plus },
              ].map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted"
                >
                  <action.icon className="h-4 w-4 text-primary" />
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Alerts */}
          <div className="rounded-xl border border-border bg-background p-5">
            <h2 className="font-semibold">Alerts</h2>
            <div className="mt-4 space-y-3">
              {alerts.map((alert) => {
                const toneClasses: Record<typeof alert.tone, string> = {
                  destructive: 'bg-destructive/5 text-destructive',
                  warning: 'bg-amber-500/5 text-amber-600',
                  info: 'bg-blue-500/5 text-blue-600',
                };

                return (
                  <div key={alert.id} className="rounded-lg border border-border/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className={`mt-0.5 rounded-full p-1.5 ${toneClasses[alert.tone]}`}>
                        <AlertCircle className="h-3.5 w-3.5" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{alert.title}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">{alert.description}</div>
                        <Link
                          href={alert.href}
                          className="mt-2 inline-flex items-center text-xs font-medium text-primary hover:text-primary/80"
                        >
                          {alert.ctaLabel}
                          <ArrowRight className="ml-1 h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}

              {alerts.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">
                  No alerts
                </p>
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
