import { Inject, Injectable } from '@nestjs/common';
import {
  DEFAULT_TOP_K,
  EMBEDDING_PROVIDER,
  MAX_TOP_K,
  RAG_GENERATION,
  RAG_REPOSITORY,
} from '../rag.constants';
import type { EmbeddingProviderPort } from '../domain/embedding.port';
import type { RagGenerationPort } from '../domain/rag-generation.port';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type { QueryKnowledgeInput, RagAnswerDraft } from '../domain/rag.types';

/**
 * Pattern: Use Case — answer a question over a client's knowledge base.
 *
 * Embed query → tenant-scoped similarity search → grounded generation →
 * persist as DRAFT. Human-in-the-loop (plan §3.4 / §5.2): the draft is NOT
 * delivered to the client until a human reviews and approves it.
 */
@Injectable()
export class QueryKnowledgeUseCase {
  constructor(
    @Inject(RAG_REPOSITORY) private readonly repo: RagRepositoryPort,
    @Inject(EMBEDDING_PROVIDER)
    private readonly embedder: EmbeddingProviderPort,
    @Inject(RAG_GENERATION) private readonly generation: RagGenerationPort,
  ) {}

  async execute(input: QueryKnowledgeInput): Promise<RagAnswerDraft> {
    const topK = Math.min(Math.max(input.topK ?? DEFAULT_TOP_K, 1), MAX_TOP_K);

    const queryEmbedding = await this.embedder.embedQuery(input.question);
    const contexts = await this.repo.similaritySearch(
      input.clientId,
      queryEmbedding,
      topK,
    );

    // The generation port is contractually bound to the contexts; with none, it
    // must say it lacks the information rather than hallucinate (plan §5.2).
    const draftAnswer = await this.generation.generateGroundedAnswer({
      question: input.question,
      contexts,
    });

    return this.repo.createAnswerDraft({
      clientId: input.clientId,
      askedById: input.askedById,
      question: input.question,
      draftAnswer,
      citedChunkIds: contexts.map((c) => c.id),
    });
  }
}
