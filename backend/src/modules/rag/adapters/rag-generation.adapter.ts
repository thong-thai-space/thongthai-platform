import { Inject, Injectable } from '@nestjs/common';
import { AI_PROVIDER_PORT } from '../../ai/ai.constants';
import type { AiProviderPort } from '../../ai/domain/ai.provider.port';
import { AI_MODEL } from '../../ai/support/ai-content.helpers';
import { RAG_ANSWER_MAX_TOKENS } from '../rag.constants';
import type { RagGenerationPort } from '../domain/rag-generation.port';
import type { RetrievedChunk } from '../domain/rag.types';

/**
 * Pattern: Adapter — grounded generation via the shared LLM Provider Router
 * (`AI_PROVIDER_PORT`). The system prompt hard-constrains the model to the
 * retrieved sources (anti-hallucination, plan §5.2): with no/weak context it
 * must decline rather than invent.
 */
@Injectable()
export class RagGenerationAdapter implements RagGenerationPort {
  constructor(
    @Inject(AI_PROVIDER_PORT) private readonly provider: AiProviderPort,
  ) {}

  async generateGroundedAnswer(input: {
    question: string;
    contexts: RetrievedChunk[];
  }): Promise<string> {
    const system = [
      'You are the knowledge-base assistant for Thong Thai Space.',
      'Answer ONLY using the numbered context sources supplied in the user message.',
      'If the sources do not contain enough information to answer, say you do not have',
      'enough information in the provided documents — never use outside knowledge or guess.',
      'Cite the sources you rely on as [Source N]. Reply in the same language as the question.',
    ].join(' ');

    const contextBlock = input.contexts.length
      ? input.contexts
          .map((c, i) => `[Source ${i + 1}]\n${c.content}`)
          .join('\n\n')
      : '(no relevant documents were found for this question)';

    const { text } = await this.provider.createMessage({
      model: AI_MODEL,
      maxTokens: RAG_ANSWER_MAX_TOKENS,
      system,
      messages: [
        {
          role: 'user',
          content: `Context:\n${contextBlock}\n\nQuestion: ${input.question}`,
        },
      ],
    });

    return text.trim();
  }
}
