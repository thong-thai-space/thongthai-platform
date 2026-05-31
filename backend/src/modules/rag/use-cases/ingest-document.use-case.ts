import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  EMBEDDING_PROVIDER,
  RAG_REPOSITORY,
  TEXT_CHUNKER,
} from '../rag.constants';
import type { EmbeddingProviderPort } from '../domain/embedding.port';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type { TextChunkerPort } from '../domain/text-chunker.port';
import type {
  ChunkEmbedding,
  IngestDocumentInput,
  IngestResult,
} from '../domain/rag.types';

/**
 * Pattern: Use Case — ingest a client document into its knowledge base.
 *
 * Flow: create PENDING doc → chunk → embed (batched) → persist chunks + vectors
 * → mark INDEXED. Any failure marks the document FAILED (no silent catch).
 * Tenant isolation: every write carries the document's `clientId`.
 */
@Injectable()
export class IngestDocumentUseCase {
  constructor(
    @Inject(RAG_REPOSITORY) private readonly repo: RagRepositoryPort,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embedder: EmbeddingProviderPort,
    @Inject(TEXT_CHUNKER) private readonly chunker: TextChunkerPort,
  ) {}

  async execute(input: IngestDocumentInput): Promise<IngestResult> {
    const { text, ...meta } = input;
    const { id: documentId } = await this.repo.createDocument(meta);

    try {
      const chunks = this.chunker.chunk(text);
      if (chunks.length === 0) {
        await this.repo.markDocumentFailed(
          documentId,
          'Document has no extractable text',
        );
        throw new BadRequestException('Document has no extractable text');
      }

      const vectors = await this.embedder.embedDocuments(
        chunks.map((c) => c.content),
      );
      if (vectors.length !== chunks.length) {
        await this.repo.markDocumentFailed(
          documentId,
          'Embedding provider returned a mismatched batch',
        );
        throw new InternalServerErrorException(
          'Embedding provider returned a mismatched batch',
        );
      }

      const embedded: ChunkEmbedding[] = chunks.map((chunk, i) => ({
        ...chunk,
        embedding: vectors[i],
      }));

      await this.repo.saveChunks(documentId, input.clientId, embedded);
      await this.repo.markDocumentIndexed(documentId, embedded.length);

      return { documentId, chunkCount: embedded.length };
    } catch (err) {
      // Domain errors above already flagged the doc — rethrow as-is.
      if (
        err instanceof BadRequestException ||
        err instanceof InternalServerErrorException
      ) {
        throw err;
      }
      // Unexpected failure (e.g. embedding provider down) — flag, then surface.
      await this.repo.markDocumentFailed(
        documentId,
        err instanceof Error ? err.message : 'Ingestion failed',
      );
      throw new InternalServerErrorException('Failed to ingest document');
    }
  }
}
