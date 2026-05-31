import type {
  ChunkEmbedding,
  IngestDocumentInput,
  RagAnswerDraft,
  RagAnswerStatus,
  RagDocumentSummary,
  RetrievedChunk,
} from './rag.types';

/**
 * Pattern: Repository Port.
 *
 * Every read/write is scoped by `clientId` for tenant isolation (plan §5.1) —
 * similarity search must NEVER cross tenants.
 */
export interface RagRepositoryPort {
  /** Create a PENDING document row; returns its id. */
  createDocument(
    input: Omit<IngestDocumentInput, 'text'>,
  ): Promise<{ id: string }>;

  /** Persist embedded chunks for a document (pgvector). */
  saveChunks(
    documentId: string,
    clientId: string,
    chunks: ChunkEmbedding[],
  ): Promise<void>;

  markDocumentIndexed(documentId: string, chunkCount: number): Promise<void>;
  markDocumentFailed(documentId: string, error: string): Promise<void>;

  /** Tenant-scoped vector similarity search (ORDER BY embedding <=> query LIMIT topK). */
  similaritySearch(
    clientId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]>;

  /** Persist a DRAFT answer for human review (HITL — plan §3.4 / §5.2). */
  createAnswerDraft(input: {
    clientId: string;
    askedById: string;
    question: string;
    draftAnswer: string;
    citedChunkIds: string[];
  }): Promise<RagAnswerDraft>;

  /** List a client's documents and their ingest status (tenant-scoped). */
  listDocuments(clientId: string): Promise<RagDocumentSummary[]>;

  /** Lightweight status lookup for the review state-machine check. */
  findAnswerStatus(
    answerId: string,
  ): Promise<{ id: string; status: RagAnswerStatus } | null>;

  /** Apply a human review decision to a draft answer. */
  applyAnswerReview(
    answerId: string,
    status: Exclude<RagAnswerStatus, 'DRAFT'>,
    reviewerId: string,
  ): Promise<RagAnswerDraft>;
}
