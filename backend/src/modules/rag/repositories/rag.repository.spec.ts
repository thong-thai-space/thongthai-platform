import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { RagRepository } from './rag.repository';

// Pattern: Repository unit test — mock PrismaService, assert SQL calls and
// domain-mapped exceptions; no DB required.

function buildPrismaMock() {
  const ragDocument = {
    create: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  };
  const ragAnswer = {
    create: jest.fn(),
    update: jest.fn(),
    findUnique: jest.fn(),
  };
  const $executeRaw = jest.fn().mockResolvedValue(1);
  const $queryRaw = jest.fn();
  const $transaction = jest.fn(async (ops: unknown[]) => {
    // Simulate running each promise/call in the array.
    return Promise.all(ops as Promise<unknown>[]);
  });

  return {
    ragDocument,
    ragAnswer,
    $executeRaw,
    $queryRaw,
    $transaction,
  };
}

function buildRepo() {
  const prisma = buildPrismaMock();
  const repo = new RagRepository(prisma as never);
  return { repo, prisma };
}

// ---------------------------------------------------------------------------
// createDocument
// ---------------------------------------------------------------------------

describe('RagRepository.createDocument', () => {
  it('creates a PENDING document and returns its id', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragDocument.create.mockResolvedValue({ id: 'doc_1' });

    const result = await repo.createDocument({
      clientId: 'client_1',
      uploadedById: 'user_1',
      title: 'Guide',
      source: 'TEXT',
    });

    expect(result).toEqual({ id: 'doc_1' });
    expect(prisma.ragDocument.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'PENDING', clientId: 'client_1' }),
      }),
    );
  });

  it('maps a P2003 FK violation to NotFoundException', async () => {
    const { repo, prisma } = buildRepo();
    const fkError = new Prisma.PrismaClientKnownRequestError('fk', {
      code: 'P2003',
      clientVersion: '5',
    });
    prisma.ragDocument.create.mockRejectedValue(fkError);

    await expect(
      repo.createDocument({
        clientId: 'missing',
        uploadedById: 'user_1',
        title: 'x',
        source: 'UPLOAD',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('re-throws unrecognised Prisma errors', async () => {
    const { repo, prisma } = buildRepo();
    const otherError = new Prisma.PrismaClientKnownRequestError('unique', {
      code: 'P2002',
      clientVersion: '5',
    });
    prisma.ragDocument.create.mockRejectedValue(otherError);

    await expect(
      repo.createDocument({ clientId: 'c', uploadedById: 'u', title: 't', source: 'TEXT' }),
    ).rejects.toBe(otherError);
  });
});

// ---------------------------------------------------------------------------
// saveChunks
// ---------------------------------------------------------------------------

describe('RagRepository.saveChunks', () => {
  it('short-circuits and does not open a transaction when chunks is empty', async () => {
    const { repo, prisma } = buildRepo();

    await repo.saveChunks('doc_1', 'client_1', []);

    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('wraps one $executeRaw call per chunk in a transaction', async () => {
    const { repo, prisma } = buildRepo();

    const chunks = [
      { index: 0, content: 'first chunk', embedding: [0.1, 0.2] },
      { index: 1, content: 'second chunk', embedding: [0.3, 0.4] },
    ];

    await repo.saveChunks('doc_1', 'client_1', chunks);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    // $transaction receives an array with one promise per chunk
    const [ops] = prisma.$transaction.mock.calls[0] as [unknown[]];
    expect(ops).toHaveLength(2);
  });

  it('formats embeddings as [v1,v2,...] vector literals', async () => {
    const { repo, prisma } = buildRepo();

    const executeRawCalls: string[] = [];
    // Capture what string gets embedded in the tagged template call
    prisma.$executeRaw.mockImplementation(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        executeRawCalls.push(values.join('|'));
        return Promise.resolve(1);
      },
    );

    await repo.saveChunks('doc_1', 'client_1', [
      { index: 0, content: 'hello', embedding: [1, 2, 3] },
    ]);

    // The vector literal `[1,2,3]` should appear in the $executeRaw values
    expect(executeRawCalls[0]).toContain('[1,2,3]');
  });
});

// ---------------------------------------------------------------------------
// markDocumentIndexed / markDocumentFailed
// ---------------------------------------------------------------------------

describe('RagRepository.markDocumentIndexed', () => {
  it('sets status=INDEXED, chunkCount, and clears error', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragDocument.update.mockResolvedValue({});

    await repo.markDocumentIndexed('doc_1', 5);

    expect(prisma.ragDocument.update).toHaveBeenCalledWith({
      where: { id: 'doc_1' },
      data: { status: 'INDEXED', chunkCount: 5, error: null },
    });
  });
});

describe('RagRepository.markDocumentFailed', () => {
  it('sets status=FAILED and stores the error message', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragDocument.update.mockResolvedValue({});

    await repo.markDocumentFailed('doc_1', 'embedder timeout');

    expect(prisma.ragDocument.update).toHaveBeenCalledWith({
      where: { id: 'doc_1' },
      data: { status: 'FAILED', error: 'embedder timeout' },
    });
  });

  it('truncates the error message to 1000 characters', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragDocument.update.mockResolvedValue({});
    const longError = 'x'.repeat(2000);

    await repo.markDocumentFailed('doc_1', longError);

    const { data } = prisma.ragDocument.update.mock.calls[0][0] as {
      data: { error: string };
    };
    expect(data.error).toHaveLength(1000);
  });
});

// ---------------------------------------------------------------------------
// similaritySearch
// ---------------------------------------------------------------------------

describe('RagRepository.similaritySearch', () => {
  it('returns mapped RetrievedChunk[] from raw rows', async () => {
    const { repo, prisma } = buildRepo();
    prisma.$queryRaw.mockResolvedValue([
      { id: 'chunk_1', documentId: 'doc_1', content: 'relevant text', score: '0.92' },
    ]);

    const results = await repo.similaritySearch('client_1', [0.1, 0.2, 0.3], 5);

    expect(results).toEqual([
      { id: 'chunk_1', documentId: 'doc_1', content: 'relevant text', score: 0.92 },
    ]);
    // score must be Number, not a string (Postgres returns numeric as string)
    expect(typeof results[0].score).toBe('number');
  });

  it('returns an empty array when no chunks match', async () => {
    const { repo, prisma } = buildRepo();
    prisma.$queryRaw.mockResolvedValue([]);

    const results = await repo.similaritySearch('client_1', [0.1], 5);

    expect(results).toEqual([]);
  });

  it('passes the vector literal [v1,...] in the raw query', async () => {
    const { repo, prisma } = buildRepo();
    const capturedValues: string[] = [];
    prisma.$queryRaw.mockImplementation(
      (strings: TemplateStringsArray, ...values: unknown[]) => {
        capturedValues.push(...(values as string[]));
        return Promise.resolve([]);
      },
    );

    await repo.similaritySearch('client_X', [4, 5, 6], 3);

    expect(capturedValues).toContain('[4,5,6]');
    expect(capturedValues).toContain('client_X');
  });
});

// ---------------------------------------------------------------------------
// createAnswerDraft
// ---------------------------------------------------------------------------

describe('RagRepository.createAnswerDraft', () => {
  it('persists a DRAFT answer and returns the full draft shape', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragAnswer.create.mockResolvedValue({
      id: 'ans_1',
      question: 'What is RAG?',
      draftAnswer: 'It stands for Retrieval-Augmented Generation.',
      citedChunkIds: ['chunk_1'],
      status: 'DRAFT',
    });

    const draft = await repo.createAnswerDraft({
      clientId: 'client_1',
      askedById: 'user_1',
      question: 'What is RAG?',
      draftAnswer: 'It stands for Retrieval-Augmented Generation.',
      citedChunkIds: ['chunk_1'],
    });

    expect(draft).toEqual({
      id: 'ans_1',
      question: 'What is RAG?',
      draftAnswer: 'It stands for Retrieval-Augmented Generation.',
      citedChunkIds: ['chunk_1'],
      status: 'DRAFT',
    });
    expect(prisma.ragAnswer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DRAFT' }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// listDocuments
// ---------------------------------------------------------------------------

describe('RagRepository.listDocuments', () => {
  it('returns documents scoped to the given clientId', async () => {
    const { repo, prisma } = buildRepo();
    const now = new Date();
    prisma.ragDocument.findMany.mockResolvedValue([
      { id: 'doc_1', title: 'Guide', status: 'INDEXED', chunkCount: 3, createdAt: now },
    ]);

    const docs = await repo.listDocuments('client_1');

    expect(docs).toEqual([
      { id: 'doc_1', title: 'Guide', status: 'INDEXED', chunkCount: 3, createdAt: now },
    ]);
    expect(prisma.ragDocument.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { clientId: 'client_1' } }),
    );
  });

  it('returns an empty array when the client has no documents', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragDocument.findMany.mockResolvedValue([]);

    const docs = await repo.listDocuments('client_empty');

    expect(docs).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// findAnswerStatus
// ---------------------------------------------------------------------------

describe('RagRepository.findAnswerStatus', () => {
  it('returns { id, status } when the answer exists', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragAnswer.findUnique.mockResolvedValue({ id: 'ans_1', status: 'APPROVED' });

    const result = await repo.findAnswerStatus('ans_1');

    expect(result).toEqual({ id: 'ans_1', status: 'APPROVED' });
  });

  it('returns null when the answer does not exist', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragAnswer.findUnique.mockResolvedValue(null);

    const result = await repo.findAnswerStatus('missing');

    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// applyAnswerReview
// ---------------------------------------------------------------------------

describe('RagRepository.applyAnswerReview', () => {
  it('updates status, reviewerId and reviewedAt, returns the updated draft', async () => {
    const { repo, prisma } = buildRepo();
    prisma.ragAnswer.update.mockResolvedValue({
      id: 'ans_1',
      question: 'Q?',
      draftAnswer: 'A.',
      citedChunkIds: [],
      status: 'APPROVED',
    });

    const result = await repo.applyAnswerReview('ans_1', 'APPROVED', 'reviewer_1');

    expect(result.status).toBe('APPROVED');
    const { data } = prisma.ragAnswer.update.mock.calls[0][0] as {
      data: { status: string; reviewerId: string; reviewedAt: Date };
    };
    expect(data.status).toBe('APPROVED');
    expect(data.reviewerId).toBe('reviewer_1');
    expect(data.reviewedAt).toBeInstanceOf(Date);
  });

  it('maps a P2025 record-not-found error to NotFoundException', async () => {
    const { repo, prisma } = buildRepo();
    const notFoundError = new Prisma.PrismaClientKnownRequestError('not found', {
      code: 'P2025',
      clientVersion: '5',
    });
    prisma.ragAnswer.update.mockRejectedValue(notFoundError);

    await expect(
      repo.applyAnswerReview('missing', 'REJECTED', 'reviewer_1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('re-throws unrecognised errors from applyAnswerReview', async () => {
    const { repo, prisma } = buildRepo();
    const boom = new Error('unexpected DB failure');
    prisma.ragAnswer.update.mockRejectedValue(boom);

    await expect(
      repo.applyAnswerReview('ans_1', 'REJECTED', 'reviewer_1'),
    ).rejects.toBe(boom);
  });
});
