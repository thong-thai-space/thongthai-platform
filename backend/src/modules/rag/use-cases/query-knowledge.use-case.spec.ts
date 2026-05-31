import { QueryKnowledgeUseCase } from './query-knowledge.use-case';
import type { RagRepositoryPort } from '../domain/rag.repository.port';
import type { EmbeddingProviderPort } from '../domain/embedding.port';
import type { RagGenerationPort } from '../domain/rag-generation.port';
import type { RetrievedChunk } from '../domain/rag.types';

// Pattern: Unit test against ports — fake adapters, real use-case logic.

function buildSubject(retrieved: RetrievedChunk[] = []) {
  const searchCalls: { clientId: string; topK: number }[] = [];
  const genCalls: { question: string; contexts: RetrievedChunk[] }[] = [];

  const repo: RagRepositoryPort = {
    createDocument: jest.fn(),
    saveChunks: jest.fn(),
    markDocumentIndexed: jest.fn(),
    markDocumentFailed: jest.fn(),
    similaritySearch: jest.fn(async (clientId, _embedding, topK) => {
      searchCalls.push({ clientId, topK });
      return retrieved;
    }),
    createAnswerDraft: jest.fn(async (input) => ({
      id: 'ans_1',
      question: input.question,
      draftAnswer: input.draftAnswer,
      citedChunkIds: input.citedChunkIds,
      status: 'DRAFT' as const,
    })),
    listDocuments: jest.fn(),
    findAnswerStatus: jest.fn(),
    applyAnswerReview: jest.fn(),
  };

  const embedder: EmbeddingProviderPort = {
    dimensions: 1024,
    embedDocuments: jest.fn(),
    embedQuery: jest.fn(async () => [0.1, 0.2, 0.3]),
  };

  const generation: RagGenerationPort = {
    generateGroundedAnswer: jest.fn(async ({ question, contexts }) => {
      genCalls.push({ question, contexts });
      return `answer with ${contexts.length} sources`;
    }),
  };

  return {
    useCase: new QueryKnowledgeUseCase(
      repo as never,
      embedder as never,
      generation as never,
    ),
    repo,
    searchCalls,
    genCalls,
  };
}

const chunks: RetrievedChunk[] = [
  { id: 'c1', documentId: 'd1', content: 'A', score: 0.92 },
  { id: 'c2', documentId: 'd1', content: 'B', score: 0.88 },
];

describe('QueryKnowledgeUseCase', () => {
  it('retrieves tenant-scoped context, generates grounded answer, returns a DRAFT', async () => {
    const { useCase, searchCalls, genCalls } = buildSubject(chunks);

    const draft = await useCase.execute({
      clientId: 'client_1',
      askedById: 'owner_1',
      question: 'How do refunds work?',
    });

    expect(searchCalls[0].clientId).toBe('client_1');
    expect(genCalls[0].contexts).toHaveLength(2);
    expect(draft.status).toBe('DRAFT');
    expect(draft.citedChunkIds).toEqual(['c1', 'c2']);
  });

  it('defaults topK to 5 and clamps to [1, 20]', async () => {
    let s = buildSubject(chunks);
    await s.useCase.execute({ clientId: 'c', askedById: 'u', question: 'q' });
    expect(s.searchCalls[0].topK).toBe(5);

    s = buildSubject(chunks);
    await s.useCase.execute({
      clientId: 'c',
      askedById: 'u',
      question: 'q',
      topK: 100,
    });
    expect(s.searchCalls[0].topK).toBe(20);

    s = buildSubject(chunks);
    await s.useCase.execute({
      clientId: 'c',
      askedById: 'u',
      question: 'q',
      topK: 0,
    });
    expect(s.searchCalls[0].topK).toBe(1);
  });

  it('still produces a DRAFT (no citations) when retrieval is empty', async () => {
    const { useCase, genCalls } = buildSubject([]);
    const draft = await useCase.execute({
      clientId: 'c',
      askedById: 'u',
      question: 'q',
    });

    expect(genCalls[0].contexts).toEqual([]);
    expect(draft.citedChunkIds).toEqual([]);
    expect(draft.status).toBe('DRAFT');
  });
});
