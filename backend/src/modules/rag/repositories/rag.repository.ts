import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../../prisma/prisma.service';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type {
  ChunkEmbedding,
  IngestDocumentInput,
  RagAnswerDraft,
  RagAnswerStatus,
  RagDocumentSummary,
  RetrievedChunk,
} from '../domain/rag.types';

/**
 * Pattern: Repository — Prisma adapter for the RAG knowledge base.
 *
 * The `embedding` column is pgvector (Prisma `Unsupported`), so writes and the
 * similarity search use parameterized `$executeRaw` / `$queryRaw` with a
 * `::vector` cast. Every query is scoped by `clientId` (plan §5.1 isolation).
 */
@Injectable()
export class RagRepository implements RagRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async createDocument(
    input: Omit<IngestDocumentInput, 'text'>,
  ): Promise<{ id: string }> {
    try {
      return await this.prisma.ragDocument.create({
        data: {
          clientId: input.clientId,
          uploadedById: input.uploadedById,
          title: input.title,
          source: input.source,
          mimeType: input.mimeType ?? null,
          originalFilename: input.originalFilename ?? null,
          status: 'PENDING',
        },
        select: { id: true },
      });
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2003'
      ) {
        throw new NotFoundException('Client or uploader not found');
      }
      throw err;
    }
  }

  async saveChunks(
    documentId: string,
    clientId: string,
    chunks: ChunkEmbedding[],
  ): Promise<void> {
    if (chunks.length === 0) return;

    await this.prisma.$transaction(
      chunks.map((chunk) => {
        const vector = toVectorLiteral(chunk.embedding);
        return this.prisma.$executeRaw`
          INSERT INTO rag_chunks (id, "documentId", "clientId", "chunkIndex", content, "tokenCount", embedding, "createdAt")
          VALUES (${randomUUID()}, ${documentId}, ${clientId}, ${chunk.index}, ${chunk.content}, ${chunk.tokenCount ?? null}, ${vector}::vector, NOW())
        `;
      }),
    );
  }

  async markDocumentIndexed(
    documentId: string,
    chunkCount: number,
  ): Promise<void> {
    await this.prisma.ragDocument.update({
      where: { id: documentId },
      data: { status: 'INDEXED', chunkCount, error: null },
    });
  }

  async markDocumentFailed(documentId: string, error: string): Promise<void> {
    await this.prisma.ragDocument.update({
      where: { id: documentId },
      data: { status: 'FAILED', error: error.slice(0, 1000) },
    });
  }

  async similaritySearch(
    clientId: string,
    queryEmbedding: number[],
    topK: number,
  ): Promise<RetrievedChunk[]> {
    const vector = toVectorLiteral(queryEmbedding);

    // `<=>` is pgvector cosine distance; (1 - distance) gives cosine similarity.
    const rows = await this.prisma.$queryRaw<
      { id: string; documentId: string; content: string; score: number }[]
    >`
      SELECT id, "documentId", content, 1 - (embedding <=> ${vector}::vector) AS score
      FROM rag_chunks
      WHERE "clientId" = ${clientId}
      ORDER BY embedding <=> ${vector}::vector
      LIMIT ${topK}
    `;

    return rows.map((r) => ({
      id: r.id,
      documentId: r.documentId,
      content: r.content,
      score: Number(r.score),
    }));
  }

  async createAnswerDraft(input: {
    clientId: string;
    askedById: string;
    question: string;
    draftAnswer: string;
    citedChunkIds: string[];
  }): Promise<RagAnswerDraft> {
    const answer = await this.prisma.ragAnswer.create({
      data: {
        clientId: input.clientId,
        askedById: input.askedById,
        question: input.question,
        draftAnswer: input.draftAnswer,
        citedChunkIds: input.citedChunkIds,
        status: 'DRAFT',
      },
      select: {
        id: true,
        question: true,
        draftAnswer: true,
        citedChunkIds: true,
        status: true,
      },
    });
    return { ...answer, status: answer.status as RagAnswerStatus };
  }

  async listDocuments(clientId: string): Promise<RagDocumentSummary[]> {
    const docs = await this.prisma.ragDocument.findMany({
      where: { clientId },
      select: {
        id: true,
        title: true,
        status: true,
        chunkCount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return docs.map((d) => ({
      ...d,
      status: d.status as RagDocumentSummary['status'],
    }));
  }

  async findAnswerStatus(
    answerId: string,
  ): Promise<{ id: string; status: RagAnswerStatus } | null> {
    const answer = await this.prisma.ragAnswer.findUnique({
      where: { id: answerId },
      select: { id: true, status: true },
    });
    return answer
      ? { id: answer.id, status: answer.status as RagAnswerStatus }
      : null;
  }

  async applyAnswerReview(
    answerId: string,
    status: Exclude<RagAnswerStatus, 'DRAFT'>,
    reviewerId: string,
  ): Promise<RagAnswerDraft> {
    try {
      const answer = await this.prisma.ragAnswer.update({
        where: { id: answerId },
        data: { status, reviewerId, reviewedAt: new Date() },
        select: {
          id: true,
          question: true,
          draftAnswer: true,
          citedChunkIds: true,
          status: true,
        },
      });
      return { ...answer, status: answer.status as RagAnswerStatus };
    } catch (err) {
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2025'
      ) {
        throw new NotFoundException('Answer not found');
      }
      throw err;
    }
  }
}

/** pgvector accepts a `[v1,v2,...]` text literal cast to `::vector`. */
function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(',')}]`;
}
