import { useMemo } from 'react';
import { useProjects } from '@/hooks/use-projects';
import { useTasks } from '@/hooks/use-tasks';
import { useInvoices } from '@/hooks/use-invoices';
import { useClients } from '@/hooks/use-clients';
import { useTeam } from '@/hooks/use-team';
import { useUnreadCount } from '@/hooks/use-notifications';

const DAY_MS = 24 * 60 * 60 * 1000;

export type AlertTone = 'destructive' | 'warning' | 'info';

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  tone: AlertTone;
  href: string;
  ctaLabel: string;
}

export interface DashboardMetrics {
  activeProjectCount: number;
  pendingTaskCount: number;
  totalUserCount: number;
  totalRevenue: number;
  overdueInvoiceCount: number;
  urgentTaskCount: number;
  taskDueSoonCount: number;
  projectDeadlineRiskCount: number;
  overdueProjectCount: number;
  unreadNotificationCount: number;
  isLoading: boolean;
}

/**
 * Pattern: Custom Hook — encapsulates derived dashboard data so the page stays declarative.
 * SRP: this hook only computes metrics; rendering decisions live in the page.
 */
export function useDashboardMetrics(): DashboardMetrics {
  const { data: projects = [], isLoading: projectsLoading } = useProjects();
  const { data: tasks = [], isLoading: tasksLoading } = useTasks();
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices();
  const { data: clients = [] } = useClients();
  const { data: team = [] } = useTeam();
  const { data: unreadNotifications = 0 } = useUnreadCount();

  return useMemo(() => {
    const activeProjects = projects.filter(
      (p) => p.status === 'IN_PROGRESS' || p.status === 'REVIEW',
    );
    const pendingTasks = tasks.filter((t) => t.status !== 'DONE');
    const paidInvoices = invoices.filter((i) => i.status === 'PAID');
    const totalRevenue = paidInvoices.reduce((sum, i) => sum + Number(i.total), 0);

    const overdueInvoices = invoices.filter((i) => i.status === 'OVERDUE');
    const urgentTasks = pendingTasks.filter((t) => t.priority === 'URGENT');

    const now = Date.now();
    const taskDueSoonCount = pendingTasks.filter((task) => {
      if (!task.dueDate || task.priority === 'URGENT') return false;
      const due = new Date(task.dueDate).getTime();
      return due >= now && due <= now + 3 * DAY_MS;
    }).length;

    const projectDeadlineRiskCount = activeProjects.filter((project) => {
      if (!project.deadline) return false;
      const due = new Date(project.deadline).getTime();
      return due >= now && due <= now + 7 * DAY_MS;
    }).length;

    const overdueProjectCount = projects.filter((project) => {
      if (!project.deadline) return false;
      if (project.status === 'COMPLETED' || project.status === 'CANCELLED') return false;
      return new Date(project.deadline).getTime() < now;
    }).length;

    return {
      activeProjectCount: activeProjects.length,
      pendingTaskCount: pendingTasks.length,
      totalUserCount: clients.length + team.length,
      totalRevenue,
      overdueInvoiceCount: overdueInvoices.length,
      urgentTaskCount: urgentTasks.length,
      taskDueSoonCount,
      projectDeadlineRiskCount,
      overdueProjectCount,
      unreadNotificationCount: unreadNotifications,
      isLoading: projectsLoading || tasksLoading || invoicesLoading,
    };
  }, [
    projects,
    tasks,
    invoices,
    clients.length,
    team.length,
    unreadNotifications,
    projectsLoading,
    tasksLoading,
    invoicesLoading,
  ]);
}

/**
 * Builds the actionable alert list shown on the dashboard.
 * Order matters: destructive items appear first, info last.
 */
export function buildDashboardAlerts(metrics: DashboardMetrics): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  if (metrics.overdueInvoiceCount > 0) {
    alerts.push({
      id: 'overdue-invoices',
      title: `${metrics.overdueInvoiceCount} overdue invoice(s)`,
      description: 'Follow up payment with clients to protect cashflow.',
      tone: 'destructive',
      href: '/dashboard/invoices',
      ctaLabel: 'Review invoices',
    });
  }

  if (metrics.overdueProjectCount > 0) {
    alerts.push({
      id: 'overdue-projects',
      title: `${metrics.overdueProjectCount} project(s) passed deadline`,
      description: 'Check timeline risk and update milestone plans.',
      tone: 'destructive',
      href: '/dashboard/projects',
      ctaLabel: 'Open projects',
    });
  }

  if (metrics.urgentTaskCount > 0) {
    alerts.push({
      id: 'urgent-tasks',
      title: `${metrics.urgentTaskCount} urgent task(s)`,
      description: 'These items need immediate assignment or execution.',
      tone: 'warning',
      href: '/dashboard/tasks',
      ctaLabel: 'Open tasks',
    });
  }

  if (metrics.taskDueSoonCount > 0) {
    alerts.push({
      id: 'soon-tasks',
      title: `${metrics.taskDueSoonCount} task(s) due in 3 days`,
      description: 'Prepare handoff and block dependencies early.',
      tone: 'warning',
      href: '/dashboard/tasks',
      ctaLabel: 'Plan workload',
    });
  }

  if (metrics.projectDeadlineRiskCount > 0) {
    alerts.push({
      id: 'project-risk',
      title: `${metrics.projectDeadlineRiskCount} active project(s) due this week`,
      description: 'Prioritize delivery checkpoints and client communication.',
      tone: 'warning',
      href: '/dashboard/projects',
      ctaLabel: 'Inspect timeline',
    });
  }

  if (metrics.unreadNotificationCount > 0) {
    alerts.push({
      id: 'unread-notifications',
      title: `${metrics.unreadNotificationCount} unread notification(s)`,
      description: 'Review updates from team, client, and system events.',
      tone: 'info',
      href: '/dashboard/messages',
      ctaLabel: 'Check updates',
    });
  }

  return alerts;
}
