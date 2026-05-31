/**
 * Pattern: Port — embedding provider abstraction.
 *
 * Anthropic (the project's primary AI key) has no embeddings API, so RAG needs
 * a dedicated provider. Kept adapter-friendly per the Provider Router principle
 * (CLAUDE.md §provider-neutrality): the MVP wires Voyage AI, but the concrete
 * adapter is swappable (OpenAI / Gemini / local) without touching use-cases.
 */
export interface EmbeddingProviderPort {
  /** Embedding dimensionality — must match the pgvector column width. */
  readonly dimensions: number;

  /** Embed a batch of document chunks; output order matches input order. */
  embedDocuments(texts: string[]): Promise<number[][]>;

  /** Embed a single search query. */
  embedQuery(text: string): Promise<number[]>;
}
