import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { IngestDocumentUseCase } from './ingest-document.use-case';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type { EmbeddingProviderPort } from '../domain/embedding.port';
import type { TextChunkerPort } from '../domain/text-chunker.port';
import type {
  ChunkEmbedding,
  IngestDocumentInput,
  TextChunk,
} from '../domain/rag.types';

// Pattern: Unit test against ports — fake adapters, real use-case logic.

const baseInput: IngestDocumentInput = {
  clientId: 'client_1',
  uploadedById: 'owner_1',
  title: 'Onboarding Guide',
  source: 'UPLOAD',
  text: 'some content',
};

function buildSubject(opts: {
  chunks?: TextChunk[];
  embed?: (texts: string[]) => Promise<number[][]>;
}) {
  const saved: {
    documentId: string;
    clientId: string;
    chunks: ChunkEmbedding[];
  }[] = [];
  const failed: { documentId: string; error: string }[] = [];
  const indexed: { documentId: string; chunkCount: number }[] = [];

  const repo: RagRepositoryPort = {
    createDocument: jest.fn(async () => ({ id: 'doc_1' })),
    saveChunks: jest.fn(async (documentId, clientId, chunks) => {
      saved.push({ documentId, clientId, chunks });
    }),
    markDocumentIndexed: jest.fn(async (documentId, chunkCount) => {
      indexed.push({ documentId, chunkCount });
    }),
    markDocumentFailed: jest.fn(async (documentId, error) => {
      failed.push({ documentId, error });
    }),
    similaritySearch: jest.fn(),
    createAnswerDraft: jest.fn(),
  };

  const embedder: EmbeddingProviderPort = {
    dimensions: 1024,
    embedDocuments:
      opts.embed ?? jest.fn(async (texts) => texts.map((_, i) => [i, i, i])),
    embedQuery: jest.fn(),
  };

  const chunker: TextChunkerPort = {
    chunk: jest.fn(() => opts.chunks ?? []),
  };

  return {
    useCase: new IngestDocumentUseCase(
      repo as never,
      embedder as never,
      chunker as never,
    ),
    repo,
    saved,
    failed,
    indexed,
  };
}

const twoChunks: TextChunk[] = [
  { index: 0, content: 'chunk a' },
  { index: 1, content: 'chunk b' },
];

describe('IngestDocumentUseCase', () => {
  it('chunks, embeds, persists vectors scoped to the client, and marks INDEXED', async () => {
    const { useCase, saved, indexed } = buildSubject({ chunks: twoChunks });

    const result = await useCase.execute(baseInput);

    expect(result).toEqual({ documentId: 'doc_1', chunkCount: 2 });
    expect(saved).toHaveLength(1);
    expect(saved[0].clientId).toBe('client_1');
    expect(saved[0].chunks.map((c) => c.embedding)).toEqual([
      [0, 0, 0],
      [1, 1, 1],
    ]);
    expect(indexed[0]).toEqual({ documentId: 'doc_1', chunkCount: 2 });
  });

  it('does not pass the raw text into createDocument metadata', async () => {
    const { useCase, repo } = buildSubject({ chunks: twoChunks });
    await useCase.execute(baseInput);
    expect(repo.createDocument).toHaveBeenCalledWith(
      expect.not.objectContaining({ text: expect.anything() }),
    );
  });

  it('marks FAILED and throws BadRequest when the document has no text', async () => {
    const { useCase, failed } = buildSubject({ chunks: [] });
    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(failed[0].documentId).toBe('doc_1');
  });

  it('marks FAILED and throws when embeddings count does not match chunks', async () => {
    const { useCase, failed } = buildSubject({
      chunks: twoChunks,
      embed: async () => [[1, 1, 1]], // only one vector for two chunks
    });
    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(failed[0].error).toMatch(/mismatch/i);
  });

  it('marks FAILED and surfaces an error when the embedder throws', async () => {
    const { useCase, failed } = buildSubject({
      chunks: twoChunks,
      embed: async () => {
        throw new Error('Voyage 503');
      },
    });
    await expect(useCase.execute(baseInput)).rejects.toBeInstanceOf(
      InternalServerErrorException,
    );
    expect(failed[0].error).toBe('Voyage 503');
  });
});
