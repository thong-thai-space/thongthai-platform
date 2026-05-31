import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RAG_REPOSITORY } from '../rag.constants';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type { RagAnswerDraft, RagReviewDecision } from '../domain/rag.types';
import { RagAnswerPolicy } from '../policies/rag-answer.policy';

/**
 * Pattern: Use Case — apply a human review decision to a draft answer.
 * Completes the human-in-the-loop gate: only after APPROVE is an answer fit to
 * deliver to the client (delivery itself is a later increment).
 */
@Injectable()
export class ReviewAnswerUseCase {
  constructor(
    @Inject(RAG_REPOSITORY) private readonly repo: RagRepositoryPort,
    private readonly policy: RagAnswerPolicy,
  ) {}

  async execute(
    answerId: string,
    decision: RagReviewDecision,
    reviewerId: string,
  ): Promise<RagAnswerDraft> {
    const existing = await this.repo.findAnswerStatus(answerId);
    if (!existing) {
      throw new NotFoundException('Answer not found');
    }

    this.policy.assertReviewable(existing.status);

    const status = decision === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    return this.repo.applyAnswerReview(answerId, status, reviewerId);
  }
}
