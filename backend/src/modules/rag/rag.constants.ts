// DI symbols + tunables for the RAG (Retrieval-Augmented Generation) module.

export const RAG_REPOSITORY = Symbol('RAG_REPOSITORY');
export const EMBEDDING_PROVIDER = Symbol('EMBEDDING_PROVIDER');
export const TEXT_CHUNKER = Symbol('TEXT_CHUNKER');
export const RAG_GENERATION = Symbol('RAG_GENERATION');

/** Voyage `voyage-3` produces 1024-dimensional embeddings — must match the pgvector column width. */
export const EMBEDDING_DIMENSIONS = 1024;

/** Chunking defaults — ~375 tokens per chunk, with overlap so context isn't lost at boundaries. */
export const CHUNK_MAX_CHARS = 1500;
export const CHUNK_OVERLAP_CHARS = 200;

/** Retrieval defaults. */
export const DEFAULT_TOP_K = 5;
export const MAX_TOP_K = 20;
