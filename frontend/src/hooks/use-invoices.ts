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

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/invoices/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['invoices'] }),
  });
}

// ─── Binary downloads (server-rendered PDF / XLSX) ───────────────────────────

interface BlobResponse {
  data: Blob;
  headers: Record<string, string>;
}

/** Saves a blob response, honouring the server's Content-Disposition filename. */
function saveBlob(res: BlobResponse, fallbackName: string) {
  if (typeof window === 'undefined') return;
  const disposition = res.headers['content-disposition'];
  const match = disposition?.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const url = URL.createObjectURL(res.data);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** Download a server-rendered invoice PDF (proper Vietnamese typography). */
export async function downloadInvoicePdf(id: string, invoiceNumber: string) {
  const res = await api.get(`/invoices/${id}/pdf`, { responseType: 'blob' });
  saveBlob(res as unknown as BlobResponse, `invoice-${invoiceNumber}.pdf`);
}

/** Download the revenue report spreadsheet (OWNER/ADMIN). */
export async function downloadRevenueReport() {
  const res = await api.get('/invoices/report/revenue', { responseType: 'blob' });
  const stamp = new Date().toISOString().slice(0, 10);
  saveBlob(res as unknown as BlobResponse, `revenue-report-${stamp}.xlsx`);
}

export interface QuoteItemInput {
  description: string;
  quantity: number;
  unitPrice: number;
}

export interface QuoteInput {
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  currency: 'VND' | 'USD';
  validUntil?: string;
  introNote?: string;
  taxRate?: number;
  discount?: number;
  items: QuoteItemInput[];
}

/** Generate and download a pre-sale quote PDF (OWNER/ADMIN, not persisted). */
export async function downloadQuotePdf(quote: QuoteInput) {
  const res = await api.post('/invoices/quote/pdf', quote, {
    responseType: 'blob',
  });
  saveBlob(res as unknown as BlobResponse, 'quote.pdf');
}
