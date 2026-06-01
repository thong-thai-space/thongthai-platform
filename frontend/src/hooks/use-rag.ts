import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type {
  RagAnswerDraft,
  RagDocumentSummary,
  RagIngestResult,
} from '@/types';

// ─── Query keys ──────────────────────────────────────────────────────────────

export const ragKeys = {
  all: ['rag'] as const,
  documents: (clientId: string) => ['rag', 'documents', clientId] as const,
};

// ─── Documents ───────────────────────────────────────────────────────────────

/** Tenant-scoped list of a client's ingested documents. */
export function useRagDocuments(clientId: string) {
  return useQuery<RagDocumentSummary[]>({
    queryKey: ragKeys.documents(clientId),
    queryFn: () =>
      api
        .get('/rag/documents', { params: { clientId } })
        .then((r) => r.data as RagDocumentSummary[]),
    enabled: !!clientId,
    // Documents move PENDING → PROCESSING → INDEXED asynchronously; poll while
    // any are still in flight so the status badges settle without a manual reload.
    refetchInterval: (query) =>
      (query.state.data ?? []).some(
        (d) => d.status === 'PENDING' || d.status === 'PROCESSING',
      )
        ? 4000
        : false,
  });
}

export interface IngestTextInput {
  clientId: string;
  title: string;
  text: string;
}

/** Ingest pasted text as a TEXT-source document. */
export function useIngestText() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: IngestTextInput) =>
      api.post('/rag/documents', input).then((r) => r.data as RagIngestResult),
    onSuccess: (_data, input) =>
      qc.invalidateQueries({ queryKey: ragKeys.documents(input.clientId) }),
  });
}

export interface UploadDocumentInput {
  clientId: string;
  file: File;
  title?: string;
}

/** Upload a PDF/DOCX/TXT/MD file for parsing + ingestion. */
export function useUploadDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ clientId, file, title }: UploadDocumentInput) => {
      const form = new FormData();
      form.append('file', file);
      form.append('clientId', clientId);
      if (title?.trim()) form.append('title', title.trim());
      return api
        .post('/rag/documents/upload', form)
        .then((r) => r.data as RagIngestResult);
    },
    onSuccess: (_data, input) =>
      qc.invalidateQueries({ queryKey: ragKeys.documents(input.clientId) }),
  });
}

// ─── Query + review ──────────────────────────────────────────────────────────

export interface QueryKnowledgeInput {
  clientId: string;
  question: string;
  topK?: number;
}

/** Ask the knowledge base; returns a DRAFT answer pending human review. */
export function useQueryKnowledge() {
  return useMutation({
    mutationFn: (input: QueryKnowledgeInput) =>
      api.post('/rag/query', input).then((r) => r.data as RagAnswerDraft),
  });
}

export interface ReviewAnswerInput {
  answerId: string;
  decision: 'APPROVE' | 'REJECT';
}

/** Human-in-the-loop: approve or reject a draft answer. */
export function useReviewAnswer() {
  return useMutation({
    mutationFn: ({ answerId, decision }: ReviewAnswerInput) =>
      api
        .post(`/rag/answers/${answerId}/review`, { decision })
        .then((r) => r.data as RagAnswerDraft),
  });
}
