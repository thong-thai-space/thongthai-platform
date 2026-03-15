import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Invoice } from '@/types';

export function useInvoices() {
  return useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: () => api.get('/invoices').then((r) => r.data),
  });
}

export function useInvoice(id: string) {
  return useQuery<Invoice>({
    queryKey: ['invoices', id],
    queryFn: () => api.get(`/invoices/${id}`).then((r) => r.data),
    enabled: !!id,
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, unknown>) => api.post('/invoices', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

export function useUpdateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: Partial<Invoice> & { id: string }) =>
      api.patch(`/invoices/${id}`, data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}
