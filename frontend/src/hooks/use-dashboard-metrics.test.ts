import { describe, it, expect } from 'vitest';
import { buildDashboardAlerts, type DashboardMetrics } from './use-dashboard-metrics';

function metricsWith(overrides: Partial<DashboardMetrics>): DashboardMetrics {
  return {
    activeProjectCount: 0,
    pendingTaskCount: 0,
    totalUserCount: 0,
    totalRevenue: 0,
    overdueInvoiceCount: 0,
    urgentTaskCount: 0,
    taskDueSoonCount: 0,
    projectDeadlineRiskCount: 0,
    overdueProjectCount: 0,
    unreadNotificationCount: 0,
    isLoading: false,
    ...overrides,
  };
}

describe('buildDashboardAlerts', () => {
  it('returns empty list when nothing needs attention', () => {
    expect(buildDashboardAlerts(metricsWith({}))).toEqual([]);
  });

  it('emits destructive alerts first', () => {
    const alerts = buildDashboardAlerts(
      metricsWith({
        overdueInvoiceCount: 1,
        urgentTaskCount: 1,
        unreadNotificationCount: 1,
      }),
    );

    expect(alerts[0].id).toBe('overdue-invoices');
    expect(alerts[0].tone).toBe('destructive');
    expect(alerts[alerts.length - 1].tone).toBe('info');
  });

  it('skips sections that have no signal', () => {
    const alerts = buildDashboardAlerts(metricsWith({ urgentTaskCount: 3 }));
    expect(alerts).toHaveLength(1);
    expect(alerts[0].id).toBe('urgent-tasks');
  });

  it('uses correct pluralized labels for counts', () => {
    const alerts = buildDashboardAlerts(metricsWith({ overdueInvoiceCount: 5 }));
    expect(alerts[0].title).toContain('5 overdue invoice');
  });
});
