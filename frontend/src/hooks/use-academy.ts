import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  MyPlaybookDetail,
  MyPlaybookSummary,
  Playbook,
  PlaybookAssignee,
  PlaybookListResult,
  PlaybookStatus,
} from '@/types';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const academyKeys = {
  all: ['academy'] as const,
  adminList: (status?: PlaybookStatus) =>
    ['academy', 'admin', 'playbooks', status ?? 'ALL'] as const,
  playbook: (id: string) => ['academy', 'admin', 'playbook', id] as const,
  assignees: (id: string) => ['academy', 'admin', 'assignees', id] as const,
  mine: ['academy', 'mine'] as const,
  mineOne: (assignmentId: string) =>
    ['academy', 'mine', assignmentId] as const,
};

// ─── Admin: authoring ────────────────────────────────────────────────────────

export function useAdminPlaybooks(status?: PlaybookStatus) {
  return useQuery<PlaybookListResult>({
    queryKey: academyKeys.adminList(status),
    queryFn: () =>
      api
        .get('/admin/playbooks', { params: status ? { status } : {} })
        .then((r) => r.data as PlaybookListResult),
  });
}

export function usePlaybook(id: string) {
  return useQuery<Playbook>({
    queryKey: academyKeys.playbook(id),
    queryFn: () =>
      api.get(`/admin/playbooks/${id}`).then((r) => r.data as Playbook),
    enabled: !!id,
  });
}

export interface PlaybookInput {
  title: string;
  slug: string;
  summary?: string;
  contentMdx: string;
  tags?: string[];
}

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PlaybookInput) =>
      api.post('/admin/playbooks', input).then((r) => r.data as Playbook),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: academyKeys.all }),
  });
}

export function useUpdatePlaybook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<PlaybookInput>) =>
      api
        .patch(`/admin/playbooks/${id}`, input)
        .then((r) => r.data as Playbook),
    onSuccess: () => qc.invalidateQueries({ queryKey: academyKeys.all }),
  });
}

/** Lifecycle transitions share one hook — action picks the endpoint. */
export function usePlaybookLifecycle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: 'publish' | 'unpublish' | 'archive') =>
      api
        .post(`/admin/playbooks/${id}/${action}`)
        .then((r) => r.data as Playbook),
    onSuccess: () => qc.invalidateQueries({ queryKey: academyKeys.all }),
  });
}

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/admin/playbooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: academyKeys.all }),
  });
}

// ─── Admin: delivery ─────────────────────────────────────────────────────────

export function usePlaybookAssignees(playbookId: string) {
  return useQuery<PlaybookAssignee[]>({
    queryKey: academyKeys.assignees(playbookId),
    queryFn: () =>
      api
        .get(`/admin/playbooks/${playbookId}/assignments`)
        .then((r) => r.data as PlaybookAssignee[]),
    enabled: !!playbookId,
  });
}

export function useAssignPlaybook(playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (clientId: string) =>
      api
        .post(`/admin/playbooks/${playbookId}/assignments`, { clientId })
        .then((r) => r.data),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: academyKeys.assignees(playbookId) }),
  });
}

export function useUnassignPlaybook(playbookId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (assignmentId: string) =>
      api.delete(`/admin/playbook-assignments/${assignmentId}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: academyKeys.assignees(playbookId) }),
  });
}

// ─── Client portal ───────────────────────────────────────────────────────────

export function useMyPlaybooks() {
  return useQuery<MyPlaybookSummary[]>({
    queryKey: academyKeys.mine,
    queryFn: () =>
      api.get('/academy/playbooks').then((r) => r.data as MyPlaybookSummary[]),
  });
}

export function useMyPlaybook(assignmentId: string) {
  return useQuery<MyPlaybookDetail>({
    queryKey: academyKeys.mineOne(assignmentId),
    queryFn: () =>
      api
        .get(`/academy/playbooks/${assignmentId}`)
        .then((r) => r.data as MyPlaybookDetail),
    enabled: !!assignmentId,
  });
}

export function useUpdateProgress(assignmentId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (action: 'START' | 'COMPLETE') =>
      api
        .post(`/academy/playbooks/${assignmentId}/progress`, { action })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: academyKeys.mine });
      qc.invalidateQueries({ queryKey: academyKeys.mineOne(assignmentId) });
    },
  });
}
