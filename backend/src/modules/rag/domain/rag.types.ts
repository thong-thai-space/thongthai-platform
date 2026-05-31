// Pattern: Domain types — depend on nothing outside this module.

export type RagDocumentSource = 'UPLOAD' | 'TEXT' | 'URL';
export type RagAnswerStatus = 'DRAFT' | 'APPROVED' | 'REJECTED';

export interface TextChunk {
  index: number;
  content: string;
  /** Rough token estimate (chars / 4) — for budgeting, not billing. */
  tokenCount?: number;
}

export interface ChunkEmbedding extends TextChunk {
  embedding: number[];
}

export interface RetrievedChunk {
  id: string;
  documentId: string;
  content: string;
  /** Cosine similarity in [0,1] — higher is closer. */
  score: number;
}

export interface IngestDocumentInput {
  /** Tenant scope — the client (User with role CLIENT) who owns this document. */
  clientId: string;
  /** The staff/owner who uploaded it. */
  uploadedById: string;
  title: string;
  source: RagDocumentSource;
  text: string;
  mimeType?: string;
  originalFilename?: string;
}

export interface IngestResult {
  documentId: string;
  chunkCount: number;
}

export interface QueryKnowledgeInput {
  clientId: string;
  askedById: string;
  question: string;
  topK?: number;
}

export interface RagAnswerDraft {
  id: string;
  question: string;
  draftAnswer: string;
  citedChunkIds: string[];
  status: RagAnswerStatus;
}

export type RagDocumentStatus = 'PENDING' | 'PROCESSING' | 'INDEXED' | 'FAILED';

export type RagReviewDecision = 'APPROVE' | 'REJECT';

export interface RagDocumentSummary {
  id: string;
  title: string;
  status: RagDocumentStatus;
  chunkCount: number;
  createdAt: Date;
}
