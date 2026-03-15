'use client';

import {
  useAiAuditLogs,
  useAiAuditSummary,
  useApplyRequests,
  useDeleteAiAudit,
  usePurgeAiAudits,
  useReviewApplyRequest,
} from '@/hooks/use-ai';
import { useAuth } from '@/lib/auth';
import { Loader2, ShieldCheck, Trash2, Check, X, Download } from 'lucide-react';
import { useState } from 'react';
import { exportJsonAsExcel } from '@/lib/file-export';

export function AiGovernance() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';

  const [days, setDays] = useState(30);
  const [retentionDays, setRetentionDays] = useState(90);

  const summary = useAiAuditSummary(days);
  const logs = useAiAuditLogs(50, days);
  const requests = useApplyRequests('PENDING');

  const reviewRequest = useReviewApplyRequest();
  const purgeAudits = usePurgeAiAudits();
  const deleteAudit = useDeleteAiAudit();

  const refreshAll = async () => {
    await Promise.all([summary.refetch(), logs.refetch(), requests.refetch()]);
  };

  const exportLogsJson = () => {
    const payload = logs.data || [];
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-audit-logs.json';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  const exportLogsCsv = () => {
    const rows = (logs.data || []).map((log) => [
      log.id,
      log.feature,
      log.success ? 'SUCCESS' : 'FAILED',
      log.totalTokens || 0,
      Number(log.estimatedCostUsd || 0).toFixed(6),
      log.durationMs || 0,
      log.project?.name || '',
      new Date(log.createdAt).toISOString(),
    ]);

    const header = ['id', 'feature', 'status', 'tokens', 'cost_usd', 'duration_ms', 'project', 'created_at'];
    const csv = [header, ...rows]
      .map((row) =>
        row
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      )
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'ai-audit-logs.csv';
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-border px-4 py-3">
        <ShieldCheck className="h-5 w-5 text-slate-600" />
        <span className="text-sm font-medium">AI Governance</span>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">KPI Summary</h3>
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="rounded-md border border-border px-2 py-1 text-xs"
            >
              <option value={7}>7d</option>
              <option value={30}>30d</option>
              <option value={90}>90d</option>
            </select>
          </div>

          {summary.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : summary.data ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Kpi label="Requests" value={String(summary.data.totalRequests)} />
              <Kpi
                label="Success Rate"
                value={`${Math.round(summary.data.successRate * 100)}%`}
              />
              <Kpi label="Tokens" value={summary.data.totalTokens.toLocaleString()} />
              <Kpi
                label="Cost (USD)"
                value={`$${summary.data.totalCostUsd.toFixed(2)}`}
              />
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">No data</p>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold">Apply Requests Pending Approval</h3>
          {requests.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : !requests.data || requests.data.length === 0 ? (
            <p className="text-xs text-muted-foreground">No pending requests.</p>
          ) : (
            <div className="space-y-2">
              {requests.data.map((request) => (
                <div
                  key={request.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">{request.project?.name || request.projectId}</p>
                    <p className="text-xs text-muted-foreground">
                      Requested by {request.requester?.name || request.requesterId}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {isOwner && (
                      <>
                        <button
                          onClick={() =>
                            reviewRequest.mutate(
                              { id: request.id, approve: true },
                              { onSuccess: () => void refreshAll() },
                            )
                          }
                          disabled={reviewRequest.isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          <Check className="h-3 w-3" /> Approve
                        </button>
                        <button
                          onClick={() =>
                            reviewRequest.mutate(
                              { id: request.id, approve: false },
                              { onSuccess: () => void refreshAll() },
                            )
                          }
                          disabled={reviewRequest.isPending}
                          className="inline-flex items-center gap-1 rounded-md bg-red-600 px-2 py-1 text-xs text-white disabled:opacity-50"
                        >
                          <X className="h-3 w-3" /> Reject
                        </button>
                      </>
                    )}
                    {!isOwner && (
                      <span className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-700">Owner review required</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-border bg-card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold">Recent AI Audits</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={exportLogsJson}
                disabled={!logs.data || logs.data.length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> JSON
              </button>
              <button
                onClick={exportLogsCsv}
                disabled={!logs.data || logs.data.length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> CSV
              </button>
              <button
                onClick={() => exportJsonAsExcel('ai-audit-logs', logs.data || [])}
                disabled={!logs.data || logs.data.length === 0}
                className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
              >
                <Download className="h-3.5 w-3.5" /> Excel
              </button>
              {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                <>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(Number(e.target.value))}
                  className="w-20 rounded-md border border-border px-2 py-1 text-xs"
                />
                <button
                  onClick={() =>
                    purgeAudits.mutate(
                      { retentionDays },
                      { onSuccess: () => void refreshAll() },
                    )
                  }
                  disabled={purgeAudits.isPending}
                  className="rounded-md border border-border px-2 py-1 text-xs hover:bg-muted disabled:opacity-50"
                >
                  Purge Old
                </button>
                </>
              )}
            </div>
          </div>

          {logs.isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : !logs.data || logs.data.length === 0 ? (
            <p className="text-xs text-muted-foreground">No logs.</p>
          ) : (
            <div className="space-y-2">
              {logs.data.map((log) => (
                <div key={log.id} className="flex items-center justify-between rounded border border-border p-2">
                  <div>
                    <p className="text-xs font-medium">{log.feature}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {new Date(log.createdAt).toLocaleString()} • {log.success ? 'Success' : 'Failed'} • ${Number(log.estimatedCostUsd || 0).toFixed(4)}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      deleteAudit.mutate(
                        { id: log.id },
                        { onSuccess: () => void refreshAll() },
                      )
                    }
                    disabled={deleteAudit.isPending}
                    className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground disabled:opacity-50"
                    title="Delete log"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted/40 p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
