import { useMutation, useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Language } from '@/types';

// ==================== TYPES ====================

export interface ChatResponse {
  conversationId: string;
  message: string;
  usage?: { input_tokens: number; output_tokens: number };
}

export interface ProposalResponse {
  proposal: string;
}

export interface TaskBreakdownResponse {
  milestones: {
    title: string;
    description: string;
    tasks: {
      title: string;
      description: string;
      estimatedHours: number;
      priority: string;
      labels: string[];
    }[];
  }[];
}

export interface CodeReviewResponse {
  review: string;
}

export interface EstimateResponse {
  phases: {
    name: string;
    description: string;
    hours: number;
  }[];
  totalHours: number;
  estimatedCost: {
    vnd: number;
    usd: number;
  };
  timeline: string;
}

export interface ProgressReportResponse {
  report: string;
}

export interface StrategicPlanResponse {
  data: {
    executiveSummary?: string;
    projectHealth?: {
      score?: number;
      status?: 'ON_TRACK' | 'AT_RISK' | 'OFF_TRACK';
      reasons?: string[];
    };
    priorityActions?: {
      title: string;
      owner: 'OWNER' | 'ADMIN' | 'MEMBER' | 'CLIENT';
      impact: 'HIGH' | 'MEDIUM' | 'LOW';
      timeline: string;
      details: string;
    }[];
    deliveryPlan?: {
      next7Days?: string[];
      next30Days?: string[];
      dependencies?: string[];
    };
    riskMatrix?: {
      risk: string;
      probability: 'HIGH' | 'MEDIUM' | 'LOW';
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      mitigation: string;
    }[];
    commercialInsights?: {
      budgetHealth?: string;
      invoiceAlerts?: string[];
      costOptimization?: string[];
    };
    aiAutomationOpportunities?: string[];
    stakeholderUpdates?: {
      forInternalTeam?: string;
      forClient?: string;
    };
    raw?: string;
  };
  usage?: { input_tokens: number; output_tokens: number };
  meta?: {
    projectId?: string;
    locale?: Language;
  };
}

export interface AiApplyRequest {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  projectId: string;
  objective?: string;
  constraints?: string;
  notes?: string;
  requesterId: string;
  reviewerId?: string;
  reviewedAt?: string;
  appliedAt?: string;
  createdAt: string;
  project?: { id: string; name: string };
  requester?: { id: string; name: string; role: string };
  reviewer?: { id: string; name: string; role: string };
}

export interface AiAuditSummary {
  rangeDays: number;
  totalRequests: number;
  successRate: number;
  totalTokens: number;
  totalCostUsd: number;
  avgDurationMs: number;
  byFeature: Array<{
    feature: string;
    requests: number;
    successRate: number;
    costUsd: number;
  }>;
}

export interface AiAuditLog {
  id: string;
  feature: string;
  model?: string;
  success: boolean;
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
  estimatedCostUsd?: string;
  durationMs?: number;
  createdAt: string;
  project?: { id: string; name: string };
  user?: { id: string; name: string; role: string };
}

// ==================== MUTATIONS ====================

export function useAiChat() {
  return useMutation<
    ChatResponse,
    Error,
    { message: string; conversationId?: string; model?: string }
  >({
    mutationFn: (data) => api.post('/ai/chat', data).then((r) => r.data),
  });
}

export function useGenerateProposal() {
  return useMutation<
    ProposalResponse,
    Error,
    { requirements: string; budget?: string; locale?: Language; model?: string }
  >({
    mutationFn: (data) => api.post('/ai/generate-proposal', data).then((r) => r.data),
  });
}

export function useBreakdownTasks() {
  return useMutation<
    TaskBreakdownResponse,
    Error,
    { description: string; techStack: string[]; model?: string }
  >({
    mutationFn: (data) => api.post('/ai/breakdown-tasks', data).then((r) => r.data),
  });
}

export function useReviewCode() {
  return useMutation<
    CodeReviewResponse,
    Error,
    { code: string; language: string; context?: string; model?: string }
  >({
    mutationFn: (data) => api.post('/ai/review-code', data).then((r) => r.data),
  });
}

export function useEstimateProject() {
  return useMutation<
    EstimateResponse,
    Error,
    { requirements: string; locale?: Language; model?: string }
  >({
    mutationFn: (data) => api.post('/ai/estimate', data).then((r) => r.data),
  });
}

export function useProgressReport() {
  return useMutation<
    ProgressReportResponse,
    Error,
    { projectId: string; model?: string; locale?: Language }
  >({
    mutationFn: ({ projectId, ...payload }) =>
      api.post(`/ai/progress-report/${projectId}`, payload).then((r) => r.data),
  });
}

export function useStrategicPlan() {
  return useMutation<
    StrategicPlanResponse,
    Error,
    {
      objective: string;
      constraints?: string;
      projectId?: string;
      locale?: Language;
      includeRiskMatrix?: boolean;
      model?: string;
    }
  >({
    mutationFn: (data) => api.post('/ai/strategic-plan', data).then((r) => r.data),
  });
}

export function useApplyStrategicPlan() {
  return useMutation<
    { requestId: string; status: 'PENDING'; message: string },
    Error,
    {
      projectId: string;
      plan: Record<string, unknown>;
      objective?: string;
      constraints?: string;
    }
  >({
    mutationFn: (data) => api.post('/ai/strategic-plan/apply', data).then((r) => r.data),
  });
}

export function useApplyRequests(status?: 'PENDING' | 'APPROVED' | 'REJECTED') {
  return useQuery<AiApplyRequest[]>({
    queryKey: ['ai-apply-requests', status || 'ALL'],
    queryFn: () =>
      api
        .get('/ai/strategic-plan/apply-requests', {
          params: status ? { status } : undefined,
        })
        .then((r) => r.data),
    staleTime: 15 * 1000,
  });
}

export function useReviewApplyRequest() {
  return useMutation<
    unknown,
    Error,
    { id: string; approve: boolean; notes?: string }
  >({
    mutationFn: ({ id, ...data }) =>
      api.patch(`/ai/strategic-plan/apply-requests/${id}/review`, data).then((r) => r.data),
  });
}

export function useAiAuditSummary(days = 30) {
  return useQuery<AiAuditSummary>({
    queryKey: ['ai-audit-summary', days],
    queryFn: () => api.get('/ai/audit/summary', { params: { days } }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function useAiAuditLogs(limit = 50, days = 30) {
  return useQuery<AiAuditLog[]>({
    queryKey: ['ai-audit-logs', limit, days],
    queryFn: () => api.post('/ai/audit', { limit, days }).then((r) => r.data),
    staleTime: 30 * 1000,
  });
}

export function usePurgeAiAudits() {
  return useMutation<{ retentionDays: number; deletedCount: number }, Error, { retentionDays: number }>({
    mutationFn: (data) => api.post('/ai/audit/purge', data).then((r) => r.data),
  });
}

export function useDeleteAiAudit() {
  return useMutation<unknown, Error, { id: string }>({
    mutationFn: ({ id }) => api.delete(`/ai/audit/${id}`).then((r) => r.data),
  });
}

export function usePublicAiChat() {
  return useMutation<{ message: string }, Error, { message: string }>({
    mutationFn: (data) => api.post('/ai/chat-public', data).then((r) => r.data),
  });
}
