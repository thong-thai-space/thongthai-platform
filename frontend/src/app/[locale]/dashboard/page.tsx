'use client';

import Link from 'next/link';
import {
  ArrowRight,
  AlertCircle,
  CheckSquare,
  Clock,
  DollarSign,
  FolderKanban,
  Plus,
  Users,
} from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useAuth } from '@/lib/auth';
import { formatCurrency } from '@/lib/utils';
import {
  buildDashboardAlerts,
  useDashboardMetrics,
  type DashboardAlert,
  type DashboardMetrics,
} from '@/hooks/use-dashboard-metrics';

export default function DashboardPage() {
  const { user } = useAuth();
  const metrics = useDashboardMetrics();
  const alerts = buildDashboardAlerts(metrics);

  // Lists below are intentional secondary fetches; the dashboard hook only
  // computes counts and totals so the heavy collections stay where they belong.
  const { data: projects = [] } = useProjects();
  const { data: tasks = [] } = useTasks();
  const pendingTasks = tasks.filter((t) => t.status !== 'DONE');

  return (
    <>
      <DashboardHeader title={`Hello, ${user?.name || ''}!`} />
      <main className="flex-1 overflow-y-auto p-6">
        <StatsRow metrics={metrics} />

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <RecentProjects projects={projects.slice(0, 5)} />
          <PendingTasks tasks={pendingTasks.slice(0, 5)} />
          <QuickActions />
          <AlertsPanel alerts={alerts} />
        </div>
      </main>
    </>
  );
}

// ── Sections ──────────────────────────────────────────────────────────

function StatsRow({ metrics }: { metrics: DashboardMetrics }) {
  const stats = [
    {
      label: 'Active Projects',
      value: metrics.activeProjectCount,
      icon: FolderKanban,
      color: 'text-blue-500 bg-blue-500/10',
      href: '/dashboard/projects',
    },
    {
      label: 'Pending Tasks',
      value: metrics.pendingTaskCount,
      icon: CheckSquare,
      color: 'text-amber-500 bg-amber-500/10',
      href: '/dashboard/tasks',
    },
    {
      label: 'Users',
      value: metrics.totalUserCount,
      icon: Users,
      color: 'text-green-500 bg-green-500/10',
      href: '/dashboard/users',
    },
    {
      label: 'Revenue (Collected)',
      value: formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      color: 'text-purple-500 bg-purple-500/10',
      href: '/dashboard/invoices',
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Link
          key={stat.label}
          href={stat.href}
          className="tts-workspace-surface group p-5 transition-all hover:border-primary/30 hover:shadow-md"
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
  );
}

interface RecentProject {
  id: string;
  name: string;
  status: string;
  client?: { name?: string } | null;
}

function RecentProjects({ projects }: { projects: RecentProject[] }) {
  return (
    <div className="tts-workspace-surface p-5">
      <SectionHeader title="Recent Projects" href="/dashboard/projects" />
      <div className="mt-4 space-y-3">
        {projects.length === 0 ? (
          <EmptyState message="No projects yet" />
        ) : (
          projects.map((project) => (
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
  );
}

interface PendingTask {
  id: string;
  title: string;
  status: string;
  priority: string;
  projectId: string;
  dueDate?: string | null;
}

function PendingTasks({ tasks }: { tasks: PendingTask[] }) {
  return (
    <div className="tts-workspace-surface p-5">
      <SectionHeader title="Pending Tasks" href="/dashboard/tasks" />
      <div className="mt-4 space-y-3">
        {tasks.length === 0 ? (
          <EmptyState message="No pending tasks" />
        ) : (
          tasks.map((task) => (
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
  );
}

const QUICK_ACTIONS = [
  { label: 'Create Project', href: '/dashboard/projects', icon: FolderKanban },
  { label: 'Create Task', href: '/dashboard/tasks', icon: CheckSquare },
  { label: 'Create Invoice', href: '/dashboard/invoices', icon: DollarSign },
  { label: 'Ask AI', href: '/dashboard/ai-assistant', icon: Plus },
] as const;

function QuickActions() {
  return (
    <div className="tts-workspace-surface p-5">
      <h2 className="font-semibold">Quick Actions</h2>
      <div className="mt-4 grid grid-cols-2 gap-3">
        {QUICK_ACTIONS.map((action) => (
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
  );
}

const ALERT_TONE_CLASSES: Record<DashboardAlert['tone'], string> = {
  destructive: 'bg-destructive/5 text-destructive',
  warning: 'bg-amber-500/5 text-amber-600',
  info: 'bg-blue-500/5 text-blue-600',
};

function AlertsPanel({ alerts }: { alerts: DashboardAlert[] }) {
  return (
    <div className="tts-workspace-surface p-5">
      <h2 className="font-semibold">Alerts</h2>
      <div className="mt-4 space-y-3">
        {alerts.length === 0 ? (
          <EmptyState message="No alerts" />
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="rounded-lg border border-border/60 p-3">
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-full p-1.5 ${ALERT_TONE_CLASSES[alert.tone]}`}>
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
          ))
        )}
      </div>
    </div>
  );
}

// ── Atoms ─────────────────────────────────────────────────────────────

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-semibold">{title}</h2>
      <Link href={href} className="text-xs font-medium text-primary hover:text-primary/80">
        View all
      </Link>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return <p className="py-4 text-center text-sm text-muted-foreground">{message}</p>;
}

const STATUS_COLORS: Record<string, string> = {
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

function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600';
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {status.replace(/_/g, ' ')}
    </span>
  );
}

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-400',
  MEDIUM: 'bg-blue-400',
  HIGH: 'bg-amber-400',
  URGENT: 'bg-red-500',
};

function PriorityDot({ priority }: { priority: string }) {
  const color = PRIORITY_COLORS[priority] ?? 'bg-gray-400';
  return <span className={`inline-block h-2 w-2 rounded-full ${color}`} />;
}
