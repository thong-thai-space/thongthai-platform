import { ConflictException, Injectable } from '@nestjs/common';
import type { RagAnswerStatus } from '../domain/rag.types';

/**
 * Pattern: State Machine — a RAG answer can only be reviewed while it is a
 * DRAFT. Re-reviewing an already-decided answer is rejected.
 */
@Injectable()
export class RagAnswerPolicy {
  assertReviewable(status: RagAnswerStatus): void {
    if (status !== 'DRAFT') {
      throw new ConflictException(
        `Answer has already been ${status.toLowerCase()}`,
      );
    }
  }
}
