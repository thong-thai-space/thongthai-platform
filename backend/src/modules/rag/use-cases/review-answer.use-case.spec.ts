import { ConflictException, NotFoundException } from '@nestjs/common';
import { ReviewAnswerUseCase } from './review-answer.use-case';
import { RagAnswerPolicy } from '../policies/rag-answer.policy';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type { RagAnswerStatus } from '../domain/rag.types';

// Pattern: Unit test against port — fake repo, real policy + use-case logic.

function buildSubject(currentStatus: RagAnswerStatus | null) {
  const reviews: { answerId: string; status: string; reviewerId: string }[] =
    [];

  const repo: RagRepositoryPort = {
    createDocument: jest.fn(),
    saveChunks: jest.fn(),
    markDocumentIndexed: jest.fn(),
    markDocumentFailed: jest.fn(),
    similaritySearch: jest.fn(),
    createAnswerDraft: jest.fn(),
    listDocuments: jest.fn(),
    findAnswerStatus: jest.fn(async (id) =>
      currentStatus ? { id, status: currentStatus } : null,
    ),
    applyAnswerReview: jest.fn(async (answerId, status, reviewerId) => {
      reviews.push({ answerId, status, reviewerId });
      return {
        id: answerId,
        question: 'q',
        draftAnswer: 'a',
        citedChunkIds: [],
        status,
      };
    }),
  };

  return {
    useCase: new ReviewAnswerUseCase(repo as never, new RagAnswerPolicy()),
    reviews,
  };
}

describe('ReviewAnswerUseCase', () => {
  it('approves a DRAFT answer', async () => {
    const { useCase, reviews } = buildSubject('DRAFT');
    const result = await useCase.execute('ans_1', 'APPROVE', 'rev_1');
    expect(result.status).toBe('APPROVED');
    expect(reviews[0]).toEqual({
      answerId: 'ans_1',
      status: 'APPROVED',
      reviewerId: 'rev_1',
    });
  });

  it('rejects a DRAFT answer', async () => {
    const { useCase, reviews } = buildSubject('DRAFT');
    const result = await useCase.execute('ans_1', 'REJECT', 'rev_1');
    expect(result.status).toBe('REJECTED');
    expect(reviews[0].status).toBe('REJECTED');
  });

  it('throws NotFound when the answer does not exist', async () => {
    const { useCase } = buildSubject(null);
    await expect(
      useCase.execute('missing', 'APPROVE', 'rev_1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws Conflict when the answer was already reviewed', async () => {
    const { useCase, reviews } = buildSubject('APPROVED');
    await expect(
      useCase.execute('ans_1', 'REJECT', 'rev_1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(reviews).toHaveLength(0);
  });
});
