import { Inject, Injectable } from '@nestjs/common';
import { DOCUMENT_PARSER, RAG_REPOSITORY } from './rag.constants';
import type { RagRepositoryPort } from './domain/rag.repository.port';
import type {
  DocumentParserPort,
  ParsableFile,
} from './domain/document-parser.port';
import type { RagReviewDecision } from './domain/rag.types';
import { IngestDocumentUseCase } from './use-cases/ingest-document.use-case';
import { QueryKnowledgeUseCase } from './use-cases/query-knowledge.use-case';
import { ReviewAnswerUseCase } from './use-cases/review-answer.use-case';

/**
 * Pattern: Facade — thin controller-facing API over the RAG use-cases.
 * `listDocuments` is a trivial tenant-scoped read, so it goes straight to the
 * port (no use-case ceremony for a query with no domain logic).
 */
@Injectable()
export class RagService {
  constructor(
    private readonly ingestDocument: IngestDocumentUseCase,
    private readonly queryKnowledge: QueryKnowledgeUseCase,
    private readonly reviewAnswer: ReviewAnswerUseCase,
    @Inject(RAG_REPOSITORY) private readonly repo: RagRepositoryPort,
    @Inject(DOCUMENT_PARSER) private readonly parser: DocumentParserPort,
  ) {}

  ingestText(input: {
    clientId: string;
    uploadedById: string;
    title: string;
    text: string;
  }) {
    return this.ingestDocument.execute({ ...input, source: 'TEXT' });
  }

  /** Parse an uploaded file to text, then ingest it as an UPLOAD-source document. */
  async ingestFile(input: {
    clientId: string;
    uploadedById: string;
    title: string;
    file: ParsableFile;
  }) {
    const text = await this.parser.extractText(input.file);
    return this.ingestDocument.execute({
      clientId: input.clientId,
      uploadedById: input.uploadedById,
      title: input.title,
      source: 'UPLOAD',
      text,
      mimeType: input.file.mimeType,
      originalFilename: input.file.filename,
    });
  }

  listDocuments(clientId: string) {
    return this.repo.listDocuments(clientId);
  }

  query(input: {
    clientId: string;
    askedById: string;
    question: string;
    topK?: number;
  }) {
    return this.queryKnowledge.execute(input);
  }

  review(answerId: string, decision: RagReviewDecision, reviewerId: string) {
    return this.reviewAnswer.execute(answerId, decision, reviewerId);
  }
}
