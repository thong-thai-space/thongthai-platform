import type { RetrievedChunk } from './rag.types';

/**
 * Pattern: Port — grounded answer generation.
 *
 * Implemented by an adapter that delegates to the `ai` module (LLM) with a
 * system prompt constraining the model to the retrieved contexts only — the
 * anti-hallucination guarantee from plan §5.2. If no contexts are supplied the
 * adapter must say it lacks the information rather than inventing an answer.
 */
export interface RagGenerationPort {
  generateGroundedAnswer(input: {
    question: string;
    contexts: RetrievedChunk[];
  }): Promise<string>;
}
