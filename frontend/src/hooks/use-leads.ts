import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';

export type LeadStatus =
  | 'NEW'
  | 'REVIEWED'
  | 'CONTACTED'
  | 'CONVERTED'
  | 'CLOSED';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string | null;
  service: string | null;
  budget: string | null;
  message: string;
  status: LeadStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LeadListResult {
  items: Lead[];
  total: number;
  page: number;
  pageSize: number;
}

interface ListLeadsParams {
  status?: LeadStatus;
  page?: number;
  pageSize?: number;
}

const leadsKey = (params: ListLeadsParams) => ['leads', params] as const;

export function useLeads(params: ListLeadsParams = {}) {
  return useQuery<LeadListResult>({
    queryKey: leadsKey(params),
    queryFn: async () => {
      const search = new URLSearchParams();
      if (params.status) search.set('status', params.status);
      if (params.page) search.set('page', String(params.page));
      if (params.pageSize) search.set('pageSize', String(params.pageSize));
      const qs = search.toString();
      const url = qs ? `/contact?${qs}` : '/contact';
      const { data } = await api.get<LeadListResult>(url);
      return data;
    },
  });
}

export function useUpdateLeadStatus() {
  const qc = useQueryClient();
  return useMutation<Lead, unknown, { id: string; status: LeadStatus }>({
    mutationFn: async ({ id, status }) => {
      const { data } = await api.patch<Lead>(`/contact/${id}/status`, {
        status,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leads'] });
    },
  });
}

// Pattern: State Machine mirror — keep the frontend in lockstep with
// backend ContactStatusPolicy. If the policy changes, this map must follow.
export const LEAD_ALLOWED_NEXT: Record<LeadStatus, LeadStatus[]> = {
  NEW: ['REVIEWED', 'CLOSED'],
  REVIEWED: ['CONTACTED', 'CLOSED'],
  CONTACTED: ['CONVERTED', 'CLOSED'],
  CONVERTED: ['CLOSED'],
  CLOSED: [],
};
